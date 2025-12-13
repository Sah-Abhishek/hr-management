import React, { useState, useEffect } from 'react';
import { Calendar, Edit2, X, Check, Clock, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

const AllLeavesPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchAllLeaves();
  }, []);

  useEffect(() => {
    filterLeaves();
  }, [leaves, searchTerm, filterStatus, filterType]);

  const fetchAllLeaves = async () => {
    try {
      const response = await api.get('/leaves/all');
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const filterLeaves = () => {
    let filtered = [...leaves];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(leave =>
        leave.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.employee_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(leave => leave.status === filterStatus);
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(leave => leave.leave_type === filterType);
    }

    setFilteredLeaves(filtered);
  };

  const handleEditLeave = (leave) => {
    setSelectedLeave({
      ...leave,
      start_date: format(new Date(leave.start_date), 'yyyy-MM-dd'),
      end_date: format(new Date(leave.end_date), 'yyyy-MM-dd'),
    });
    setEditDialogOpen(true);
  };

  const handleUpdateLeave = async () => {
    try {
      // Calculate new days count
      const start = new Date(selectedLeave.start_date);
      const end = new Date(selectedLeave.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      // For now, we'll create a note - you can extend backend to support leave updates
      toast.success('Leave details noted. Contact developer to implement backend update.');
      setEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update leave');
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave?')) return;

    try {
      await api.put(`/leaves/${leaveId}/action`, {
        action: 'reject',
        comments: 'Cancelled by admin'
      });
      toast.success('Leave cancelled successfully');
      fetchAllLeaves();
    } catch (error) {
      toast.error('Failed to cancel leave');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', text: 'Pending' },
      manager_approved: { color: 'bg-blue-100 text-blue-700 border-blue-200', text: 'Manager Approved' },
      approved: { color: 'bg-green-100 text-green-700 border-green-200', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-700 border-red-200', text: 'Rejected' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getLeaveStats = () => {
    return {
      total: leaves.length,
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
    };
  };

  const stats = getLeaveStats();

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
          All Employee Leaves
        </h1>
        <p className="text-lg text-slate-600">View and manage all leave applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500 mb-1">Total Leaves</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500 mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search by employee name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="manager_approved">Manager Approved</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Sick Leave">Sick Leave</SelectItem>
              <SelectItem value="Casual Leave">Casual Leave</SelectItem>
              <SelectItem value="Paid Leave">Paid Leave</SelectItem>
              <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leaves Table */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Leave Records ({filteredLeaves.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLeaves.length > 0 ? (
            <div className="space-y-3">
              {filteredLeaves.map((leave) => {
                const statusBadge = getStatusBadge(leave.status);
                return (
                  <div
                    key={leave.id}
                    className="p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900 text-lg">{leave.employee_name}</h3>
                          <Badge className={`${statusBadge.color} border`}>
                            {statusBadge.text}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">{leave.employee_email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditLeave(leave)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {leave.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelLeave(leave.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Leave Type</p>
                        <p className="font-medium text-slate-900">{leave.leave_type}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Duration</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <p className="text-sm text-slate-900">
                            {format(new Date(leave.start_date), 'MMM dd')} - {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{leave.days_count} day(s)</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Applied On</p>
                        <p className="text-sm text-slate-900">{format(new Date(leave.created_at), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Reason</p>
                      <p className="text-sm text-slate-700">{leave.reason}</p>
                    </div>

                    {leave.approvals && leave.approvals.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                          Approval History
                        </p>
                        <div className="space-y-2">
                          {leave.approvals.map((approval, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {approval.action === 'approve' ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-600" />
                              )}
                              <span className="font-medium text-slate-700">{approval.approver_name}</span>
                              <span className="text-slate-500">({approval.approver_role})</span>
                              <span className={approval.action === 'approve' ? 'text-green-600' : 'text-red-600'}>
                                {approval.action === 'approve' ? 'approved' : 'rejected'}
                              </span>
                              {approval.comments && (
                                <span className="text-slate-600 ml-2">- {approval.comments}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">No leaves found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Leave Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Leave Details</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900">{selectedLeave.employee_name}</p>
                <p className="text-sm text-slate-600">{selectedLeave.employee_email}</p>
              </div>

              <div>
                <Label>Leave Type</Label>
                <Select
                  value={selectedLeave.leave_type}
                  onValueChange={(value) => setSelectedLeave({ ...selectedLeave, leave_type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                    <SelectItem value="Paid Leave">Paid Leave</SelectItem>
                    <SelectItem value="Unpaid Leave">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={selectedLeave.start_date}
                    onChange={(e) => setSelectedLeave({ ...selectedLeave, start_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={selectedLeave.end_date}
                    onChange={(e) => setSelectedLeave({ ...selectedLeave, end_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Reason</Label>
                <Textarea
                  value={selectedLeave.reason}
                  onChange={(e) => setSelectedLeave({ ...selectedLeave, reason: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Editing leaves requires backend implementation. This is a preview feature.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateLeave}
                  className="flex-1 bg-slate-800 hover:bg-slate-900"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllLeavesPage;
