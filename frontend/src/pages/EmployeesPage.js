import React, { useState, useEffect } from 'react';
import { Plus, User, Mail, Phone, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getAuth } from '@/lib/auth';
import { format } from 'date-fns';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = getAuth();
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  const [employeeForm, setEmployeeForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'employee',
    department: '',
    designation: '',
    phone: '',
    manager_email: '',
  });

  useEffect(() => {
    fetchEmployees();
    loadDepartments();
  }, []);

  const loadDepartments = () => {
    const savedDepts = localStorage.getItem('departments');
    setDepartments(savedDepts ? JSON.parse(savedDepts) : [
      'Engineering',
      'Human Resources',
      'Sales',
      'Marketing',
      'Finance',
      'Operations'
    ]);
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/employees', employeeForm);
      toast.success('Employee added successfully!');
      setDialogOpen(false);
      setEmployeeForm({
        email: '',
        password: '',
        full_name: '',
        role: 'employee',
        department: '',
        designation: '',
        phone: '',
        manager_email: '',
      });
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
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
            {user?.role === 'admin' ? 'All Employees' : 'Team Members'}
          </h1>
          <p className="text-lg text-slate-600">Manage employee information</p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="add-employee-btn" className="bg-slate-800 hover:bg-slate-900 rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="emp-name">Full Name</Label>
                  <Input
                    id="emp-name"
                    data-testid="emp-name-input"
                    value={employeeForm.full_name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, full_name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="emp-email">Email</Label>
                  <Input
                    id="emp-email"
                    data-testid="emp-email-input"
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="emp-password">Password</Label>
                  <Input
                    id="emp-password"
                    data-testid="emp-password-input"
                    type="password"
                    value={employeeForm.password}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emp-department">Department</Label>
                    <Input
                      id="emp-department"
                      data-testid="emp-department-input"
                      value={employeeForm.department}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emp-designation">Designation</Label>
                    <Input
                      id="emp-designation"
                      data-testid="emp-designation-input"
                      value={employeeForm.designation}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="emp-role">Role</Label>
                  <Select
                    value={employeeForm.role}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, role: value })}
                  >
                    <SelectTrigger data-testid="emp-role-select" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="emp-phone">Phone (Optional)</Label>
                  <Input
                    id="emp-phone"
                    data-testid="emp-phone-input"
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="emp-manager">Manager Email (Optional)</Label>
                  <Input
                    id="emp-manager"
                    data-testid="emp-manager-input"
                    type="email"
                    value={employeeForm.manager_email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, manager_email: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    data-testid="submit-employee-btn"
                    className="flex-1 bg-slate-800 hover:bg-slate-900"
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Employee'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((employee) => (
          <Card
            key={employee.id}
            data-testid={`employee-card-${employee.id}`}
            className="border-slate-100 shadow-sm hover:shadow-md transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-lg truncate">{employee.full_name}</h3>
                  <Badge className="mt-1 capitalize">{employee.role}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600 truncate">{employee.email}</span>
                </div>

                {employee.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600">{employee.phone}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600">
                    {employee.designation} - {employee.department}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs text-slate-500">Sick</p>
                    <p className="text-sm font-semibold text-slate-900">{employee.leave_balance.sick_leave}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Casual</p>
                    <p className="text-sm font-semibold text-slate-900">{employee.leave_balance.casual_leave}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Paid</p>
                    <p className="text-sm font-semibold text-slate-900">{employee.leave_balance.paid_leave}</p>
                  </div>
                </div>
              </div>

              {employee.manager_name && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Reports to</p>
                  <p className="text-sm font-medium text-slate-700">{employee.manager_name}</p>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Joined {format(new Date(employee.joining_date), 'MMM dd, yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employees.length === 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center text-slate-500">
              <User className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">No employees found</p>
              {user?.role === 'admin' && (
                <p className="text-sm">Click "Add Employee" to create your first employee</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeesPage;