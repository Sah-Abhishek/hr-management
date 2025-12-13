import React, { useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const LeavePolicyPage = () => {
  const [policy, setPolicy] = useState({
    sick_leave: 12,
    casual_leave: 12,
    paid_leave: 15,
    unpaid_leave: 0,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // For now, just show success. In production, this would save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Leave policy updated successfully!');
      localStorage.setItem('leave_policy', JSON.stringify(policy));
    } catch (error) {
      toast.error('Failed to update leave policy');
    } finally {
      setSaving(false);
    }
  };

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
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <Label htmlFor="sick-leave" className="text-blue-900 font-medium">Sick Leave (days/year)</Label>
                <Input
                  id="sick-leave"
                  data-testid="sick-leave-input"
                  type="number"
                  min="0"
                  value={policy.sick_leave}
                  onChange={(e) => setPolicy({ ...policy, sick_leave: parseInt(e.target.value) || 0 })}
                  className="mt-2 bg-white"
                />
                <p className="text-xs text-blue-600 mt-1">For medical emergencies and illness</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <Label htmlFor="casual-leave" className="text-emerald-900 font-medium">Casual Leave (days/year)</Label>
                <Input
                  id="casual-leave"
                  data-testid="casual-leave-input"
                  type="number"
                  min="0"
                  value={policy.casual_leave}
                  onChange={(e) => setPolicy({ ...policy, casual_leave: parseInt(e.target.value) || 0 })}
                  className="mt-2 bg-white"
                />
                <p className="text-xs text-emerald-600 mt-1">For personal matters and short breaks</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <Label htmlFor="paid-leave" className="text-purple-900 font-medium">Paid Leave / Vacation (days/year)</Label>
                <Input
                  id="paid-leave"
                  data-testid="paid-leave-input"
                  type="number"
                  min="0"
                  value={policy.paid_leave}
                  onChange={(e) => setPolicy({ ...policy, paid_leave: parseInt(e.target.value) || 0 })}
                  className="mt-2 bg-white"
                />
                <p className="text-xs text-purple-600 mt-1">For vacations and planned time off</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <Label className="text-slate-900 font-medium">Unpaid Leave</Label>
                <div className="mt-2 p-3 bg-white rounded border border-slate-200">
                  <p className="text-sm text-slate-600">Unlimited - No quota</p>
                </div>
                <p className="text-xs text-slate-600 mt-1">Available without pay deduction from salary</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> These quotas will apply to all new employees. Existing employee balances won't be affected automatically.
                </p>
              </div>

              <Button
                type="submit"
                data-testid="save-policy-btn"
                className="w-full bg-slate-800 hover:bg-slate-900 rounded-full"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Leave Policy'}
              </Button>
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
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Total Paid Leaves per Employee:</span>
            <span className="text-2xl font-bold text-slate-900">
              {policy.sick_leave + policy.casual_leave + policy.paid_leave} days
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Plus unlimited unpaid leave available to all employees
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeavePolicyPage;