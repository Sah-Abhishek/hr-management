import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

const SalaryStructurePage = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [salaryTemplate, setSalaryTemplate] = useState(null);

  const [salaryStructure, setSalaryStructure] = useState({
    basic_salary: 0,
    components: []
  });

  useEffect(() => {
    fetchEmployees();
    fetchSalaryTemplate();
  }, []);

  const fetchSalaryTemplate = async () => {
    try {
      const response = await api.get('/salary-template');
      setSalaryTemplate(response.data);
    } catch (error) {
      console.error('Failed to load salary template:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to load employees');
    }
  };

  const handleEmployeeChange = async (empId) => {
    console.log("This is the empId: ", empId)
    setSelectedEmployee(empId);
    setLoading(true);

    try {
      const response = await api.get(`/salary-structure/${empId}`);
      console.log("This is the response from the backend: ", response.data)
      if (response.data) {
        // Employee already has a saved structure
        setSalaryStructure({
          basic_salary: response.data.basic_salary || 0,
          components: response.data.components || []
        });
      } else {
        // No saved structure - initialize with template
        const employee = employees.find(e => e.id === empId);
        const basicSalary = employee?.monthly_salary || 0;

        // Create components from template
        let initialComponents = [];
        if (salaryTemplate) {
          // Add earnings from template
          if (salaryTemplate.earnings) {
            initialComponents = initialComponents.concat(
              salaryTemplate.earnings.map(earning => ({
                name: earning.name,
                amount: 0,
                type: 'earning',
                is_percentage: false,
                calculation_base: 'basic'
              }))
            );
          }

          // Add deductions from template
          if (salaryTemplate.deductions) {
            initialComponents = initialComponents.concat(
              salaryTemplate.deductions.map(deduction => ({
                name: deduction.name,
                amount: 0,
                type: 'deduction',
                is_percentage: false,
                calculation_base: 'basic'
              }))
            );
          }
        }

        setSalaryStructure({
          basic_salary: basicSalary,
          components: initialComponents
        });
      }
    } catch (error) {
      console.error(error);
      // On error, still try to initialize with template
      const employee = employees.find(e => e.id === empId);
      const basicSalary = employee?.monthly_salary || 0;

      let initialComponents = [];
      if (salaryTemplate) {
        if (salaryTemplate.earnings) {
          initialComponents = initialComponents.concat(
            salaryTemplate.earnings.map(earning => ({
              name: earning.name,
              amount: 0,
              type: 'earning',
              is_percentage: false,
              calculation_base: 'basic'
            }))
          );
        }

        if (salaryTemplate.deductions) {
          initialComponents = initialComponents.concat(
            salaryTemplate.deductions.map(deduction => ({
              name: deduction.name,
              amount: 0,
              type: 'deduction',
              is_percentage: false,
              calculation_base: 'basic'
            }))
          );
        }
      }

      setSalaryStructure({
        basic_salary: basicSalary,
        components: initialComponents
      });
    } finally {
      setLoading(false);
    }
  };

  const addComponent = (type) => {
    setSalaryStructure({
      ...salaryStructure,
      components: [
        ...salaryStructure.components,
        {
          name: '',
          amount: 0,
          type: type,
          is_percentage: false,
          calculation_base: 'basic'
        }
      ]
    });
  };

  const updateComponent = (index, field, value) => {
    const updated = [...salaryStructure.components];
    updated[index][field] = value;
    setSalaryStructure({ ...salaryStructure, components: updated });
  };

  const removeComponent = (index) => {
    const updated = salaryStructure.components.filter((_, i) => i !== index);
    setSalaryStructure({ ...salaryStructure, components: updated });
  };

  const calculateTotals = () => {
    const basic = parseFloat(salaryStructure.basic_salary) || 0;
    let totalEarnings = basic;
    let totalDeductions = 0;

    salaryStructure.components.forEach(comp => {
      const amount = parseFloat(comp.amount) || 0;
      let calcAmount = amount;

      if (comp.is_percentage && comp.calculation_base === 'basic') {
        calcAmount = (basic * amount) / 100;
      }

      if (comp.type === 'earning') {
        totalEarnings += calcAmount;
      } else {
        totalDeductions += calcAmount;
      }
    });

    return {
      basic,
      grossSalary: totalEarnings,
      totalDeductions,
      netSalary: totalEarnings - totalDeductions
    };
  };

  const handleSave = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    if (salaryStructure.basic_salary <= 0) {
      toast.error('Basic salary must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/salary-structure/${selectedEmployee}`, salaryStructure);
      toast.success('Salary structure saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSendSlip = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    setSending(true);
    try {
      await api.post('/payroll/send-detailed-salary-slip', {
        employee_id: selectedEmployee,
        month: selectedMonth
      });
      toast.success('Salary slip sent successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send salary slip');
    } finally {
      setSending(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Salary Structure Management
          </h1>
          <p className="text-slate-600">Configure detailed salary components for employees</p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex gap-3 items-start">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">About Salary Components</p>
              <p>
                When you select an employee for the first time, the system automatically loads the
                <strong> Salary Template</strong> (defined in Settings → Salary Template).
                You can then customize the amounts for each component specific to this employee.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-2 border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle>Configure Salary Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Employee Selection */}
              <div>
                <Label>Select Employee *</Label>
                <Select value={selectedEmployee} onValueChange={handleEmployeeChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_id || emp.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmployee && !loading && (
                <>
                  {/* Basic Salary */}
                  <div>
                    <Label htmlFor="basic-salary">Basic Salary (₹) *</Label>
                    <Input
                      id="basic-salary"
                      type="number"
                      value={salaryStructure.basic_salary}
                      onChange={(e) => setSalaryStructure({ ...salaryStructure, basic_salary: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>

                  {/* Earnings */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-emerald-700">Earnings</h3>
                      <Button
                        size="sm"
                        onClick={() => addComponent('earning')}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Earning
                      </Button>
                    </div>

                    {salaryStructure.components.filter(c => c.type === 'earning').map((comp, idx) => {
                      const actualIdx = salaryStructure.components.indexOf(comp);
                      return (
                        <div key={actualIdx} className="border border-emerald-200 rounded-lg p-4 mb-3 bg-emerald-50">
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-4">
                              <Input
                                placeholder="Component name"
                                value={comp.name}
                                onChange={(e) => updateComponent(actualIdx, 'name', e.target.value)}
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={comp.amount}
                                onChange={(e) => updateComponent(actualIdx, 'amount', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Select
                                value={comp.is_percentage ? 'percentage' : 'fixed'}
                                onValueChange={(val) => updateComponent(actualIdx, 'is_percentage', val === 'percentage')}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Fixed</SelectItem>
                                  <SelectItem value="percentage">% of Basic</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeComponent(actualIdx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Deductions */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-red-700">Deductions</h3>
                      <Button
                        size="sm"
                        onClick={() => addComponent('deduction')}
                        variant="destructive"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Deduction
                      </Button>
                    </div>

                    {salaryStructure.components.filter(c => c.type === 'deduction').map((comp, idx) => {
                      const actualIdx = salaryStructure.components.indexOf(comp);
                      return (
                        <div key={actualIdx} className="border border-red-200 rounded-lg p-4 mb-3 bg-red-50">
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-4">
                              <Input
                                placeholder="Component name"
                                value={comp.name}
                                onChange={(e) => updateComponent(actualIdx, 'name', e.target.value)}
                              />
                            </div>
                            <div className="col-span-3">
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={comp.amount}
                                onChange={(e) => updateComponent(actualIdx, 'amount', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Select
                                value={comp.is_percentage ? 'percentage' : 'fixed'}
                                onValueChange={(val) => updateComponent(actualIdx, 'is_percentage', val === 'percentage')}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Fixed</SelectItem>
                                  <SelectItem value="percentage">% of Basic</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeComponent(actualIdx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-slate-800 hover:bg-slate-900"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Structure'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Preview & Send Panel */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle>Salary Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEmployee ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-slate-600">Basic Salary:</span>
                      <span className="font-semibold">₹{totals.basic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-emerald-200 bg-emerald-50 px-2 rounded">
                      <span className="text-emerald-700 font-medium">Gross Salary:</span>
                      <span className="font-bold text-emerald-700">₹{totals.grossSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-red-200 bg-red-50 px-2 rounded">
                      <span className="text-red-700 font-medium">Total Deductions:</span>
                      <span className="font-bold text-red-700">₹{totals.totalDeductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-3 border-2 border-blue-200 bg-blue-50 px-3 rounded-lg">
                      <span className="text-blue-900 font-bold text-lg">Net Salary:</span>
                      <span className="font-bold text-blue-900 text-lg">₹{totals.netSalary.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div>
                      <Label htmlFor="month-select">Select Month</Label>
                      <Input
                        id="month-select"
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <Button
                      onClick={handleSendSlip}
                      disabled={sending || !selectedEmployee}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sending ? 'Sending...' : 'Send Detailed Salary Slip'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Select an employee to configure salary</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalaryStructurePage;
