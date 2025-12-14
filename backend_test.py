import requests
import sys
import json
from datetime import datetime, timedelta

class HRMSAPITester:
    def __init__(self, base_url="https://leave-master-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.manager_token = None
        self.employee_token = None
        self.admin_user = None
        self.manager_user = None
        self.employee_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration for all roles"""
        timestamp = datetime.now().strftime('%H%M%S')
        
        # Register Admin
        admin_data = {
            "email": f"admin_{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Test Admin",
            "role": "admin",
            "department": "IT",
            "designation": "System Administrator",
            "phone": "+1234567890"
        }
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data=admin_data
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user = response['user']
            
        # Register Manager
        manager_data = {
            "email": f"manager_{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Test Manager",
            "role": "manager",
            "department": "HR",
            "designation": "HR Manager",
            "phone": "+1234567891"
        }
        
        success, response = self.run_test(
            "Manager Registration",
            "POST",
            "auth/register",
            200,
            data=manager_data
        )
        
        if success and 'access_token' in response:
            self.manager_token = response['access_token']
            self.manager_user = response['user']
            
        # Register Employee
        employee_data = {
            "email": f"employee_{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "Test Employee",
            "role": "employee",
            "department": "Engineering",
            "designation": "Software Developer",
            "phone": "+1234567892",
            "manager_email": f"manager_{timestamp}@test.com"
        }
        
        success, response = self.run_test(
            "Employee Registration",
            "POST",
            "auth/register",
            200,
            data=employee_data
        )
        
        if success and 'access_token' in response:
            self.employee_token = response['access_token']
            self.employee_user = response['user']

    def test_user_login(self):
        """Test user login"""
        if not self.admin_user:
            self.log_test("Admin Login", False, "No admin user to test login")
            return
            
        login_data = {
            "email": self.admin_user['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            # Update token in case it changed
            self.admin_token = response['access_token']

    def test_get_current_user(self):
        """Test getting current user profile"""
        if not self.admin_token:
            self.log_test("Get Current User", False, "No admin token available")
            return
            
        self.run_test(
            "Get Current User Profile",
            "GET",
            "auth/me",
            200,
            token=self.admin_token
        )

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        for role, token in [("Admin", self.admin_token), ("Manager", self.manager_token), ("Employee", self.employee_token)]:
            if token:
                self.run_test(
                    f"Dashboard Stats - {role}",
                    "GET",
                    "dashboard/stats",
                    200,
                    token=token
                )

    def test_employee_management(self):
        """Test employee CRUD operations"""
        if not self.admin_token:
            self.log_test("Employee Management", False, "No admin token available")
            return
            
        # Get all employees (Admin/Manager only)
        self.run_test(
            "Get All Employees - Admin",
            "GET",
            "employees",
            200,
            token=self.admin_token
        )
        
        if self.manager_token:
            self.run_test(
                "Get All Employees - Manager",
                "GET",
                "employees",
                200,
                token=self.manager_token
            )
        
        # Employee should not access employee list
        if self.employee_token:
            self.run_test(
                "Get All Employees - Employee (Should Fail)",
                "GET",
                "employees",
                403,
                token=self.employee_token
            )
        
        # Create new employee (Admin only)
        timestamp = datetime.now().strftime('%H%M%S')
        new_employee_data = {
            "email": f"new_emp_{timestamp}@test.com",
            "password": "TestPass123!",
            "full_name": "New Test Employee",
            "role": "employee",
            "department": "Marketing",
            "designation": "Marketing Specialist",
            "phone": "+1234567893"
        }
        
        success, response = self.run_test(
            "Create New Employee - Admin",
            "POST",
            "employees",
            200,
            data=new_employee_data,
            token=self.admin_token
        )
        
        if success and 'id' in response:
            employee_id = response['id']
            
            # Get specific employee
            self.run_test(
                "Get Specific Employee",
                "GET",
                f"employees/{employee_id}",
                200,
                token=self.admin_token
            )
            
            # Update employee
            update_data = {
                "full_name": "Updated Employee Name",
                "department": "Updated Department"
            }
            
            self.run_test(
                "Update Employee",
                "PUT",
                f"employees/{employee_id}",
                200,
                data=update_data,
                token=self.admin_token
            )

    def test_leave_management(self):
        """Test leave application and approval workflow"""
        if not self.employee_token:
            self.log_test("Leave Management", False, "No employee token available")
            return
            
        # Apply for leave
        start_date = (datetime.now() + timedelta(days=7)).isoformat()
        end_date = (datetime.now() + timedelta(days=9)).isoformat()
        
        leave_data = {
            "leave_type": "Sick Leave",
            "start_date": start_date,
            "end_date": end_date,
            "reason": "Medical checkup and recovery"
        }
        
        success, response = self.run_test(
            "Apply for Leave - Employee",
            "POST",
            "leaves",
            200,
            data=leave_data,
            token=self.employee_token
        )
        
        leave_id = None
        if success and 'id' in response:
            leave_id = response['id']
        
        # Get my leaves
        self.run_test(
            "Get My Leaves - Employee",
            "GET",
            "leaves/my-leaves",
            200,
            token=self.employee_token
        )
        
        # Get pending leaves (Manager/Admin)
        if self.manager_token:
            self.run_test(
                "Get Pending Leaves - Manager",
                "GET",
                "leaves/pending",
                200,
                token=self.manager_token
            )
        
        if self.admin_token:
            self.run_test(
                "Get Pending Leaves - Admin",
                "GET",
                "leaves/pending",
                200,
                token=self.admin_token
            )
            
            # Get all leaves (Admin only)
            self.run_test(
                "Get All Leaves - Admin",
                "GET",
                "leaves/all",
                200,
                token=self.admin_token
            )
        
        # Test leave approval workflow
        if leave_id and self.manager_token:
            # Manager approves leave
            approval_data = {
                "action": "approve",
                "comments": "Approved by manager"
            }
            
            self.run_test(
                "Manager Approve Leave",
                "PUT",
                f"leaves/{leave_id}/action",
                200,
                data=approval_data,
                token=self.manager_token
            )
            
            # Admin final approval
            if self.admin_token:
                final_approval_data = {
                    "action": "approve",
                    "comments": "Final approval by admin"
                }
                
                self.run_test(
                    "Admin Final Approve Leave",
                    "PUT",
                    f"leaves/{leave_id}/action",
                    200,
                    data=final_approval_data,
                    token=self.admin_token
                )

    def test_profile_management(self):
        """Test profile update functionality"""
        if not self.employee_token or not self.employee_user:
            self.log_test("Profile Management", False, "No employee data available")
            return
            
        # Get current profile
        success, profile = self.run_test(
            "Get Current Profile",
            "GET",
            "auth/me",
            200,
            token=self.employee_token
        )
        
        if success and 'id' in profile:
            employee_id = profile['id']
            
            # Update profile
            update_data = {
                "full_name": "Updated Employee Name",
                "phone": "+9876543210"
            }
            
            self.run_test(
                "Update Profile",
                "PUT",
                f"employees/{employee_id}",
                200,
                data=update_data,
                token=self.employee_token
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting HRMS API Testing...")
        print(f"📍 Base URL: {self.base_url}")
        
        # Test user registration and authentication
        print("\n📝 Testing User Registration & Authentication...")
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        
        # Test dashboard
        print("\n📊 Testing Dashboard...")
        self.test_dashboard_stats()
        
        # Test employee management
        print("\n👥 Testing Employee Management...")
        self.test_employee_management()
        
        # Test leave management
        print("\n📋 Testing Leave Management...")
        self.test_leave_management()
        
        # Test profile management
        print("\n👤 Testing Profile Management...")
        self.test_profile_management()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = HRMSAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'failed_tests': tester.tests_run - tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            'test_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())