import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

const ApprovalsPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({ open: false, leave: null, action: null });
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingLeaves();
  }, []);

  const fetchPendingLeaves = async () => {
    try {
      const response = await api.get('/leaves/pending');
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to fetch pending leaves:', error);
      toast.error('Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog.leave || !actionDialog.action) return;

    setSubmitting(true);
    try {
      await api.put(`/leaves/${actionDialog.leave.id}/action`, {
        action: actionDialog.action,
        comments: comments || undefined,
      });

      toast.success(
        `Leave ${actionDialog.action === 'approve' ? 'approved' : 'rejected'} successfully!`
      );

      setActionDialog({ open: false, leave: null, action: null });
      setComments('');
      fetchPendingLeaves();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process leave');
    } finally {
      setSubmitting(false);
    }
  };

  const openActionDialog = (leave, action) => {
    setActionDialog({ open: true, leave, action });
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
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Pending Approvals
        </h1>
        <p className="text-lg text-slate-600">Review and approve leave requests</p>
      </div>

      {/* Approvals List */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaves.length > 0 ? (
            <div className="space-y-4">
              {leaves.map((leave) => (
                <div
                  key={leave.id}
                  data-testid={`approval-item-${leave.id}`}
                  className="p-6 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{leave.employee_name}</h3>
                          <p className="text-sm text-slate-500">{leave.employee_email}</p>
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusBadge(leave.status)}>{getStatusText(leave.status)}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Leave Type
                      </p>
                      <p className="font-semibold text-slate-900">{leave.leave_type}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Duration
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <p className="text-sm text-slate-900">
                          {format(new Date(leave.start_date), 'MMM dd')} -{' '}
                          {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {leave.days_count} day{leave.days_count > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Reason</p>
                    <p className="text-sm text-slate-700">{leave.reason}</p>
                  </div>

                  {leave.approvals && leave.approvals.length > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200 mb-4">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                        Approval History
                      </p>
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

                  <div className="flex gap-3">
                    <Button
                      onClick={() => openActionDialog(leave, 'approve')}
                      data-testid={`approve-btn-${leave.id}`}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => openActionDialog(leave, 'reject')}
                      data-testid={`reject-btn-${leave.id}`}
                      variant="outline"
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 rounded-full"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">No pending approvals</p>
              <p className="text-sm">All leave requests have been processed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setActionDialog({ open: false, leave: null, action: null });
          setComments('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {actionDialog.leave && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900 mb-1">{actionDialog.leave.employee_name}</p>
                <p className="text-sm text-slate-600">
                  {actionDialog.leave.leave_type} - {actionDialog.leave.days_count} day(s)
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                data-testid="action-comments-textarea"
                placeholder="Add any comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setActionDialog({ open: false, leave: null, action: null });
                  setComments('');
                }}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                data-testid="confirm-action-btn"
                className={`flex-1 ${
                  actionDialog.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalsPage;