"""
Script to add sample data to HRMS database for testing
Run this after setting up the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
import random

load_dotenv()

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "hrms_db")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def add_sample_data():
    """Add sample organizations, employees, and leaves"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("🚀 Adding sample data to HRMS database...")
    
    # 1. Add Organizations
    print("\n📊 Adding Organizations...")
    organizations = [
        {
            "id": "org1",
            "name": "Tech Solutions Inc",
            "description": "Technology consulting and software development",
            "logo_url": "https://via.placeholder.com/150/3B82F6/FFFFFF?text=TS",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "admin@test.com"
        },
        {
            "id": "org2",
            "name": "Marketing Wizards",
            "description": "Digital marketing and brand strategy",
            "logo_url": "https://via.placeholder.com/150/10B981/FFFFFF?text=MW",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "admin@test.com"
        }
    ]
    
    await db.organizations.delete_many({})  # Clear existing
    await db.organizations.insert_many(organizations)
    print(f"✅ Added {len(organizations)} organizations")
    
    # 2. Add Employees with Salaries
    print("\n👥 Adding Employees with Salaries...")
    employees = []
    
    # Admin
    employees.append({
        "id": "EMP1001",
        "employee_id": "EMP1001",
        "email": "admin.sample@example.com",
        "hashed_password": pwd_context.hash("password123"),
        "full_name": "Sarah Johnson",
        "role": "admin",
        "department": "Human Resources",
        "designation": "HR Director",
        "phone": "+1234567001",
        "monthly_salary": 80000.0,
        "organization_id": "org1",
        "organization_name": "Tech Solutions Inc",
        "joining_date": (datetime.now(timezone.utc) - timedelta(days=730)).isoformat(),
        "manager_email": None,
        "manager_name": None,
        "leave_balance": {
            "sick_leave": 12.0,
            "casual_leave": 12.0,
            "paid_leave": 15.0,
            "unpaid_leave": 0.0
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Managers
    managers = [
        {
            "id": "EMP1002",
            "employee_id": "EMP1002",
            "email": "john.manager@example.com",
            "hashed_password": pwd_context.hash("password123"),
            "full_name": "John Smith",
            "role": "manager",
            "department": "Engineering",
            "designation": "Engineering Manager",
            "phone": "+1234567002",
            "monthly_salary": 70000.0,
            "organization_id": "org1",
            "organization_name": "Tech Solutions Inc",
            "joining_date": (datetime.now(timezone.utc) - timedelta(days=600)).isoformat(),
            "manager_email": "admin.sample@example.com",
            "manager_name": "Sarah Johnson",
            "leave_balance": {
                "sick_leave": 10.0,
                "casual_leave": 10.0,
                "paid_leave": 13.0,
                "unpaid_leave": 0.0
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "EMP1003",
            "employee_id": "EMP1003",
            "email": "emily.manager@example.com",
            "hashed_password": pwd_context.hash("password123"),
            "full_name": "Emily Davis",
            "role": "manager",
            "department": "Marketing",
            "designation": "Marketing Manager",
            "phone": "+1234567003",
            "monthly_salary": 65000.0,
            "organization_id": "org2",
            "organization_name": "Marketing Wizards",
            "joining_date": (datetime.now(timezone.utc) - timedelta(days=550)).isoformat(),
            "manager_email": "admin.sample@example.com",
            "manager_name": "Sarah Johnson",
            "leave_balance": {
                "sick_leave": 11.0,
                "casual_leave": 11.0,
                "paid_leave": 14.0,
                "unpaid_leave": 0.0
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    employees.extend(managers)
    
    # Employees
    sample_employees = [
        {
            "name": "Michael Brown",
            "email": "michael.brown@example.com",
            "id": "EMP1004",
            "dept": "Engineering",
            "designation": "Senior Developer",
            "salary": 55000.0,
            "org": "org1",
            "org_name": "Tech Solutions Inc",
            "manager": "john.manager@example.com"
        },
        {
            "name": "Jessica Wilson",
            "email": "jessica.wilson@example.com",
            "id": "EMP1005",
            "dept": "Engineering",
            "designation": "Full Stack Developer",
            "salary": 50000.0,
            "org": "org1",
            "org_name": "Tech Solutions Inc",
            "manager": "john.manager@example.com"
        },
        {
            "name": "David Martinez",
            "email": "david.martinez@example.com",
            "id": "EMP1006",
            "dept": "Marketing",
            "designation": "Content Writer",
            "salary": 40000.0,
            "org": "org2",
            "org_name": "Marketing Wizards",
            "manager": "emily.manager@example.com"
        },
        {
            "name": "Lisa Anderson",
            "email": "lisa.anderson@example.com",
            "id": "EMP1007",
            "dept": "Marketing",
            "designation": "Social Media Manager",
            "salary": 45000.0,
            "org": "org2",
            "org_name": "Marketing Wizards",
            "manager": "emily.manager@example.com"
        },
        {
            "name": "Robert Taylor",
            "email": "robert.taylor@example.com",
            "id": "EMP1008",
            "dept": "Engineering",
            "designation": "DevOps Engineer",
            "salary": 52000.0,
            "org": "org1",
            "org_name": "Tech Solutions Inc",
            "manager": "john.manager@example.com"
        },
        {
            "name": "Amanda White",
            "email": "amanda.white@example.com",
            "id": "EMP1009",
            "dept": "Human Resources",
            "designation": "HR Specialist",
            "salary": 42000.0,
            "org": "org1",
            "org_name": "Tech Solutions Inc",
            "manager": "admin.sample@example.com"
        }
    ]
    
    for idx, emp_data in enumerate(sample_employees):
        employee = {
            "id": emp_data["id"],
            "employee_id": emp_data["id"],
            "email": emp_data["email"],
            "hashed_password": pwd_context.hash("password123"),
            "full_name": emp_data["name"],
            "role": "employee",
            "department": emp_data["dept"],
            "designation": emp_data["designation"],
            "phone": f"+123456{7004 + idx}",
            "monthly_salary": emp_data["salary"],
            "organization_id": emp_data["org"],
            "organization_name": emp_data["org_name"],
            "joining_date": (datetime.now(timezone.utc) - timedelta(days=random.randint(100, 500))).isoformat(),
            "manager_email": emp_data["manager"],
            "manager_name": None,
            "leave_balance": {
                "sick_leave": random.uniform(8, 12),
                "casual_leave": random.uniform(8, 12),
                "paid_leave": random.uniform(10, 15),
                "unpaid_leave": 0.0
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        employees.append(employee)
    
    # Insert employees (don't delete existing, just add new)
    for emp in employees:
        existing = await db.employees.find_one({"email": emp["email"]})
        if not existing:
            await db.employees.insert_one(emp)
            print(f"  ✅ Added: {emp['full_name']} ({emp['email']})")
        else:
            print(f"  ⏭️  Skipped: {emp['full_name']} (already exists)")
    
    # 3. Add Sample Leaves (for last month and current month)
    print("\n📅 Adding Sample Leaves...")
    last_month = datetime.now(timezone.utc) - timedelta(days=30)
    current_month = datetime.now(timezone.utc)
    
    sample_leaves = [
        {
            "employee_id": "EMP1004",
            "leave_type": "Sick Leave",
            "start_date": (last_month - timedelta(days=2)).isoformat(),
            "end_date": (last_month - timedelta(days=1)).isoformat(),
            "days_count": 2,
            "status": "approved"
        },
        {
            "employee_id": "EMP1005",
            "leave_type": "Casual Leave",
            "start_date": (last_month - timedelta(days=5)).isoformat(),
            "end_date": (last_month - timedelta(days=4)).isoformat(),
            "days_count": 2,
            "status": "approved"
        },
        {
            "employee_id": "EMP1006",
            "leave_type": "Unpaid Leave",
            "start_date": (last_month - timedelta(days=3)).isoformat(),
            "end_date": (last_month - timedelta(days=3)).isoformat(),
            "days_count": 1,
            "status": "approved"
        },
        {
            "employee_id": "EMP1007",
            "leave_type": "Paid Leave",
            "start_date": (current_month - timedelta(days=7)).isoformat(),
            "end_date": (current_month - timedelta(days=5)).isoformat(),
            "days_count": 3,
            "status": "approved"
        },
        {
            "employee_id": "EMP1008",
            "leave_type": "Sick Leave",
            "start_date": (current_month - timedelta(days=2)).isoformat(),
            "end_date": (current_month - timedelta(days=1)).isoformat(),
            "days_count": 2,
            "status": "pending"
        },
    ]
    
    for leave_data in sample_leaves:
        employee = await db.employees.find_one({"id": leave_data["employee_id"]})
        if employee:
            leave = {
                "id": f"leave_{leave_data['employee_id']}_{random.randint(1000, 9999)}",
                "employee_id": leave_data["employee_id"],
                "employee_name": employee["full_name"],
                "employee_email": employee["email"],
                "leave_type": leave_data["leave_type"],
                "start_date": leave_data["start_date"],
                "end_date": leave_data["end_date"],
                "days_count": leave_data["days_count"],
                "is_half_day": False,
                "reason": "Sample leave for testing",
                "status": leave_data["status"],
                "approver_id": None,
                "approval_history": [],
                "created_at": leave_data["start_date"],
                "updated_at": leave_data["start_date"]
            }
            await db.leaves.insert_one(leave)
            print(f"  ✅ Added leave: {employee['full_name']} - {leave_data['leave_type']}")
    
    # 4. Update Employee ID Settings
    print("\n⚙️  Updating Settings...")
    await db.employee_id_settings.delete_many({})
    await db.employee_id_settings.insert_one({
        "prefix": "EMP",
        "counter": 1010
    })
    print("  ✅ Employee ID settings configured")
    
    print("\n✅ Sample data added successfully!")
    print("\n📝 Test Credentials:")
    print("  Admin: admin.sample@example.com / password123")
    print("  Manager (Eng): john.manager@example.com / password123")
    print("  Manager (Mkt): emily.manager@example.com / password123")
    print("  Employee: michael.brown@example.com / password123")
    print("\n🎉 You can now test the payroll and reporting features!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_sample_data())
