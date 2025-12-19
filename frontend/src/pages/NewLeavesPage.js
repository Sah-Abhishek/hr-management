import React, { useState, useEffect } from 'react';
import { Plus, Calendar, ChevronLeft, ChevronRight, X, Clock, Sun, Sunset, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Selected dates with their configurations
  // Format: { 'YYYY-MM-DD': { type: 'full' | 'half', period: 'morning' | 'afternoon' } }
  const [selectedDates, setSelectedDates] = useState({});

  const [leaveForm, setLeaveForm] = useState({
    leave_type: 'Sick Leave',
    reason: '',
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

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay, year, month };
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const toggleDateSelection = (dateKey) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateKey);

    if (selectedDate < today) {
      toast.error('Cannot select past dates');
      return;
    }

    setSelectedDates(prev => {
      if (prev[dateKey]) {
        const { [dateKey]: removed, ...rest } = prev;
        return rest;
      } else {
        return {
          ...prev,
          [dateKey]: { type: 'full', period: 'morning' }
        };
      }
    });
  };

  const updateDateConfig = (dateKey, config) => {
    setSelectedDates(prev => ({
      ...prev,
      [dateKey]: { ...prev[dateKey], ...config }
    }));
  };

  const removeDate = (dateKey) => {
    setSelectedDates(prev => {
      const { [dateKey]: removed, ...rest } = prev;
      return rest;
    });
  };

  const clearAllDates = () => {
    setSelectedDates({});
  };

  const calculateTotalDays = () => {
    return Object.values(selectedDates).reduce((total, config) => {
      return total + (config.type === 'full' ? 1 : 0.5);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(selectedDates).length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    if (!leaveForm.reason.trim()) {
      toast.error('Please provide a reason for your leave');
      return;
    }

    setSubmitting(true);

    try {
      // Group consecutive dates with same configuration
      const sortedDates = Object.keys(selectedDates).sort();
      const leaveRequests = [];

      let currentGroup = {
        start: sortedDates[0],
        end: sortedDates[0],
        config: selectedDates[sortedDates[0]]
      };

      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const prevDate = new Date(sortedDates[i - 1]);
        const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
        const sameConfig = JSON.stringify(selectedDates[sortedDates[i]]) === JSON.stringify(currentGroup.config);

        if (diffDays === 1 && sameConfig) {
          // Extend current group
          currentGroup.end = sortedDates[i];
        } else {
          // Save current group and start new one
          leaveRequests.push({ ...currentGroup });
          currentGroup = {
            start: sortedDates[i],
            end: sortedDates[i],
            config: selectedDates[sortedDates[i]]
          };
        }
      }
      leaveRequests.push(currentGroup);

      // Submit each leave request
      for (const request of leaveRequests) {
        const payload = {
          leave_type: leaveForm.leave_type,
          start_date: new Date(request.start).toISOString(),
          end_date: new Date(request.end).toISOString(),
          reason: leaveForm.reason,
          is_half_day: request.config.type === 'half',
          half_day_period: request.config.period,
        };

        await api.post('/leaves', payload);
      }

      toast.success(`Leave application${leaveRequests.length > 1 ? 's' : ''} submitted successfully!`);
      setDialogOpen(false);
      setLeaveForm({
        leave_type: 'Sick Leave',
        reason: '',
      });
      setSelectedDates({});
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit leave application');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDay, year, month } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Empty cells for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 w-10"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(year, month, day);
      const date = new Date(year, month, day);
      const isSelected = !!selectedDates[dateKey];
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const config = selectedDates[dateKey];

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isPast && toggleDateSelection(dateKey)}
          disabled={isPast}
          className={`
            h-10 w-10 rounded-full text-sm font-medium transition-all relative
            ${isPast ? 'text-slate-300 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100'}
            ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}
            ${isWeekend && !isSelected ? 'text-slate-400' : ''}
            ${isSelected && config?.type === 'full' ? 'bg-emerald-500 text-white hover:bg-emerald-600' : ''}
            ${isSelected && config?.type === 'half' ? 'bg-amber-400 text-white hover:bg-amber-500' : ''}
          `}
        >
          {day}
          {isSelected && config?.type === 'half' && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[8px]">
              ½
            </span>
          )}
        </button>
      );
    }

    return (
      <div>
        {/* Day names header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(name => (
            <div key={name} className="h-8 w-10 flex items-center justify-center text-xs font-medium text-slate-500">
              {name}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      manager_approved: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return statusConfig[status] || statusConfig.pending;
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const sortedSelectedDates = Object.keys(selectedDates).sort();

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
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedDates({});
            setLeaveForm({ leave_type: 'Sick Leave', reason: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="apply-leave-btn" className="bg-slate-800 hover:bg-slate-900 rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Apply Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Apply for Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Leave Type */}
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

              {/* Calendar and Selected Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calendar */}
                <div>
                  <Label className="mb-3 block">Select Dates</Label>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={goToPreviousMonth}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="font-semibold text-slate-700">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={goToNextMonth}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {renderCalendar()}

                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-600">Full Day</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-amber-400"></div>
                        <span className="text-slate-600">Half Day</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Dates Configuration */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Selected Days ({calculateTotalDays()} days)</Label>
                    {sortedSelectedDates.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAllDates}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl border border-slate-200 min-h-[300px] max-h-[300px] overflow-y-auto">
                    {sortedSelectedDates.length > 0 ? (
                      <div className="p-2 space-y-2">
                        {sortedSelectedDates.map((dateKey) => {
                          const config = selectedDates[dateKey];
                          const date = new Date(dateKey);
                          return (
                            <div
                              key={dateKey}
                              className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-slate-400" />
                                  <span className="font-medium text-slate-700">
                                    {format(date, 'EEE, MMM dd, yyyy')}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeDate(dateKey)}
                                  className="h-6 w-6 text-slate-400 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Full Day / Half Day Toggle */}
                                <div className="flex bg-slate-100 rounded-lg p-0.5 flex-1">
                                  <button
                                    type="button"
                                    onClick={() => updateDateConfig(dateKey, { type: 'full' })}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1
                                      ${config.type === 'full'
                                        ? 'bg-emerald-500 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    Full Day
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateDateConfig(dateKey, { type: 'half' })}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1
                                      ${config.type === 'half'
                                        ? 'bg-amber-400 text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                      }`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    Half Day
                                  </button>
                                </div>
                              </div>

                              {/* Half Day Period Selection */}
                              {config.type === 'half' && (
                                <div className="flex gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => updateDateConfig(dateKey, { period: 'morning' })}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 border
                                      ${config.period === 'morning'
                                        ? 'bg-amber-100 border-amber-400 text-amber-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                      }`}
                                  >
                                    <Sun className="w-3 h-3" />
                                    Morning
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateDateConfig(dateKey, { period: 'afternoon' })}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1 border
                                      ${config.period === 'afternoon'
                                        ? 'bg-amber-100 border-amber-400 text-amber-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                      }`}
                                  >
                                    <Sunset className="w-3 h-3" />
                                    Afternoon
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                        <Calendar className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">Click on dates to select</p>
                        <p className="text-xs mt-1">You can select multiple days</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  data-testid="reason-textarea"
                  placeholder="Please provide a reason for your leave..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  required
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Summary */}
              {sortedSelectedDates.length > 0 && (
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-2">Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Leave Type</p>
                      <p className="font-medium text-slate-900">{leaveForm.leave_type}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Selected Days</p>
                      <p className="font-medium text-slate-900">{sortedSelectedDates.length} day{sortedSelectedDates.length > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Total Leave</p>
                      <p className="font-medium text-emerald-600 text-lg">{calculateTotalDays()} day{calculateTotalDays() !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
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
                  disabled={submitting || sortedSelectedDates.length === 0}
                >
                  {submitting ? 'Submitting...' : `Submit Leave (${calculateTotalDays()} days)`}
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
                          {format(new Date(leave.start_date), 'MMM dd, yyyy')}
                          {leave.start_date !== leave.end_date && (
                            <> - {format(new Date(leave.end_date), 'MMM dd, yyyy')}</>
                          )}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>{leave.days_count} day{leave.days_count > 1 ? 's' : ''}</span>
                        {leave.is_half_day && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            Half Day ({leave.half_day_period})
                          </Badge>
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
