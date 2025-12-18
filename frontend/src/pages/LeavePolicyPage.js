import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';

const LeavePolicyPage = () => {
  const [policy, setPolicy] = useState({ policies: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingToAll, setApplyingToAll] = useState(false);

  useEffect(() => {
    loadLeavePolicy();
  }, []);

  const loadLeavePolicy = async () => {
    setLoading(true);
    try {
      const response = await api.get('/leave-policy');
      setPolicy(response.data);
    } catch (error) {
      console.error('Failed to load leave policy:', error);
      toast.error('Failed to load leave policy');
      // Set default if load fails
      setPolicy({
        policies: [
          { leave_type: 'Sick Leave', annual_quota: 12, order: 1 },
          { leave_type: 'Casual Leave', annual_quota: 12, order: 2 },
          { leave_type: 'Paid Leave', annual_quota: 15, order: 3 },
          { leave_type: 'Unpaid Leave', annual_quota: 0, order: 4 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/leave-policy', policy);
      toast.success('Leave policy updated successfully!');
    } catch (error) {
      console.error('Failed to save policy:', error);
      toast.error(error.response?.data?.detail || 'Failed to update leave policy');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToAll = async () => {
    if (!window.confirm('This will update leave balances for ALL employees. Are you sure?')) {
      return;
    }

    setApplyingToAll(true);
    try {
      const response = await api.post('/leave-policy/apply-to-all');
      toast.success(response.data.message);
    } catch (error) {
      console.error('Failed to apply policy:', error);
      toast.error(error.response?.data?.detail || 'Failed to apply policy');
    } finally {
      setApplyingToAll(false);
    }
  };

  const updateQuota = (index, value) => {
    const newPolicies = [...policy.policies];
    newPolicies[index].annual_quota = parseFloat(value) || 0;
    setPolicy({ ...policy, policies: newPolicies });
  };

  const getTotalDays = () => {
    return policy.policies.reduce((sum, p) => sum + (p.annual_quota || 0), 0);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading leave policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Leave Policy Settings
        </h1>
        <p className="text-lg text-slate-600">Configure annual leave quotas for all employees</p>
      </div>

      <Card className="max-w-2xl border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            <Settings className="w-6 h-6" />
            Annual Leave Quotas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              {policy.policies.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No leave types configured.</p>
                  <p className="text-sm mt-2">Go to Settings to add leave types first.</p>
                </div>
              ) : (
                policy.policies.map((policyItem, index) => {
                  const colors = [
                    'bg-blue-50 border-blue-100 text-blue-900',
                    'bg-emerald-50 border-emerald-100 text-emerald-900',
                    'bg-purple-50 border-purple-100 text-purple-900',
                    'bg-amber-50 border-amber-100 text-amber-900',
                    'bg-pink-50 border-pink-100 text-pink-900',
                    'bg-indigo-50 border-indigo-100 text-indigo-900',
                  ];
                  const colorClass = colors[index % colors.length];

                  return (
                    <div key={index} className={`p-4 rounded-lg border ${colorClass}`}>
                      <Label htmlFor={`leave-${index}`} className="font-medium">
                        {policyItem.leave_type} (days/year)
                      </Label>
                      <Input
                        id={`leave-${index}`}
                        data-testid={`${policyItem.leave_type.toLowerCase().replace(/ /g, '-')}-input`}
                        type="number"
                        min="0"
                        step="0.5"
                        value={policyItem.annual_quota}
                        onChange={(e) => updateQuota(index, e.target.value)}
                        className="mt-2 bg-white"
                      />
                      <p className="text-xs mt-1 opacity-70">
                        {policyItem.annual_quota === 0
                          ? 'Unlimited - Set 0 for unlimited'
                          : `${policyItem.annual_quota} days per year`}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              {policy.policies.length > 0 && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-semibold mb-1">Important Notes:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>These quotas apply to new employees automatically</li>
                          <li>Use "Apply to All Employees" button to update existing employees</li>
                          <li>Individual adjustments can be made from the Employees page</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      data-testid="save-policy-btn"
                      className="w-full bg-slate-800 hover:bg-slate-900"
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Leave Policy'}
                    </Button>

                    <Button
                      type="button"
                      onClick={handleApplyToAll}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={applyingToAll}
                      variant="default"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${applyingToAll ? 'animate-spin' : ''}`} />
                      {applyingToAll ? 'Applying...' : 'Apply to All Employees'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="max-w-2xl border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">Total Annual Leave Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <span className="text-slate-600">Total Annual Leaves per Employee:</span>
              <span className="text-2xl font-bold text-slate-900">
                {getTotalDays()} days
              </span>
            </div>

            {policy.policies.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Breakdown:</p>
                <div className="grid grid-cols-2 gap-2">
                  {policy.policies.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                      <span className="text-slate-600">{p.leave_type}:</span>
                      <span className="font-medium">{p.annual_quota} days</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Calculated from all configured leave types above
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeavePolicyPage;
