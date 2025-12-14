import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const LeavePolicyPage = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [policy, setPolicy] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLeaveTypesAndPolicy();
  }, []);

  const loadLeaveTypesAndPolicy = () => {
    // Load leave types from Settings
    const savedTypes = localStorage.getItem('leave_types');
    const types = savedTypes ? JSON.parse(savedTypes) : [
      'Sick Leave',
      'Casual Leave', 
      'Paid Leave',
      'Unpaid Leave'
    ];
    setLeaveTypes(types);

    // Load saved policy
    const savedPolicy = localStorage.getItem('leave_policy');
    if (savedPolicy) {
      setPolicy(JSON.parse(savedPolicy));
    } else {
      // Initialize with default quotas
      const defaultPolicy = {};
      types.forEach(type => {
        const key = type.toLowerCase().replace(/ /g, '_');
        defaultPolicy[key] = 0;
      });
      // Set some defaults
      defaultPolicy['sick_leave'] = 12;
      defaultPolicy['casual_leave'] = 12;
      defaultPolicy['paid_leave'] = 15;
      setPolicy(defaultPolicy);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('leave_policy', JSON.stringify(policy));
      toast.success('Leave policy updated successfully!');
    } catch (error) {
      toast.error('Failed to update leave policy');
    } finally {
      setSaving(false);
    }
  };

  const updateQuota = (leaveType, value) => {
    const key = leaveType.toLowerCase().replace(/ /g, '_');
    setPolicy({ ...policy, [key]: parseInt(value) || 0 });
  };

  const getQuota = (leaveType) => {
    const key = leaveType.toLowerCase().replace(/ /g, '_');
    return policy[key] || 0;
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
              {leaveTypes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No leave types configured.</p>
                  <p className="text-sm mt-2">Go to Settings to add leave types first.</p>
                </div>
              ) : (
                leaveTypes.map((leaveType, index) => {
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
                    <div key={leaveType} className={`p-4 rounded-lg border ${colorClass}`}>
                      <Label htmlFor={`leave-${leaveType}`} className="font-medium">
                        {leaveType} (days/year)
                      </Label>
                      <Input
                        id={`leave-${leaveType}`}
                        data-testid={`${leaveType.toLowerCase().replace(/ /g, '-')}-input`}
                        type="number"
                        min="0"
                        value={getQuota(leaveType)}
                        onChange={(e) => updateQuota(leaveType, e.target.value)}
                        className="mt-2 bg-white"
                      />
                      <p className="text-xs mt-1 opacity-70">
                        {getQuota(leaveType) === 0 ? 'Unlimited - Set 0 for unlimited' : `${getQuota(leaveType)} days per year`}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              {leaveTypes.length > 0 && (
                <>
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
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-slate-600">Total Annual Leaves per Employee:</span>
            <span className="text-2xl font-bold text-slate-900">
              {Object.values(policy).reduce((sum, val) => sum + val, 0)} days
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Calculated from all configured leave types above
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeavePolicyPage;