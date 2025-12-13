import React, { useState, useEffect } from 'react';
import { Plus, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SettingsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newLeaveType, setNewLeaveType] = useState('');

  useEffect(() => {
    // Load from localStorage
    const savedDepts = localStorage.getItem('departments');
    const savedDesigs = localStorage.getItem('designations');
    const savedLeaveTypes = localStorage.getItem('leave_types');
    
    setDepartments(savedDepts ? JSON.parse(savedDepts) : [
      'Engineering',
      'Human Resources',
      'Sales',
      'Marketing',
      'Finance',
      'Operations'
    ]);
    
    setDesignations(savedDesigs ? JSON.parse(savedDesigs) : [
      'Software Developer',
      'Senior Developer',
      'Team Lead',
      'Engineering Manager',
      'HR Manager',
      'Sales Executive',
      'Marketing Manager',
      'Finance Manager',
      'Operations Manager'
    ]);
    
    setLeaveTypes(savedLeaveTypes ? JSON.parse(savedLeaveTypes) : [
      { name: 'Sick Leave', quota: 12 },
      { name: 'Casual Leave', quota: 12 },
      { name: 'Paid Leave', quota: 15 },
      { name: 'Unpaid Leave', quota: 0 }
    ]);
  }, []);

  const saveDepartments = (depts) => {
    localStorage.setItem('departments', JSON.stringify(depts));
    setDepartments(depts);
  };

  const saveDesignations = (desigs) => {
    localStorage.setItem('designations', JSON.stringify(desigs));
    setDesignations(desigs);
  };

  const addDepartment = () => {
    if (!newDepartment.trim()) {
      toast.error('Please enter a department name');
      return;
    }
    if (departments.includes(newDepartment.trim())) {
      toast.error('Department already exists');
      return;
    }
    const updated = [...departments, newDepartment.trim()];
    saveDepartments(updated);
    setNewDepartment('');
    toast.success('Department added');
  };

  const removeDepartment = (dept) => {
    const updated = departments.filter(d => d !== dept);
    saveDepartments(updated);
    toast.success('Department removed');
  };

  const addDesignation = () => {
    if (!newDesignation.trim()) {
      toast.error('Please enter a designation name');
      return;
    }
    if (designations.includes(newDesignation.trim())) {
      toast.error('Designation already exists');
      return;
    }
    const updated = [...designations, newDesignation.trim()];
    saveDesignations(updated);
    setNewDesignation('');
    toast.success('Designation added');
  };

  const removeDesignation = (desig) => {
    const updated = designations.filter(d => d !== desig);
    saveDesignations(updated);
    toast.success('Designation removed');
  };

  const saveLeaveTypes = (types) => {
    localStorage.setItem('leave_types', JSON.stringify(types));
    setLeaveTypes(types);
  };

  const addLeaveType = () => {
    if (!newLeaveType.name.trim()) {
      toast.error('Please enter leave type name');
      return;
    }
    if (newLeaveType.quota === '' || isNaN(newLeaveType.quota)) {
      toast.error('Please enter valid annual quota');
      return;
    }
    if (leaveTypes.some(lt => lt.name.toLowerCase() === newLeaveType.name.toLowerCase())) {
      toast.error('Leave type already exists');
      return;
    }
    
    const updated = [...leaveTypes, { 
      name: newLeaveType.name.trim(), 
      quota: parseInt(newLeaveType.quota) 
    }];
    saveLeaveTypes(updated);
    setNewLeaveType({ name: '', quota: '' });
    toast.success('Leave type added');
  };

  const removeLeaveType = (typeName) => {
    const updated = leaveTypes.filter(lt => lt.name !== typeName);
    saveLeaveTypes(updated);
    toast.success('Leave type removed');
  };

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Organization Settings
        </h1>
        <p className="text-lg text-slate-600">Manage departments and designations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Departments */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              <Settings className="w-6 h-6" />
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Department */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter department name"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
                data-testid="new-department-input"
                className="flex-1"
              />
              <Button
                onClick={addDepartment}
                data-testid="add-department-btn"
                className="bg-slate-800 hover:bg-slate-900 rounded-full px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Department List */}
            <div className="space-y-2">
              {departments.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No departments added yet</p>
              ) : (
                departments.map((dept) => (
                  <div
                    key={dept}
                    data-testid={`dept-${dept}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-slate-900 font-medium">{dept}</span>
                    <button
                      onClick={() => removeDepartment(dept)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      data-testid={`remove-dept-${dept}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Designations */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              <Settings className="w-6 h-6" />
              Designations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Designation */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter designation name"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addDesignation()}
                data-testid="new-designation-input"
                className="flex-1"
              />
              <Button
                onClick={addDesignation}
                data-testid="add-designation-btn"
                className="bg-slate-800 hover:bg-slate-900 rounded-full px-4"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Designation List */}
            <div className="space-y-2">
              {designations.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No designations added yet</p>
              ) : (
                designations.map((desig) => (
                  <div
                    key={desig}
                    data-testid={`desig-${desig}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-slate-900 font-medium">{desig}</span>
                    <button
                      onClick={() => removeDesignation(desig)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      data-testid={`remove-desig-${desig}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leave Types */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              <Settings className="w-6 h-6" />
              Leave Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Leave Type */}
            <div className="space-y-2">
              <Input
                placeholder="Leave type name"
                value={newLeaveType.name}
                onChange={(e) => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && newLeaveType.quota !== '' && addLeaveType()}
                data-testid="new-leave-type-input"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Annual quota (0 for unlimited)"
                  value={newLeaveType.quota}
                  onChange={(e) => setNewLeaveType({ ...newLeaveType, quota: e.target.value })}
                  className="flex-1"
                  data-testid="new-leave-quota-input"
                />
                <Button
                  onClick={addLeaveType}
                  data-testid="add-leave-type-btn"
                  className="bg-slate-800 hover:bg-slate-900 rounded-full px-4"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Leave Type List */}
            <div className="space-y-2">
              {leaveTypes.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No leave types added yet</p>
              ) : (
                leaveTypes.map((leaveType) => (
                  <div
                    key={leaveType.name}
                    data-testid={`leave-type-${leaveType.name}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <span className="text-slate-900 font-medium">{leaveType.name}</span>
                      <span className="text-sm text-slate-500 ml-2">
                        ({leaveType.quota === 0 ? 'Unlimited' : `${leaveType.quota} days/year`})
                      </span>
                    </div>
                    <button
                      onClick={() => removeLeaveType(leaveType.name)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      data-testid={`remove-leave-type-${leaveType.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-600">
                <strong>Note:</strong> Leave types will be used across the system for leave applications and balance management.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;