from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import asyncio
import resend
from twilio.rest import Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class UserRole:
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"

class LeaveStatus:
    PENDING = "pending"
    MANAGER_APPROVED = "manager_approved"
    APPROVED = "approved"
    REJECTED = "rejected"

class LeaveType:
    SICK_LEAVE = "Sick Leave"
    CASUAL_LEAVE = "Casual Leave"
    PAID_LEAVE = "Paid Leave"
    UNPAID_LEAVE = "Unpaid Leave"

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    department: str
    designation: str
    phone: Optional[str] = None
    manager_email: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str
    employee_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Employee Models
class LeaveBalance(BaseModel):
    sick_leave: int = 12
    casual_leave: int = 12
    paid_leave: int = 15
    unpaid_leave: int = 0

class EmployeeCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str
    department: str
    designation: str
    phone: Optional[str] = None
    joining_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    manager_email: Optional[str] = None
    leave_balance: LeaveBalance = Field(default_factory=LeaveBalance)

class Employee(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str
    department: str
    designation: str
    phone: Optional[str] = None
    joining_date: datetime
    manager_email: Optional[str] = None
    manager_name: Optional[str] = None
    leave_balance: LeaveBalance
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    manager_email: Optional[str] = None
    employee_id: Optional[str] = None

# Leave Models
class ApprovalRecord(BaseModel):
    approver_email: str
    approver_name: str
    approver_role: str
    action: str  # approved/rejected
    comments: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaveApplication(BaseModel):
    leave_type: str
    start_date: datetime
    end_date: datetime
    reason: str
    is_half_day: bool = False
    half_day_period: Optional[str] = None  # 'morning' or 'afternoon'

class Leave(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    employee_email: EmailStr
    manager_email: Optional[EmailStr] = None
    leave_type: str
    start_date: datetime
    end_date: datetime
    days_count: float  # Changed to float to support 0.5 for half-day
    reason: str
    is_half_day: bool = False
    half_day_period: Optional[str] = None
    status: str = LeaveStatus.PENDING
    approvals: List[ApprovalRecord] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaveAction(BaseModel):
    action: str  # approve/reject
    comments: Optional[str] = None

class DashboardStats(BaseModel):
    total_employees: int = 0
    pending_leaves: int = 0
    approved_leaves_this_month: int = 0
    my_leave_balance: Optional[LeaveBalance] = None
    recent_leaves: List[Leave] = []

# ============= UTILITY FUNCTIONS =============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if user_doc is None:
        raise credentials_exception
    
    # Convert ISO string timestamps back to datetime
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

async def get_current_employee(current_user: User = Depends(get_current_user)):
    employee = await db.employees.find_one({"email": current_user.email}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    # Convert ISO strings to datetime
    for field in ['joining_date', 'created_at']:
        if isinstance(employee.get(field), str):
            employee[field] = datetime.fromisoformat(employee[field])
    
    return Employee(**employee)

def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

def calculate_days(start_date: datetime, end_date: datetime, is_half_day: bool = False) -> float:
    delta = end_date - start_date
    days = delta.days + 1
    
    if is_half_day and days == 1:
        return 0.5
    return float(days)

# ============= AUTH ENDPOINTS =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate unique employee_id
    employee_id = await generate_employee_id()
    hashed_password = get_password_hash(user_data.password)
    
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        employee_id=employee_id
    )
    
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    user_doc['hashed_password'] = hashed_password
    
    await db.users.insert_one(user_doc)
    
    # Create employee profile
    manager_name = None
    if user_data.manager_email:
        manager = await db.employees.find_one({"email": user_data.manager_email}, {"_id": 0})
        if manager:
            manager_name = manager.get('full_name')
    
    employee = Employee(
        id=employee_id,
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        department=user_data.department,
        designation=user_data.designation,
        phone=user_data.phone,
        joining_date=datetime.now(timezone.utc),
        manager_email=user_data.manager_email,
        manager_name=manager_name,
        leave_balance=LeaveBalance()
    )
    
    emp_doc = employee.model_dump()
    emp_doc['joining_date'] = emp_doc['joining_date'].isoformat()
    emp_doc['created_at'] = emp_doc['created_at'].isoformat()
    
    await db.employees.insert_one(emp_doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user.model_dump()
    )

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['hashed_password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Convert ISO string to datetime
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user.model_dump()
    )

@api_router.get("/auth/me", response_model=Employee)
async def get_me(current_employee: Employee = Depends(get_current_employee)):
    return current_employee

# ============= EMPLOYEE ENDPOINTS =============

async def get_employee_id_settings():
    """Get employee ID prefix from settings"""
    settings = await db.employee_id_settings.find_one({}, {"_id": 0})
    if settings:
        return settings.get('prefix', 'EMP'), settings.get('counter', 1000)
    return 'EMP', 1000

async def generate_employee_id():
    """Generate unique employee ID with prefix"""
    prefix, counter = await get_employee_id_settings()
    
    # Find the highest counter used
    employees = await db.employees.find({}, {"_id": 0, "employee_id": 1}).to_list(10000)
    max_counter = counter
    
    for emp in employees:
        emp_id = emp.get('employee_id', '')
        if emp_id.startswith(prefix):
            try:
                num = int(emp_id.replace(prefix, ''))
                max_counter = max(max_counter, num)
            except ValueError:
                pass
    
    new_counter = max_counter + 1
    return f"{prefix}{new_counter:04d}"

async def validate_employee_id_unique(employee_id: str, exclude_id: str = None):
    """Validate that employee ID is unique"""
    query = {"employee_id": employee_id}
    if exclude_id:
        query["id"] = {"$ne": exclude_id}
    
    existing = await db.employees.find_one(query, {"_id": 0})
    return existing is None

@api_router.get("/employees", response_model=List[Employee])
async def get_all_employees(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    
    for emp in employees:
        for field in ['joining_date', 'created_at']:
            if isinstance(emp.get(field), str):
                emp[field] = datetime.fromisoformat(emp[field])
    
    return employees

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, current_user: User = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    for field in ['joining_date', 'created_at']:
        if isinstance(employee.get(field), str):
            employee[field] = datetime.fromisoformat(employee[field])
    
    return Employee(**employee)

@api_router.post("/employees", response_model=Employee)
async def create_employee(
    employee_data: EmployeeCreate,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    # Check if user exists
    existing_user = await db.users.find_one({"email": employee_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate unique employee_id
    employee_id = await generate_employee_id()
    hashed_password = get_password_hash(employee_data.password)
    
    user = User(
        email=employee_data.email,
        full_name=employee_data.full_name,
        role=employee_data.role,
        employee_id=employee_id
    )
    
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    user_doc['hashed_password'] = hashed_password
    
    await db.users.insert_one(user_doc)
    
    # Auto-assign manager based on department if employee role
    manager_email = employee_data.manager_email
    manager_name = None
    
    if employee_data.role == UserRole.EMPLOYEE and not manager_email:
        # Find a manager in the same department
        dept_manager = await db.employees.find_one({
            "department": employee_data.department,
            "role": UserRole.MANAGER
        }, {"_id": 0})
        
        if dept_manager:
            manager_email = dept_manager['email']
            manager_name = dept_manager.get('full_name')
    elif manager_email:
        manager = await db.employees.find_one({"email": manager_email}, {"_id": 0})
        if manager:
            manager_name = manager.get('full_name')
    
    # Create employee
    employee = Employee(
        id=employee_id,
        email=employee_data.email,
        full_name=employee_data.full_name,
        role=employee_data.role,
        department=employee_data.department,
        designation=employee_data.designation,
        phone=employee_data.phone,
        joining_date=employee_data.joining_date,
        manager_email=manager_email,
        manager_name=manager_name,
        leave_balance=employee_data.leave_balance
    )
    
    emp_doc = employee.model_dump()
    emp_doc['joining_date'] = emp_doc['joining_date'].isoformat()
    emp_doc['created_at'] = emp_doc['created_at'].isoformat()
    
    await db.employees.insert_one(emp_doc)
    
    return employee

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(
    employee_id: str,
    update_data: EmployeeUpdate,
    current_user: User = Depends(get_current_user)
):
    # Check if employee exists
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Only admin or the employee themselves can update
    if current_user.role != UserRole.ADMIN and employee['email'] != current_user.email:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Prepare update data
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # Validate employee_id uniqueness if being updated
    if 'employee_id' in update_dict and update_dict['employee_id']:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only admins can update employee ID")
        
        is_unique = await validate_employee_id_unique(update_dict['employee_id'], exclude_id=employee_id)
        if not is_unique:
            raise HTTPException(status_code=400, detail="Employee ID already exists. Please choose a unique ID.")
    
    # Get manager name if manager_email is being updated
    if 'manager_email' in update_dict and update_dict['manager_email']:
        manager = await db.employees.find_one({"email": update_dict['manager_email']}, {"_id": 0})
        if manager:
            update_dict['manager_name'] = manager.get('full_name')
    
    if update_dict:
        await db.employees.update_one(
            {"id": employee_id},
            {"$set": update_dict}
        )
    
    # Fetch updated employee
    updated_employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    
    for field in ['joining_date', 'created_at']:
        if isinstance(updated_employee.get(field), str):
            updated_employee[field] = datetime.fromisoformat(updated_employee[field])
    
    return Employee(**updated_employee)

class RoleUpdate(BaseModel):
    role: str

@api_router.put("/employees/{employee_id}/role")
async def update_employee_role(
    employee_id: str,
    role_data: RoleUpdate,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    # Check if employee exists
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Validate role
    if role_data.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Update role in both users and employees collections
    await db.users.update_one(
        {"email": employee['email']},
        {"$set": {"role": role_data.role}}
    )
    
    await db.employees.update_one(
        {"id": employee_id},
        {"$set": {"role": role_data.role}}
    )
    
    return {"message": f"Role updated to {role_data.role}", "employee_id": employee_id, "new_role": role_data.role}

@api_router.delete("/employees/{employee_id}")
async def delete_employee(
    employee_id: str,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Delete user and employee
    await db.users.delete_one({"email": employee['email']})
    await db.employees.delete_one({"id": employee_id})
    
    return {"message": "Employee deleted successfully"}

class LeaveBalanceAdjustment(BaseModel):
    leave_type: str
    adjustment: float
    reason: str

class CompOffGrant(BaseModel):
    employee_id: str
    employee_email: EmailStr
    employee_name: str
    days: float
    work_date: str
    reason: str
    granted_by: EmailStr
    granted_by_role: str

@api_router.put("/employees/{employee_id}/leave-balance")
async def adjust_leave_balance(
    employee_id: str,
    adjustment_data: LeaveBalanceAdjustment,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    # Check if employee exists
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Validate leave type key
    valid_keys = ['sick_leave', 'casual_leave', 'paid_leave', 'unpaid_leave']
    if adjustment_data.leave_type not in valid_keys:
        raise HTTPException(status_code=400, detail="Invalid leave type")
    
    # Get current balance
    current_balance = employee.get('leave_balance', {}).get(adjustment_data.leave_type, 0)
    new_balance = current_balance + adjustment_data.adjustment
    
    # Prevent negative balance
    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Cannot deduct more than available balance")
    
    # Update balance
    await db.employees.update_one(
        {"id": employee_id},
        {"$set": {f"leave_balance.{adjustment_data.leave_type}": new_balance}}
    )
    
    # Log the adjustment (optional - for audit trail)
    adjustment_log = {
        "employee_id": employee_id,
        "employee_email": employee['email'],
        "leave_type": adjustment_data.leave_type,
        "adjustment": adjustment_data.adjustment,
        "reason": adjustment_data.reason,
        "adjusted_by": current_user.email,
        "adjusted_by_role": current_user.role,
        "previous_balance": current_balance,
        "new_balance": new_balance,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.leave_adjustments.insert_one(adjustment_log)
    
    return {
        "message": "Leave balance adjusted successfully",
        "employee_id": employee_id,
        "leave_type": adjustment_data.leave_type,
        "previous_balance": current_balance,
        "adjustment": adjustment_data.adjustment,
        "new_balance": new_balance
    }

class EmployeeIdSettings(BaseModel):
    prefix: str = "EMP"
    counter: int = 1000

@api_router.get("/employee-id-settings", response_model=EmployeeIdSettings)
async def get_employee_id_settings_endpoint(
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Get current employee ID settings"""
    settings = await db.employee_id_settings.find_one({}, {"_id": 0})
    if not settings:
        return EmployeeIdSettings()
    return EmployeeIdSettings(**settings)

@api_router.post("/employee-id-settings")
async def update_employee_id_settings(
    settings: EmployeeIdSettings,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Update employee ID settings"""
    settings_dict = settings.model_dump()
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    settings_dict["updated_by"] = current_user.email
    
    # Upsert settings
    await db.employee_id_settings.delete_many({})
    await db.employee_id_settings.insert_one(settings_dict)
    
    return {"message": "Employee ID settings updated successfully", "settings": settings_dict}

# ============= LEAVE ENDPOINTS =============

@api_router.post("/leaves", response_model=Leave)
async def apply_leave(
    leave_data: LeaveApplication,
    current_employee: Employee = Depends(get_current_employee)
):
    # Calculate days
    days_count = calculate_days(leave_data.start_date, leave_data.end_date, leave_data.is_half_day)
    
    # Check leave balance
    leave_balance_dict = current_employee.leave_balance.model_dump()
    leave_type_key = leave_data.leave_type.lower().replace(' ', '_')
    
    if leave_type_key in leave_balance_dict:
        available = leave_balance_dict[leave_type_key]
        if leave_data.leave_type != LeaveType.UNPAID_LEAVE and available < days_count:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient leave balance. Available: {available} days"
            )
    
    # Create leave application
    leave = Leave(
        employee_id=current_employee.id,
        employee_name=current_employee.full_name,
        employee_email=current_employee.email,
        manager_email=current_employee.manager_email,
        leave_type=leave_data.leave_type,
        start_date=leave_data.start_date,
        end_date=leave_data.end_date,
        days_count=days_count,
        reason=leave_data.reason,
        is_half_day=leave_data.is_half_day,
        half_day_period=leave_data.half_day_period,
        status=LeaveStatus.PENDING
    )
    
    leave_doc = leave.model_dump()
    leave_doc['start_date'] = leave_doc['start_date'].isoformat()
    leave_doc['end_date'] = leave_doc['end_date'].isoformat()
    leave_doc['created_at'] = leave_doc['created_at'].isoformat()
    leave_doc['updated_at'] = leave_doc['updated_at'].isoformat()
    
    await db.leaves.insert_one(leave_doc)
    
    # Send notification to manager
    try:
        # Find manager by department
        manager = await db.employees.find_one(
            {"department": current_employee.department, "role": "manager"},
            {"_id": 0}
        )
        
        if manager:
            # Send email notification
            email_html = generate_leave_application_email(
                employee_name=current_employee.full_name,
                leave_type=leave_data.leave_type,
                start_date=leave_data.start_date.strftime("%Y-%m-%d"),
                end_date=leave_data.end_date.strftime("%Y-%m-%d"),
                reason=leave_data.reason
            )
            await send_email_notification(
                to_email=manager.get('email'),
                subject=f"Leave Application from {current_employee.full_name}",
                html_content=email_html
            )
            
            # Send WhatsApp notification if phone available
            if manager.get('phone'):
                whatsapp_msg = f"New leave application from {current_employee.full_name}\nType: {leave_data.leave_type}\nDates: {leave_data.start_date.strftime('%Y-%m-%d')} to {leave_data.end_date.strftime('%Y-%m-%d')}\nReason: {leave_data.reason}"
                await send_whatsapp_notification(manager.get('phone'), whatsapp_msg)
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")
    
    return leave

@api_router.get("/leaves/my-leaves", response_model=List[Leave])
async def get_my_leaves(current_employee: Employee = Depends(get_current_employee)):
    leaves = await db.leaves.find(
        {"employee_email": current_employee.email},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for leave in leaves:
        for field in ['start_date', 'end_date', 'created_at', 'updated_at']:
            if isinstance(leave.get(field), str):
                leave[field] = datetime.fromisoformat(leave[field])
        for approval in leave.get('approvals', []):
            if isinstance(approval.get('timestamp'), str):
                approval['timestamp'] = datetime.fromisoformat(approval['timestamp'])
    
    return leaves

@api_router.get("/leaves/pending", response_model=List[Leave])
async def get_pending_leaves(
    current_user: User = Depends(get_current_user),
    current_employee: Employee = Depends(get_current_employee)
):
    query = {}
    
    if current_user.role == UserRole.MANAGER:
        # Managers see pending leaves from their team
        query = {
            "manager_email": current_employee.email,
            "status": LeaveStatus.PENDING
        }
    elif current_user.role == UserRole.ADMIN:
        # Admin sees all pending and manager-approved leaves
        query = {
            "status": {"$in": [LeaveStatus.PENDING, LeaveStatus.MANAGER_APPROVED]}
        }
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    leaves = await db.leaves.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for leave in leaves:
        for field in ['start_date', 'end_date', 'created_at', 'updated_at']:
            if isinstance(leave.get(field), str):
                leave[field] = datetime.fromisoformat(leave[field])
        for approval in leave.get('approvals', []):
            if isinstance(approval.get('timestamp'), str):
                approval['timestamp'] = datetime.fromisoformat(approval['timestamp'])
    
    return leaves

@api_router.get("/leaves/all", response_model=List[Leave])
async def get_all_leaves(
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    leaves = await db.leaves.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for leave in leaves:
        for field in ['start_date', 'end_date', 'created_at', 'updated_at']:
            if isinstance(leave.get(field), str):
                leave[field] = datetime.fromisoformat(leave[field])
        for approval in leave.get('approvals', []):
            if isinstance(approval.get('timestamp'), str):
                approval['timestamp'] = datetime.fromisoformat(approval['timestamp'])
    
    return leaves

@api_router.put("/leaves/{leave_id}/action", response_model=Leave)
async def action_on_leave(
    leave_id: str,
    action_data: LeaveAction,
    current_user: User = Depends(get_current_user),
    current_employee: Employee = Depends(get_current_employee)
):
    # Fetch leave
    leave_doc = await db.leaves.find_one({"id": leave_id}, {"_id": 0})
    if not leave_doc:
        raise HTTPException(status_code=404, detail="Leave not found")
    
    # Convert dates
    for field in ['start_date', 'end_date', 'created_at', 'updated_at']:
        if isinstance(leave_doc.get(field), str):
            leave_doc[field] = datetime.fromisoformat(leave_doc[field])
    for approval in leave_doc.get('approvals', []):
        if isinstance(approval.get('timestamp'), str):
            approval['timestamp'] = datetime.fromisoformat(approval['timestamp'])
    
    leave = Leave(**leave_doc)
    
    # Check permissions and determine new status
    new_status = leave.status
    
    if current_user.role == UserRole.MANAGER:
        # Manager can only approve pending leaves from their team
        if leave.status != LeaveStatus.PENDING:
            raise HTTPException(status_code=400, detail="Leave is not pending")
        if leave.manager_email != current_employee.email:
            raise HTTPException(status_code=403, detail="Not your team member")
        
        if action_data.action == "approve":
            new_status = LeaveStatus.MANAGER_APPROVED
        else:
            new_status = LeaveStatus.REJECTED
    
    elif current_user.role == UserRole.ADMIN:
        # Admin can approve manager-approved or pending leaves
        if leave.status not in [LeaveStatus.PENDING, LeaveStatus.MANAGER_APPROVED]:
            raise HTTPException(status_code=400, detail="Leave already processed")
        
        if action_data.action == "approve":
            new_status = LeaveStatus.APPROVED
        else:
            new_status = LeaveStatus.REJECTED
    
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Add approval record
    approval_record = ApprovalRecord(
        approver_email=current_employee.email,
        approver_name=current_employee.full_name,
        approver_role=current_user.role,
        action=action_data.action,
        comments=action_data.comments
    )
    
    leave.approvals.append(approval_record)
    leave.status = new_status
    leave.updated_at = datetime.now(timezone.utc)
    
    # Update leave balance if approved
    if new_status == LeaveStatus.APPROVED and leave.leave_type != LeaveType.UNPAID_LEAVE:
        leave_type_key = leave.leave_type.lower().replace(' ', '_')
        await db.employees.update_one(
            {"email": leave.employee_email},
            {"$inc": {f"leave_balance.{leave_type_key}": -leave.days_count}}
        )
    
    # Update leave in database
    update_doc = leave.model_dump()
    update_doc['start_date'] = update_doc['start_date'].isoformat()
    update_doc['end_date'] = update_doc['end_date'].isoformat()
    update_doc['created_at'] = update_doc['created_at'].isoformat()
    update_doc['updated_at'] = update_doc['updated_at'].isoformat()
    for approval in update_doc['approvals']:
        approval['timestamp'] = approval['timestamp'].isoformat()
    
    await db.leaves.update_one(
        {"id": leave_id},
        {"$set": update_doc}
    )
    
    # Send notifications
    try:
        # Get employee details
        employee = await db.employees.find_one({"email": leave.employee_email}, {"_id": 0})
        
        if new_status in [LeaveStatus.APPROVED, LeaveStatus.REJECTED]:
            # Notify employee
            status_text = "approved" if new_status == LeaveStatus.APPROVED else "rejected"
            email_html = generate_leave_approval_email(
                employee_name=leave.employee_name,
                leave_type=leave.leave_type,
                start_date=leave.start_date.strftime("%Y-%m-%d"),
                end_date=leave.end_date.strftime("%Y-%m-%d"),
                status=status_text
            )
            await send_email_notification(
                to_email=leave.employee_email,
                subject=f"Leave {status_text.capitalize()} - {leave.leave_type}",
                html_content=email_html
            )
            
            # Send WhatsApp if phone available
            if employee and employee.get('phone'):
                whatsapp_msg = f"Your leave application has been {status_text.upper()}!\n\nType: {leave.leave_type}\nDates: {leave.start_date.strftime('%Y-%m-%d')} to {leave.end_date.strftime('%Y-%m-%d')}"
                await send_whatsapp_notification(employee.get('phone'), whatsapp_msg)
        
        elif new_status == LeaveStatus.MANAGER_APPROVED:
            # Notify admin and employee
            email_html = generate_leave_approval_email(
                employee_name=leave.employee_name,
                leave_type=leave.leave_type,
                start_date=leave.start_date.strftime("%Y-%m-%d"),
                end_date=leave.end_date.strftime("%Y-%m-%d"),
                status="approved by manager (pending admin approval)"
            )
            
            # Notify employee
            await send_email_notification(
                to_email=leave.employee_email,
                subject="Leave Approved by Manager - Pending Admin Approval",
                html_content=email_html
            )
            
            # Notify admin
            admin = await db.employees.find_one({"role": "admin"}, {"_id": 0})
            if admin:
                admin_html = generate_leave_application_email(
                    employee_name=leave.employee_name,
                    leave_type=leave.leave_type,
                    start_date=leave.start_date.strftime("%Y-%m-%d"),
                    end_date=leave.end_date.strftime("%Y-%m-%d"),
                    reason=leave.reason
                )
                await send_email_notification(
                    to_email=admin.get('email'),
                    subject=f"Leave Approved by Manager - {leave.employee_name}",
                    html_content=admin_html
                )
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")
    
    return leave

# ============= DASHBOARD ENDPOINTS =============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    current_employee: Employee = Depends(get_current_employee)
):
    stats = DashboardStats()
    
    if current_user.role == UserRole.ADMIN:
        # Admin stats
        stats.total_employees = await db.employees.count_documents({})
        stats.pending_leaves = await db.leaves.count_documents(
            {"status": {"$in": [LeaveStatus.PENDING, LeaveStatus.MANAGER_APPROVED]}}
        )
        
        # Approved leaves this month
        start_of_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        stats.approved_leaves_this_month = await db.leaves.count_documents({
            "status": LeaveStatus.APPROVED,
            "created_at": {"$gte": start_of_month.isoformat()}
        })
        
    elif current_user.role == UserRole.MANAGER:
        # Manager stats
        team_count = await db.employees.count_documents({"manager_email": current_employee.email})
        stats.total_employees = team_count
        stats.pending_leaves = await db.leaves.count_documents({
            "manager_email": current_employee.email,
            "status": LeaveStatus.PENDING
        })
    
    # Employee's own leave balance
    stats.my_leave_balance = current_employee.leave_balance
    
    # Recent leaves
    if current_user.role == UserRole.ADMIN:
        query = {}
    elif current_user.role == UserRole.MANAGER:
        query = {"manager_email": current_employee.email}
    else:
        query = {"employee_email": current_employee.email}
    
    recent = await db.leaves.find(query, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    for leave in recent:
        for field in ['start_date', 'end_date', 'created_at', 'updated_at']:
            if isinstance(leave.get(field), str):
                leave[field] = datetime.fromisoformat(leave[field])
        for approval in leave.get('approvals', []):
            if isinstance(approval.get('timestamp'), str):
                approval['timestamp'] = datetime.fromisoformat(approval['timestamp'])
    
    stats.recent_leaves = [Leave(**leave) for leave in recent]
    
    return stats

# ============= COMP-OFF ENDPOINTS =============

@api_router.post("/comp-off/grant")
async def grant_comp_off(
    comp_off_data: CompOffGrant,
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    # Verify employee exists
    employee = await db.employees.find_one({"id": comp_off_data.employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Create comp-off record
    comp_off_record = {
        "id": str(uuid.uuid4()),
        "employee_id": comp_off_data.employee_id,
        "employee_email": comp_off_data.employee_email,
        "employee_name": comp_off_data.employee_name,
        "days": comp_off_data.days,
        "used": 0,
        "work_date": comp_off_data.work_date,
        "reason": comp_off_data.reason,
        "granted_by": comp_off_data.granted_by,
        "granted_by_role": comp_off_data.granted_by_role,
        "granted_date": datetime.now(timezone.utc).isoformat(),
        "expiry_date": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()  # 90 days validity
    }
    
    await db.comp_off_records.insert_one(comp_off_record)
    
    return {
        "message": "Comp-off granted successfully",
        "comp_off_id": comp_off_record["id"],
        "days": comp_off_data.days
    }

@api_router.get("/comp-off/records")
async def get_comp_off_records(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    records = await db.comp_off_records.find({}, {"_id": 0}).to_list(1000)
    return records

# ============= NOTIFICATION SYSTEM =============

class NotificationSettings(BaseModel):
    email_enabled: bool = False
    whatsapp_enabled: bool = False
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    from_email: Optional[str] = None
    from_name: Optional[str] = "HRMS System"
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None

@api_router.post("/notification-settings")
async def save_notification_settings(
    settings: NotificationSettings,
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    """Save notification settings to database"""
    try:
        settings_dict = settings.model_dump()
        settings_dict["updated_at"] = datetime.now(timezone.utc)
        settings_dict["updated_by"] = current_user.email
        
        # Upsert settings
        await db.notification_settings.delete_many({})
        await db.notification_settings.insert_one(settings_dict)
        
        return {"status": "success", "message": "Notification settings saved"}
    except Exception as e:
        logger.error(f"Failed to save notification settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/notification-settings")
async def get_notification_settings(
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Get current notification settings"""
    settings = await db.notification_settings.find_one({}, {"_id": 0})
    if not settings:
        return NotificationSettings().model_dump()
    return settings

async def send_email_notification(to_email: str, subject: str, html_content: str):
    """Send email using Resend API"""
    try:
        # Get settings from database
        settings = await db.notification_settings.find_one({}, {"_id": 0})
        if not settings or not settings.get("email_enabled"):
            logger.info("Email notifications disabled")
            return False
        
        # Use Resend if using Resend API key
        if settings.get("from_email", "").endswith("@resend.dev") or os.environ.get("RESEND_API_KEY"):
            resend.api_key = os.environ.get("RESEND_API_KEY") or settings.get("smtp_password")
            params = {
                "from": settings.get("from_email", "onboarding@resend.dev"),
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            email = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Email sent to {to_email} via Resend: {email.get('id')}")
            return True
        else:
            # Use SMTP for other providers
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{settings.get('from_name')} <{settings.get('from_email')}>"
            msg['To'] = to_email
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            def send_smtp():
                with smtplib.SMTP(settings.get('smtp_host'), settings.get('smtp_port', 587)) as server:
                    server.starttls()
                    server.login(settings.get('smtp_username'), settings.get('smtp_password'))
                    server.send_message(msg)
            
            await asyncio.to_thread(send_smtp)
            logger.info(f"Email sent to {to_email} via SMTP")
            return True
            
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

async def send_whatsapp_notification(to_phone: str, message: str):
    """Send WhatsApp message using Twilio"""
    try:
        # Get settings from database
        settings = await db.notification_settings.find_one({}, {"_id": 0})
        if not settings or not settings.get("whatsapp_enabled"):
            logger.info("WhatsApp notifications disabled")
            return False
        
        twilio_sid = settings.get("twilio_account_sid")
        twilio_token = settings.get("twilio_auth_token")
        twilio_number = settings.get("twilio_phone_number")
        
        if not all([twilio_sid, twilio_token, twilio_number]):
            logger.warning("Twilio credentials not configured")
            return False
        
        def send_twilio():
            client = Client(twilio_sid, twilio_token)
            message_obj = client.messages.create(
                body=message,
                from_=f"whatsapp:{twilio_number}",
                to=f"whatsapp:{to_phone}"
            )
            return message_obj.sid
        
        message_sid = await asyncio.to_thread(send_twilio)
        logger.info(f"WhatsApp sent to {to_phone}: {message_sid}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send WhatsApp to {to_phone}: {str(e)}")
        return False

def generate_leave_application_email(employee_name: str, leave_type: str, start_date: str, end_date: str, reason: str):
    """Generate HTML email for leave application"""
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1e293b; border-bottom: 3px solid #10b981; padding-bottom: 10px;">Leave Application Submitted</h2>
            <p>Hello,</p>
            <p><strong>{employee_name}</strong> has applied for leave with the following details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Leave Type:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{leave_type}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Start Date:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{start_date}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>End Date:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{end_date}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Reason:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{reason}</td>
                </tr>
            </table>
            <p style="margin-top: 20px; padding: 15px; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 4px;">
                Please review and approve/reject this leave application at your earliest convenience.
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                This is an automated notification from HRMS Leave Management System.
            </p>
        </div>
    </body>
    </html>
    """

def generate_leave_approval_email(employee_name: str, leave_type: str, start_date: str, end_date: str, status: str):
    """Generate HTML email for leave approval/rejection"""
    is_approved = status.lower() == "approved"
    status_color = "#10b981" if is_approved else "#ef4444"
    status_text = "Approved" if is_approved else "Rejected"
    
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: {status_color}; border-bottom: 3px solid {status_color}; padding-bottom: 10px;">Leave {status_text}</h2>
            <p>Hello <strong>{employee_name}</strong>,</p>
            <p>Your leave application has been <strong style="color: {status_color};">{status_text.upper()}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Leave Type:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{leave_type}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Start Date:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{start_date}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>End Date:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{end_date}</td>
                </tr>
            </table>
            <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                This is an automated notification from HRMS Leave Management System.
            </p>
        </div>
    </body>
    </html>
    """

def generate_welcome_email(employee_name: str, employee_id: str, email: str, role: str, department: str, designation: str):
    """Generate welcome email for new employee"""
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #10b981; border-bottom: 3px solid #10b981; padding-bottom: 10px;">Welcome to HRMS! 🎉</h2>
            <p>Dear <strong>{employee_name}</strong>,</p>
            <p>Welcome aboard! Your account has been successfully created in our HRMS Leave Management System.</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #166534;">Your Account Details</h3>
                <table style="width: 100%;">
                    <tr>
                        <td style="padding: 5px 0;"><strong>Employee ID:</strong></td>
                        <td style="padding: 5px 0;">{employee_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Email:</strong></td>
                        <td style="padding: 5px 0;">{email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Role:</strong></td>
                        <td style="padding: 5px 0; text-transform: capitalize;">{role}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Department:</strong></td>
                        <td style="padding: 5px 0;">{department}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Designation:</strong></td>
                        <td style="padding: 5px 0;">{designation}</td>
                    </tr>
                </table>
            </div>
            
            <p>You can now:</p>
            <ul>
                <li>Apply for leaves</li>
                <li>View your leave balance</li>
                <li>Track leave application status</li>
                <li>Update your profile information</li>
            </ul>
            
            <p style="margin-top: 20px;">If you have any questions, please contact your HR administrator.</p>
            
            <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                This is an automated notification from HRMS Leave Management System.
            </p>
        </div>
    </body>
    </html>
    """

def generate_new_employee_notification_email(employee_name: str, employee_id: str, email: str, role: str, department: str, designation: str, admin_name: str):
    """Generate notification email to admin about new employee"""
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #1e293b; border-bottom: 3px solid #3b82f6; padding-bottom: 10px;">New Employee Added</h2>
            <p>Hello {admin_name},</p>
            <p>A new employee has been added to the HRMS system:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background-color: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Employee Name:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{employee_name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Employee ID:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{employee_id}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Email:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{email}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Role:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0; text-transform: capitalize;">{role}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Department:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{department}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Designation:</strong></td>
                    <td style="padding: 10px; border: 1px solid #e2e8f0;">{designation}</td>
                </tr>
            </table>
            
            <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                This is an automated notification from HRMS Leave Management System.
            </p>
        </div>
    </body>
    </html>
    """

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()