import React, { useState, useEffect } from 'react';
import { Gift, Calendar, Search, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getAuth } from '@/lib/auth';
import { format } from 'date-fns';

const CompOffPage = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [compOffRecords, setCompOffRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = getAuth();

  const [compOffForm, setCompOffForm] = useState({
    days: '',
    work_date: '',
    reason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm]);

  const fetchData = async () => {
    try {
      // Fetch employees (team members for manager)
      const empResponse = await api.get('/employees');
      let emps = empResponse.data;

      // If manager, filter only their team
      if (user?.role === 'manager') {
        const myProfile = await api.get('/auth/me');
        emps = emps.filter(emp => emp.manager_email === myProfile.data.email);
      }

      setEmployees(emps);

      // Fetch comp-off records
      const compOffResponse = await api.get('/comp-off/records');
      setCompOffRecords(compOffResponse.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(emp =>
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const handleGrantCompOff = (employee) => {
    setSelectedEmployee(employee);
    setCompOffForm({
      days: '',
      work_date: '',
      reason: '',
    });
    setGrantDialogOpen(true);
  };

  const handleSubmitCompOff = async () => {
    if (!compOffForm.days || !compOffForm.work_date || !compOffForm.reason) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await api.post('/comp-off/grant', {
        user_id: selectedEmployee.id, // ✅ USER UUID
        days: parseFloat(compOffForm.days),
        work_date: compOffForm.work_date,
        reason: compOffForm.reason,
      });

      toast.success(
        `Granted ${compOffForm.days} comp-off day(s) to ${selectedEmployee.full_name}`
      );

      setGrantDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || 'Failed to grant comp-off'
      );
    }
  };

  const getEmployeeCompOff = (employeeId) => {
    const records = compOffRecords.filter(
      r => r.employee_id === employeeId
    );

    const total = records.reduce((sum, r) => sum + (r.days || 0), 0);
    const used = records.reduce((sum, r) => sum + (r.used || 0), 0);

    return { total, used, available: total - used };
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
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Comp-Off Management
        </h1>
        <p className="text-lg text-slate-600">
          Grant compensatory off for employees who work extra hours or holidays
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-emerald-900 mb-1">What is Comp-Off?</p>
            <p className="text-sm text-emerald-700">
              Compensatory off is granted to employees who work on holidays, weekends, or put in extra hours beyond normal working time. 
              Only managers can grant comp-off to their team members.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEmployees.map((employee) => {
          const compOffBalance = getEmployeeCompOff(employee.employee_id);
          const employeeRecords = compOffRecords.filter(r => r.employee_id === employee.id);

          return (
            <Card key={employee.id} className="border-slate-100 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-b border-emerald-200">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {employee.full_name}
                    </CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{employee.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {employee.designation}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {employee.department}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGrantCompOff(employee)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                    data-testid={`grant-compoff-${employee.id}`}
                  >
                    <Gift className="w-4 h-4 mr-1" />
                    Grant
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Comp-Off Balance */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-2xl font-bold text-blue-700">{compOffBalance.total}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs text-amber-600 uppercase tracking-wider mb-1">Used</p>
                    <p className="text-2xl font-bold text-amber-700">{compOffBalance.used}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Available</p>
                    <p className="text-2xl font-bold text-emerald-700">{compOffBalance.available}</p>
                  </div>
                </div>

                {/* Recent Comp-Off Records */}
                {employeeRecords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Recent Grants
                    </p>
                    <div className="space-y-2">
                      {employeeRecords.slice(0, 3).map((record, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-900">{record.days} day(s)</span>
                            <span className="text-xs text-slate-500">
                              {format(new Date(record.granted_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Clock className="w-3 h-3" />
                            <span>Worked on: {format(new Date(record.work_date), 'MMM dd, yyyy')}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{record.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {employeeRecords.length === 0 && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    No comp-off granted yet
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center text-slate-500">
              <Gift className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">No employees found</p>
              <p className="text-sm">Try adjusting your search</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grant Comp-Off Dialog */}
      <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Comp-Off</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                <p className="font-semibold text-slate-900">{selectedEmployee.full_name}</p>
                <p className="text-sm text-slate-600">{selectedEmployee.email}</p>
              </div>

              <div>
                <Label>Number of Days</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="e.g., 1 or 0.5"
                  value={compOffForm.days}
                  onChange={(e) => setCompOffForm({ ...compOffForm, days: e.target.value })}
                  className="mt-1"
                  data-testid="compoff-days-input"
                />
                <p className="text-xs text-slate-500 mt-1">Use 0.5 for half day</p>
              </div>

              <div>
                <Label>Work Date (When they worked extra)</Label>
                <Input
                  type="date"
                  value={compOffForm.work_date}
                  onChange={(e) => setCompOffForm({ ...compOffForm, work_date: e.target.value })}
                  className="mt-1"
                  data-testid="compoff-workdate-input"
                />
              </div>

              <div>
                <Label>Reason *</Label>
                <Textarea
                  placeholder="e.g., Worked on Sunday for urgent deployment, Worked extra hours on project deadline"
                  value={compOffForm.reason}
                  onChange={(e) => setCompOffForm({ ...compOffForm, reason: e.target.value })}
                  rows={3}
                  className="mt-1"
                  data-testid="compoff-reason-textarea"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Comp-off days will be added to this employee's balance. They can use it like regular leave.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setGrantDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitCompOff}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  data-testid="submit-compoff-btn"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Grant Comp-Off
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompOffPage;
