# Organization Hierarchy Management Guide

## How to Create & Manage Employee Hierarchy

### 1. **Promoting Employees to Managers**

**Steps to Change Role:**
1. Login as **Admin**
2. Go to **Employees** page
3. Find the employee you want to promote
4. Click the **Edit** button (pencil icon) on their card
5. In the edit dialog, find the **"Role"** dropdown
6. Select new role:
   - **Employee** → Regular access
   - **Manager** → Can approve team leave requests
   - **Admin** → Full system access
7. Click **"Update Employee"**

**Role Descriptions:**
- **Employee**: Can apply for leaves, view own data
- **Manager**: All employee features + approve team leaves
- **Admin**: Full access to all features, can manage everyone

### 2. **Building the Hierarchy**

**Creating Manager-Employee Relationships:**

**Method 1: When Adding New Employee**
1. Employees → Add Employee
2. Fill in details
3. In **"Manager"** dropdown, select the reporting manager
4. Save

**Method 2: Editing Existing Employee**
1. Employees → Find employee → Click Edit
2. Change **"Manager"** dropdown to assign new manager
3. Update

**Example Hierarchy Structure:**
```
Admin (CEO/Director)
  ├── Manager (Engineering)
  │   ├── Senior Developer
  │   ├── Junior Developer
  │   └── Intern
  ├── Manager (HR)
  │   ├── HR Executive
  │   └── Recruiter
  └── Manager (Sales)
      ├── Sales Executive
      └── Sales Associate
```

### 3. **Viewing Organization Hierarchy**

**Hierarchy Page Features:**
1. Click **"Hierarchy"** in sidebar (visible to Admin & Managers)
2. View:
   - **Total count** of employees by role
   - **Department-wise** organization structure
   - **Administrators** section
   - **Managers & their teams** (expandable)
   - **Reporting relationships** clearly shown

**What You'll See:**
- Color-coded roles (Blue=Admin, Purple=Manager, Gray=Employee)
- Team member count for each manager
- Direct reports under each manager
- Employees without managers listed separately

### 4. **Leave Approval Flow Based on Hierarchy**

**How It Works:**
```
Employee applies for leave
    ↓
Sent to their Manager (as assigned in profile)
    ↓
Manager reviews & approves
    ↓
Sent to Admin for final approval
    ↓
Admin gives final approval
    ↓
Leave balance deducted & employee notified
```

**Key Points:**
- Leave requests go **only to the employee's assigned manager**
- Manager sees **only their team's** leave requests
- Admin sees **all pending and manager-approved** requests
- If no manager assigned, leave goes directly to Admin

### 5. **Best Practices**

**Setting Up Hierarchy:**
1. Create Admin accounts first
2. Add Managers and assign them to Admin
3. Add Employees and assign them to respective Managers
4. Verify on Hierarchy page

**Changing Managers:**
- Edit employee → Change Manager dropdown → Save
- Old manager loses access to that employee's leaves
- New manager can now approve their leaves

**Promoting to Manager:**
1. Edit employee → Change Role to "Manager"
2. Assign employees to report to this new manager
3. They can now approve team leaves

### 6. **Multi-Department Setup Example**

**Engineering Department:**
```
Admin (CTO)
└── Engineering Manager
    ├── Tech Lead
    ├── Senior Dev
    └── Junior Dev
```

**HR Department:**
```
Admin (Director)
└── HR Manager
    ├── HR Executive
    └── Recruiter
```

**Sales Department:**
```
Admin (VP Sales)
└── Sales Manager
    ├── Senior Sales Executive
    └── Sales Associate
```

### 7. **Common Questions**

**Q: Can an employee have multiple managers?**
A: No, each employee can have only one direct manager assigned.

**Q: Can a Manager be under another Manager?**
A: Yes! You can create multi-level hierarchies:
- Admin → Senior Manager → Junior Manager → Employee

**Q: What happens if I remove a manager assignment?**
A: The employee's leave requests will go directly to Admin.

**Q: Can Managers approve leaves for other departments?**
A: No, managers can only approve leaves for employees assigned to them.

**Q: How do I see who reports to a specific manager?**
A: Go to Hierarchy page → Find the manager → See their team members listed below.

### 8. **Quick Actions**

**To Promote Employee to Manager:**
```
Employees → Edit Employee → Change Role → Manager → Update
```

**To Assign Manager to Employee:**
```
Employees → Edit Employee → Manager Dropdown → Select Manager → Update
```

**To View Team Structure:**
```
Hierarchy → See department-wise organization
```

**To Remove Manager Assignment:**
```
Employees → Edit Employee → Manager Dropdown → "No Manager" → Update
```

---

**Tips:**
- Regular employees cannot see the Hierarchy page
- Managers can view hierarchy to see their team
- Only Admin can change roles and reassign managers
- Use the Hierarchy page to verify your organization structure
