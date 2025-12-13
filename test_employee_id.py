#!/usr/bin/env python3
"""
Test script for employee ID generation functionality
"""
import asyncio
import sys
import os
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment
load_dotenv('/app/backend/.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

async def test_employee_id_generation():
    """Test the employee ID generation"""
    print("Testing employee ID generation...")
    
    # Test default settings
    prefix, counter = await get_employee_id_settings()
    print(f"Default settings: prefix='{prefix}', counter={counter}")
    
    # Generate a few IDs
    for i in range(3):
        emp_id = await generate_employee_id()
        print(f"Generated ID {i+1}: {emp_id}")
    
    # Test with custom settings
    await db.employee_id_settings.delete_many({})
    await db.employee_id_settings.insert_one({
        "prefix": "COMP",
        "counter": 2000
    })
    
    prefix, counter = await get_employee_id_settings()
    print(f"Custom settings: prefix='{prefix}', counter={counter}")
    
    emp_id = await generate_employee_id()
    print(f"Generated ID with custom settings: {emp_id}")
    
    print("Test completed successfully!")

if __name__ == "__main__":
    asyncio.run(test_employee_id_generation())