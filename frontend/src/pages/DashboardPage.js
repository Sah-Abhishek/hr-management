import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { getAuth } from '@/lib/auth';
import { format } from 'date-fns';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = getAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
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
    <div className="p-6 md:p-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Dashboard
        </h1>
        <p className="text-lg text-slate-600">Welcome back! Here's your overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Card data-testid="total-employees-card" className="border-slate-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total {user?.role === 'admin' ? 'Employees' : 'Team Members'}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.total_employees || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Card data-testid="pending-leaves-card" className="border-slate-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending Approvals</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.pending_leaves || 0}</p>
                </div>
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {user?.role === 'admin' && (
          <Card data-testid="approved-leaves-card" className="border-slate-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Approved This Month</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.approved_leaves_this_month || 0}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats?.my_leave_balance && (
          <Card data-testid="leave-balance-card" className="border-slate-100 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">My Leave Balance</p>
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500">Sick</p>
                  <p className="text-lg font-bold text-slate-900">{stats.my_leave_balance.sick_leave}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Casual</p>
                  <p className="text-lg font-bold text-slate-900">{stats.my_leave_balance.casual_leave}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Paid</p>
                  <p className="text-lg font-bold text-slate-900">{stats.my_leave_balance.paid_leave}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Leaves */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Recent Leaves
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recent_leaves && stats.recent_leaves.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_leaves.map((leave) => (
                <div
                  key={leave.id}
                  data-testid={`recent-leave-${leave.id}`}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-slate-900">{leave.employee_name}</p>
                      <Badge className={getStatusBadge(leave.status)}>{getStatusText(leave.status)}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {leave.leave_type} - {leave.days_count} day{leave.days_count > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {format(new Date(leave.start_date), 'MMM dd, yyyy')} -{' '}
                      {format(new Date(leave.end_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No recent leaves found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;