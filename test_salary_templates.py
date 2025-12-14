#!/usr/bin/env python3

import requests
import json
import sys

def test_salary_templates():
    """Test salary template endpoints comprehensively"""
    base_url = "https://leave-master-2.preview.emergentagent.com/api"
    
    print("🚀 Testing Salary Template Endpoints...")
    
    # Step 1: Login with admin credentials
    print("\n🔑 Step 1: Admin Login")
    login_data = {
        "email": "test.admin@example.com",
        "password": "password123"
    }
    
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Admin login failed: {response.status_code}")
        return False
    
    token = response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    print("✅ Admin login successful")
    
    # Step 2: Get default template (first time)
    print("\n📋 Step 2: Get Default Template (first time)")
    response = requests.get(f"{base_url}/salary-template", headers=headers)
    if response.status_code != 200:
        print(f"❌ Get default template failed: {response.status_code}")
        return False
    
    default_template = response.json()
    print("✅ Get default template successful")
    
    # Verify default template structure
    if 'earnings' not in default_template or 'deductions' not in default_template:
        print("❌ Default template missing earnings or deductions")
        return False
    
    earnings_count = len(default_template['earnings'])
    deductions_count = len(default_template['deductions'])
    
    if earnings_count != 6 or deductions_count != 3:
        print(f"❌ Default template structure incorrect: {earnings_count} earnings, {deductions_count} deductions (expected 6 earnings, 3 deductions)")
        return False
    
    print("✅ Default template structure validated")
    
    # Verify specific earnings
    expected_earnings = ["Basic", "Dearness Allowance", "House Rent Allowance", 
                        "Conveyance Allowance", "Medical Allowance", "Special Allowance"]
    actual_earnings = [e['name'] for e in default_template['earnings']]
    
    if not all(earning in actual_earnings for earning in expected_earnings):
        print(f"❌ Default earnings validation failed. Expected: {expected_earnings}, Got: {actual_earnings}")
        return False
    
    print("✅ Default earnings validated")
    
    # Verify specific deductions
    expected_deductions = ["Professional Tax", "TDS", "EPF"]
    actual_deductions = [d['name'] for d in default_template['deductions']]
    
    if not all(deduction in actual_deductions for deduction in expected_deductions):
        print(f"❌ Default deductions validation failed. Expected: {expected_deductions}, Got: {actual_deductions}")
        return False
    
    print("✅ Default deductions validated")
    
    # Step 3: Save custom template
    print("\n📝 Step 3: Save Custom Template")
    custom_template = {
        "earnings": [
            {"name": "Basic Salary", "order": 1},
            {"name": "HRA", "order": 2},
            {"name": "Transport Allowance", "order": 3}
        ],
        "deductions": [
            {"name": "Professional Tax", "order": 1},
            {"name": "Insurance", "order": 2}
        ]
    }
    
    response = requests.post(f"{base_url}/salary-template", json=custom_template, headers=headers)
    if response.status_code != 200:
        print(f"❌ Save custom template failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    save_response = response.json()
    print("✅ Save custom template successful")
    
    # Verify save response
    if save_response.get('status') != 'success':
        print(f"❌ Save response invalid: {save_response}")
        return False
    
    if 'template' not in save_response:
        print("❌ Save response missing template")
        return False
    
    saved_template = save_response['template']
    if not all(field in saved_template for field in ['updated_at', 'updated_by', 'earnings', 'deductions']):
        print(f"❌ Saved template missing required fields: {saved_template}")
        return False
    
    print("✅ Save response validated")
    
    # Step 4: Get updated template
    print("\n🔄 Step 4: Get Updated Template")
    response = requests.get(f"{base_url}/salary-template", headers=headers)
    if response.status_code != 200:
        print(f"❌ Get updated template failed: {response.status_code}")
        return False
    
    updated_template = response.json()
    print("✅ Get updated template successful")
    
    # Verify the template matches what we saved
    if 'earnings' not in updated_template or 'deductions' not in updated_template:
        print("❌ Updated template missing earnings or deductions")
        return False
    
    earnings_names = [e['name'] for e in updated_template['earnings']]
    deductions_names = [d['name'] for d in updated_template['deductions']]
    
    expected_earnings = ["Basic Salary", "HRA", "Transport Allowance"]
    expected_deductions = ["Professional Tax", "Insurance"]
    
    if (set(earnings_names) != set(expected_earnings) or 
        set(deductions_names) != set(expected_deductions)):
        print(f"❌ Updated template content mismatch. Earnings: {earnings_names}, Deductions: {deductions_names}")
        return False
    
    print("✅ Updated template content validated")
    
    # Step 5: Test authorization (employee should not be able to save)
    print("\n🔒 Step 5: Test Authorization")
    
    # Try to create an employee and test with their token
    employee_data = {
        "email": "test.employee@example.com",
        "password": "password123",
        "full_name": "Test Employee",
        "role": "employee",
        "department": "Engineering",
        "designation": "Software Developer"
    }
    
    # First register employee (using admin token)
    response = requests.post(f"{base_url}/employees", json=employee_data, headers=headers)
    if response.status_code == 200:
        # Login as employee
        employee_login = {
            "email": "test.employee@example.com",
            "password": "password123"
        }
        
        response = requests.post(f"{base_url}/auth/login", json=employee_login)
        if response.status_code == 200:
            employee_token = response.json()['access_token']
            employee_headers = {'Authorization': f'Bearer {employee_token}', 'Content-Type': 'application/json'}
            
            # Try to save template as employee (should fail)
            response = requests.post(f"{base_url}/salary-template", json=custom_template, headers=employee_headers)
            if response.status_code == 403:
                print("✅ Employee authorization correctly denied")
            else:
                print(f"❌ Employee authorization test failed: expected 403, got {response.status_code}")
                return False
            
            # Try to get template as employee (should work)
            response = requests.get(f"{base_url}/salary-template", headers=employee_headers)
            if response.status_code == 200:
                print("✅ Employee can read template")
            else:
                print(f"❌ Employee read template failed: {response.status_code}")
                return False
        else:
            print("⚠️  Employee login failed, skipping authorization test")
    else:
        print("⚠️  Employee creation failed, skipping authorization test")
    
    print("\n🎉 All salary template tests passed!")
    return True

if __name__ == "__main__":
    success = test_salary_templates()
    sys.exit(0 if success else 1)