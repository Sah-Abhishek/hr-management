# HRMS - Admin Guide

## 🔐 Admin Credentials
- **Email:** test.admin@example.com
- **Password:** password123

## 📋 How to Use the System

### 1. Adding Employees with Manager Assignment

**Steps:**
1. Login as Admin
2. Go to **"Employees"** page (from left sidebar)
3. Click **"Add Employee"** button (top right)
4. Fill in the form:
   - Full Name
   - Email
   - Password (for employee login)
   - Department (e.g., Engineering, HR, Sales)
   - Designation (e.g., Developer, Manager)
   - Role: Select **Employee**, **Manager**, or **Admin**
   - Phone (Optional)
   - **Manager Email** (IMPORTANT: Enter manager's email for approval routing)
5. Click **"Add Employee"**

**How Approval Works:**
- If you add **"Manager Email"**, leave approvals will route:
  - Employee applies → Manager approves → Admin final approval
- If no manager email, approval goes directly to Admin

### 2. Leave Policy Configuration

**Steps:**
1. Go to **"Leave Policy"** page (Admin only)
2. Set annual quotas for:
   - **Sick Leave** (default: 12 days/year)
   - **Casual Leave** (default: 12 days/year)  
   - **Paid Leave/Vacation** (default: 15 days/year)
   - **Unpaid Leave** (Unlimited - no quota)
3. Click **"Save Leave Policy"**

**Note:** These settings apply to new employees. Existing employee balances won't change automatically.

### 3. Leave Types Available

1. **Sick Leave** - For medical emergencies and illness
2. **Casual Leave** - For personal matters and short breaks
3. **Paid Leave** - For vacations and planned time off
4. **Unpaid Leave** - Unlimited, no pay deduction

### 4. Multi-Level Approval Workflow

**Example Flow:**
1. Employee (Jane) applies for leave
2. Manager (John) gets notification in "Approvals" page
3. Manager approves → Status changes to "Manager Approved"
4. Admin gets notification in "Approvals" page
5. Admin gives final approval → Status changes to "Approved"
6. Leave balance automatically deducted from employee account

### 5. Managing Approvals

**Admin View:**
1. Go to **"Approvals"** page
2. See all pending and manager-approved leaves
3. Review leave details (employee, dates, reason)
4. Click **"Approve"** or **"Reject"**
5. Add optional comments
6. Leave balance updates automatically on approval

### 6. Viewing Employee Information

**Employees Page Shows:**
- Employee cards with:
  - Name, role badge
  - Email, phone, designation
  - Current leave balances (Sick, Casual, Paid)
  - Reporting manager (if assigned)
  - Joining date

## 🎯 Quick Tips

1. **Always assign Manager Email** when adding employees for multi-level approval
2. **Set Leave Policy** before adding many employees
3. **Unpaid Leave** has no limit - employees can use it anytime
4. **Leave balance** deducts only when admin gives final approval
5. Check **Dashboard** for quick stats on employees and pending leaves

## 🔄 Complete Workflow Example

### Adding Employee with Manager:
1. Login as Admin
2. Employees → Add Employee
3. Fill form with manager email: manager@example.com
4. Save

### Employee Applies for Leave:
1. Employee logs in
2. My Leaves → Apply Leave
3. Selects dates, type, reason
4. Submits

### Manager Approves:
1. Manager logs in
2. Approvals → See pending request
3. Reviews and approves

### Admin Final Approval:
1. Admin logs in
2. Approvals → See manager-approved request  
3. Reviews and gives final approval
4. Employee's leave balance automatically reduced

## 📧 Test Accounts

- **Admin:** test.admin@example.com / password123
- **Manager:** manager@example.com / password123
- **Employee:** employee@example.com / password123

---

**Need Help?** All features are accessible from the left sidebar menu.
