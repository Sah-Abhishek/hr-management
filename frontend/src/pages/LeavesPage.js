import React, { useState, useEffect } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

const LeavesPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'Sick Leave',
    start_date: '',
    end_date: '',
    reason: '',
    is_half_day: false,
    half_day_period: 'morning',
  });

  useEffect(() => {
    fetchLeaves();
    loadLeaveTypes();
  }, []);

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

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/leaves/my-leaves');
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;

    if (leaveForm.start_date && newEndDate < leaveForm.start_date) {
      toast.error('End date cannot be before start date');
    }

    setLeaveForm({ ...leaveForm, end_date: newEndDate });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Date validation
    const startDate = new Date(leaveForm.start_date);
    const endDate = new Date(leaveForm.end_date);

    if (endDate < startDate) {
      toast.error('End date cannot be before start date');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...leaveForm,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      };

      await api.post('/leaves', payload);
      toast.success('Leave application submitted successfully!');
      setDialogOpen(false);
      setLeaveForm({
        leave_type: 'Sick Leave',
        start_date: '',
        end_date: '',
        reason: '',
        is_half_day: false,
        half_day_period: 'morning',
      });
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: 'pending',
      manager_approved: 'pending',
      approved: 'approved',
      rejected: 'rejected',
    };
    return statusMap[status] || 'pending';
  };

  const getStatusText = (status) => {
    const textMap = {
      pending: 'Pending',
      manager_approved: 'Manager Approved',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return textMap[status] || status;
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
            My Leaves
          </h1>
          <p className="text-lg text-slate-600">Manage your leave applications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="apply-leave-btn" className="bg-slate-800 hover:bg-slate-900 rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Apply Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="leave-type">Leave Type</Label>
                <Select
                  value={leaveForm.leave_type}
                  onValueChange={(value) => setLeaveForm({ ...leaveForm, leave_type: value })}
                >
                  <SelectTrigger data-testid="leave-type-select" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.name} value={type.name}>
                        {type.name} {type.quota > 0 && `(${type.quota} days/year)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    data-testid="start-date-input"
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    data-testid="end-date-input"
                    type="date"
                    value={leaveForm.end_date}
                    min={leaveForm.start_date}  // HTML5 native validation
                    onChange={handleEndDateChange}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="is-half-day"
                    type="checkbox"
                    checked={leaveForm.is_half_day}
                    onChange={(e) => setLeaveForm({ ...leaveForm, is_half_day: e.target.checked })}
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="is-half-day" className="text-sm font-medium">
                    Half Day Leave
                  </Label>
                </div>
                {leaveForm.is_half_day && (
                  <div>
                    <Label htmlFor="half-day-period">Half Day Period</Label>
                    <Select
                      value={leaveForm.half_day_period}
                      onValueChange={(value) => setLeaveForm({ ...leaveForm, half_day_period: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  data-testid="reason-textarea"
                  placeholder="Please provide a reason for your leave..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  required
                  rows={4}
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
                  data-testid="submit-leave-btn"
                  className="flex-1 bg-slate-800 hover:bg-slate-900"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leaves List */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Leave History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaves.length > 0 ? (
            <div className="space-y-3">
              {leaves.map((leave) => (
                <div
                  key={leave.id}
                  data-testid={`leave-item-${leave.id}`}
                  className="p-5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{leave.leave_type}</h3>
                        <Badge className={getStatusBadge(leave.status)}>{getStatusText(leave.status)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(leave.start_date), 'MMM dd, yyyy')} -{' '}
                          {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>{leave.days_count} day{leave.days_count > 1 ? 's' : ''}</span>
                        {leave.is_half_day && (
                          <span className="text-slate-400"> • Half Day ({leave.half_day_period})</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Reason: </span>
                      {leave.reason}
                    </p>
                  </div>
                  {leave.approvals && leave.approvals.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Approval History</p>
                      <div className="space-y-2">
                        {leave.approvals.map((approval, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium text-slate-700">{approval.approver_name}</span>
                            <span className="text-slate-500"> ({approval.approver_role}) </span>
                            <span className={approval.action === 'approve' ? 'text-emerald-600' : 'text-red-600'}>
                              {approval.action === 'approve' ? 'approved' : 'rejected'}
                            </span>
                            {approval.comments && (
                              <p className="text-slate-600 mt-1">Comment: {approval.comments}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">No leave applications yet</p>
              <p className="text-sm">Click &quot;Apply Leave&quot; to submit your first application</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeavesPage;
