import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Briefcase, Calendar, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

const ProfilePage = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: '',
    department: '',
    designation: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setEmployee(response.data);
      setEditForm({
        full_name: response.data.full_name,
        department: response.data.department,
        designation: response.data.designation,
        phone: response.data.phone || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/employees/${employee.id}`, editForm);
      toast.success('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      full_name: employee.full_name,
      department: employee.department,
      designation: employee.designation,
      phone: employee.phone || '',
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            My Profile
          </h1>
          <p className="text-lg text-slate-600">View and manage your information</p>
        </div>
        {!editing && (
          <Button
            onClick={() => setEditing(true)}
            data-testid="edit-profile-btn"
            className="bg-slate-800 hover:bg-slate-900 rounded-full"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    data-testid="edit-name-input"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-department">Department</Label>
                    <Input
                      id="edit-department"
                      data-testid="edit-department-input"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-designation">Designation</Label>
                    <Input
                      id="edit-designation"
                      data-testid="edit-designation-input"
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    data-testid="edit-phone-input"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                    disabled={submitting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    data-testid="save-profile-btn"
                    className="flex-1 bg-slate-800 hover:bg-slate-900"
                    disabled={submitting}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                  <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="w-10 h-10 text-slate-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{employee.full_name}</h2>
                    <Badge className="mt-2 capitalize">{employee.role}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Email</p>
                    </div>
                    <p className="text-slate-900 ml-8">{employee.email}</p>
                  </div>

                  {employee.phone && (
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Phone</p>
                      </div>
                      <p className="text-slate-900 ml-8">{employee.phone}</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="w-5 h-5 text-slate-400" />
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Department</p>
                    </div>
                    <p className="text-slate-900 ml-8">{employee.department}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="w-5 h-5 text-slate-400" />
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Designation</p>
                    </div>
                    <p className="text-slate-900 ml-8">{employee.designation}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Joining Date</p>
                    </div>
                    <p className="text-slate-900 ml-8">
                      {format(new Date(employee.joining_date), 'MMMM dd, yyyy')}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-slate-400" />
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Employee ID</p>
                    </div>
                    <p className="text-slate-900 ml-8">{employee.id}</p>
                  </div>
                </div>

                {employee.manager_name && (
                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Reports To</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{employee.manager_name}</p>
                        <p className="text-sm text-slate-500">{employee.manager_email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Balance Card */}
        <Card className="border-slate-100 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Leave Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-700 mb-1">Sick Leave</p>
                <p className="text-3xl font-bold text-blue-900">{employee.leave_balance.sick_leave}</p>
                <p className="text-xs text-blue-600 mt-1">days remaining</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-sm font-medium text-emerald-700 mb-1">Casual Leave</p>
                <p className="text-3xl font-bold text-emerald-900">{employee.leave_balance.casual_leave}</p>
                <p className="text-xs text-emerald-600 mt-1">days remaining</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm font-medium text-purple-700 mb-1">Paid Leave</p>
                <p className="text-3xl font-bold text-purple-900">{employee.leave_balance.paid_leave}</p>
                <p className="text-xs text-purple-600 mt-1">days remaining</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-1">Unpaid Leave</p>
                <p className="text-3xl font-bold text-slate-900">{employee.leave_balance.unpaid_leave}</p>
                <p className="text-xs text-slate-600 mt-1">days used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;