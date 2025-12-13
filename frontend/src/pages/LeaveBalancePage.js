import React, { useState, useEffect } from 'react';
import { Plus, Minus, Gift, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

const LeaveBalancePage = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [compOffRecords, setCompOffRecords] = useState([]);

  const [adjustForm, setAdjustForm] = useState({
    leave_type: '',
    adjustment_type: 'add', // add or deduct
    days: '',
    reason: '',
  });

  useEffect(() => {
    fetchEmployees();
    loadLeaveTypes();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]);

  const loadLeaveTypes = () => {
    const saved = localStorage.getItem('leave_types');
    if (saved) {
      setLeaveTypes(JSON.parse(saved));
    } else {
      setLeaveTypes([
        { name: 'Sick Leave', quota: 12 },
        { name: 'Casual Leave', quota: 12 },
        { name: 'Paid Leave', quota: 15 },
        { name: 'Unpaid Leave', quota: 0 }
      ]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
      
      // Fetch comp-off records
      try {
        const compOffResponse = await api.get('/comp-off/records');
        setCompOffRecords(compOffResponse.data || []);
      } catch (err) {
        console.log('Comp-off not available');
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeCompOff = (employeeId) => {
    const records = compOffRecords.filter(r => r.employee_id === employeeId);
    const total = records.reduce((sum, r) => sum + (r.days || 0), 0);
    const used = records.reduce((sum, r) => sum + (r.used || 0), 0);
    return total - used; // Available comp-off
  };

  const filterEmployees = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(emp =>
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const handleAdjustBalance = (employee) => {
    setSelectedEmployee(employee);
    setAdjustForm({
      leave_type: '',
      adjustment_type: 'add',
      days: '',
      reason: '',
    });
    setAdjustDialogOpen(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!adjustForm.leave_type || !adjustForm.days || !adjustForm.reason) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const leaveTypeKey = adjustForm.leave_type.toLowerCase().replace(/ /g, '_');
      const days = parseFloat(adjustForm.days);
      const adjustment = adjustForm.adjustment_type === 'add' ? days : -days;

      // Update leave balance
      const currentBalance = selectedEmployee.leave_balance[leaveTypeKey] || 0;
      const newBalance = currentBalance + adjustment;

      if (newBalance < 0) {
        toast.error('Cannot deduct more than available balance');
        return;
      }

      // Call API to update
      await api.put(`/employees/${selectedEmployee.id}/leave-balance`, {
        leave_type: leaveTypeKey,
        adjustment: adjustment,
        reason: adjustForm.reason
      });

      toast.success(
        `${adjustForm.adjustment_type === 'add' ? 'Added' : 'Deducted'} ${days} ${adjustForm.leave_type} ${days > 1 ? 'days' : 'day'}`
      );
      
      setAdjustDialogOpen(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to adjust leave balance');
    }
  };

  const getTotalLeaves = (leaveBalance) => {
    return Object.values(leaveBalance).reduce((sum, val) => sum + (val || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Leave Balance Management
          </h1>
          <p className="text-lg text-slate-600">View and manage employee leave balances</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employees Leave Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="border-slate-100 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <Users className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {employee.full_name}
                    </CardTitle>
                    <p className="text-sm text-slate-500">{employee.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {employee.department}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {employee.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAdjustBalance(employee)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                >
                  <Gift className="w-4 h-4 mr-1" />
                  Adjust
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {leaveTypes.map((leaveType) => {
                  const key = leaveType.name.toLowerCase().replace(/ /g, '_');
                  const balance = employee.leave_balance[key] || 0;
                  const isLow = balance < 3 && balance > 0;
                  const isEmpty = balance === 0;

                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isEmpty
                          ? 'bg-red-50 border-red-200'
                          : isLow
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">
                        {leaveType.name}
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          isEmpty
                            ? 'text-red-700'
                            : isLow
                            ? 'text-amber-700'
                            : 'text-slate-900'
                        }`}
                      >
                        {balance}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {leaveType.quota > 0 ? `of ${leaveType.quota} days` : 'Unlimited'}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Total Balance:</span>
                  <span className="text-xl font-bold text-slate-900">
                    {getTotalLeaves(employee.leave_balance)} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center text-slate-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">No employees found</p>
              <p className="text-sm">Try adjusting your search</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Leave Balance</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-semibold text-slate-900">{selectedEmployee.full_name}</p>
                <p className="text-sm text-slate-600">{selectedEmployee.email}</p>
              </div>

              <div>
                <Label>Adjustment Type</Label>
                <Select
                  value={adjustForm.adjustment_type}
                  onValueChange={(value) => setAdjustForm({ ...adjustForm, adjustment_type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-green-600" />
                        Add Leaves (Comp-Off)
                      </div>
                    </SelectItem>
                    <SelectItem value="deduct">
                      <div className="flex items-center gap-2">
                        <Minus className="w-4 h-4 text-red-600" />
                        Deduct Leaves
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Leave Type</Label>
                <Select
                  value={adjustForm.leave_type}
                  onValueChange={(value) => setAdjustForm({ ...adjustForm, leave_type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.name} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Number of Days</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g., 1 or 0.5"
                  value={adjustForm.days}
                  onChange={(e) => setAdjustForm({ ...adjustForm, days: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">Use 0.5 for half day</p>
              </div>

              <div>
                <Label>Reason *</Label>
                <Textarea
                  placeholder="e.g., Worked on Sunday, Extra hours compensation"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  {adjustForm.adjustment_type === 'add' ? (
                    <>
                      <strong>Comp-Off:</strong> Adding compensatory leaves for extra work done.
                    </>
                  ) : (
                    <>
                      <strong>Deduction:</strong> Removing leaves from balance (e.g., correction).
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setAdjustDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitAdjustment}
                  className={`flex-1 ${
                    adjustForm.adjustment_type === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {adjustForm.adjustment_type === 'add' ? 'Add Leaves' : 'Deduct Leaves'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveBalancePage;
