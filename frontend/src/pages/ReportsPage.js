import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';
import Papa from 'papaparse';

const ReportsPage = () => {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [filters, setFilters] = useState({
    reportType: 'monthly_leaves',
    month: format(new Date(), 'yyyy-MM'),
    employee_id: 'all',
    department: 'all',
    organization_id: 'all',
    leave_status: 'all'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, leavesRes, orgsRes] = await Promise.all([
        api.get('/employees'),
        api.get('/leaves/all'),
        api.get('/organizations')
      ]);
      
      setEmployees(empRes.data);
      setLeaves(leavesRes.data);
      setOrganizations(orgsRes.data);
      
      // Extract unique departments
      const depts = [...new Set(empRes.data.map(emp => emp.department))];
      setDepartments(depts);
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeaves = () => {
    let filtered = [...leaves];
    
    // Filter by month
    if (filters.month) {
      const [year, month] = filters.month.split('-');
      filtered = filtered.filter(leave => {
        const leaveDate = new Date(leave.start_date);
        return leaveDate.getFullYear() === parseInt(year) && 
               leaveDate.getMonth() === parseInt(month) - 1;
      });
    }

    // Filter by employee
    if (filters.employee_id !== 'all') {
      filtered = filtered.filter(leave => leave.employee_id === filters.employee_id);
    }

    // Filter by department
    if (filters.department !== 'all') {
      const deptEmployees = employees.filter(emp => emp.department === filters.department);
      const deptEmployeeIds = deptEmployees.map(emp => emp.id);
      filtered = filtered.filter(leave => deptEmployeeIds.includes(leave.employee_id));
    }

    // Filter by organization
    if (filters.organization_id !== 'all') {
      const orgEmployees = employees.filter(emp => emp.organization_id === filters.organization_id);
      const orgEmployeeIds = orgEmployees.map(emp => emp.id);
      filtered = filtered.filter(leave => orgEmployeeIds.includes(leave.employee_id));
    }

    // Filter by status
    if (filters.leave_status !== 'all') {
      filtered = filtered.filter(leave => leave.status === filters.leave_status);
    }

    return filtered;
  };

  const exportToCSV = () => {
    setGenerating(true);
    
    try {
      const filteredLeaves = filterLeaves();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59); // slate-900
      doc.text('Leave Report', 14, 22);
      
      // Report Info
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Generated: ${format(new Date(), 'PPP')}`, 14, 30);
      doc.text(`Period: ${format(new Date(filters.month), 'MMMM yyyy')}`, 14, 36);
      
      // Filters applied
      let yPos = 42;
      if (filters.department !== 'all') {
        doc.text(`Department: ${filters.department}`, 14, yPos);
        yPos += 6;
      }
      if (filters.organization_id !== 'all') {
        const org = organizations.find(o => o.id === filters.organization_id);
        doc.text(`Organization: ${org?.name || 'N/A'}`, 14, yPos);
        yPos += 6;
      }
      if (filters.employee_id !== 'all') {
        const emp = employees.find(e => e.id === filters.employee_id);
        doc.text(`Employee: ${emp?.full_name || 'N/A'}`, 14, yPos);
        yPos += 6;
      }

      // Summary Statistics
      yPos += 6;
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('Summary', 14, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Total Leave Applications: ${filteredLeaves.length}`, 14, yPos);
      yPos += 6;
      doc.text(`Approved: ${filteredLeaves.filter(l => l.status === 'approved').length}`, 14, yPos);
      yPos += 6;
      doc.text(`Pending: ${filteredLeaves.filter(l => l.status === 'pending').length}`, 14, yPos);
      yPos += 6;
      doc.text(`Rejected: ${filteredLeaves.filter(l => l.status === 'rejected').length}`, 14, yPos);
      
      yPos += 10;

      // Prepare table data
      const tableData = filteredLeaves.map(leave => {
        const employee = employees.find(e => e.id === leave.employee_id);
        return [
          employee?.full_name || 'N/A',
          employee?.department || 'N/A',
          leave.leave_type,
          format(new Date(leave.start_date), 'dd/MM/yyyy'),
          format(new Date(leave.end_date), 'dd/MM/yyyy'),
          leave.days_count,
          leave.status.charAt(0).toUpperCase() + leave.status.slice(1)
        ];
      });

      // Add table
      doc.autoTable({
        startY: yPos,
        head: [['Employee', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 41, 59], // slate-900
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [71, 85, 105]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        margin: { top: 10 },
        didParseCell: (data) => {
          // Color code status column
          if (data.column.index === 6 && data.section === 'body') {
            const status = data.cell.raw;
            if (status === 'Approved') {
              data.cell.styles.textColor = [16, 185, 129]; // green
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'Rejected') {
              data.cell.styles.textColor = [239, 68, 68]; // red
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'Pending') {
              data.cell.styles.textColor = [251, 146, 60]; // orange
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `leave_report_${filters.month}_${Date.now()}.pdf`;
      doc.save(fileName);
      
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading...</div>;
  }

  const filteredLeaves = filterLeaves();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Leave Reports
          </h1>
          <p className="text-slate-600">Generate and export leave reports with filters</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters Card */}
          <Card className="lg:col-span-1 border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="month-select">Month *</Label>
                <Input
                  id="month-select"
                  type="month"
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="employee-select">Employee</Label>
                <Select
                  value={filters.employee_id}
                  onValueChange={(value) => setFilters({ ...filters, employee_id: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dept-select">Department</Label>
                <Select
                  value={filters.department}
                  onValueChange={(value) => setFilters({ ...filters, department: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="org-select">Organization</Label>
                <Select
                  value={filters.organization_id}
                  onValueChange={(value) => setFilters({ ...filters, organization_id: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-select">Leave Status</Label>
                <Select
                  value={filters.leave_status}
                  onValueChange={(value) => setFilters({ ...filters, leave_status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="manager_approved">Manager Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generatePDF}
                disabled={generating}
                className="w-full bg-slate-800 hover:bg-slate-900"
              >
                <Download className="w-4 h-4 mr-2" />
                {generating ? 'Generating...' : 'Export PDF'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card className="lg:col-span-2 border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Report Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900">{filteredLeaves.length}</div>
                  <div className="text-sm text-slate-600">Total Leaves</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {filteredLeaves.filter(l => l.status === 'approved').length}
                  </div>
                  <div className="text-sm text-green-600">Approved</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">
                    {filteredLeaves.filter(l => l.status === 'pending').length}
                  </div>
                  <div className="text-sm text-orange-600">Pending</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">
                    {filteredLeaves.filter(l => l.status === 'rejected').length}
                  </div>
                  <div className="text-sm text-red-600">Rejected</div>
                </div>
              </div>

              {/* Leave List Preview */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredLeaves.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>No leaves found for the selected filters</p>
                  </div>
                ) : (
                  filteredLeaves.slice(0, 10).map(leave => {
                    const employee = employees.find(e => e.id === leave.employee_id);
                    return (
                      <div key={leave.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-slate-900">{employee?.full_name || 'N/A'}</h4>
                            <p className="text-sm text-slate-600">{employee?.department || 'N/A'}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                            leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm text-slate-600">
                          <span>{leave.leave_type}</span>
                          <span>•</span>
                          <span>{format(new Date(leave.start_date), 'dd MMM')} - {format(new Date(leave.end_date), 'dd MMM')}</span>
                          <span>•</span>
                          <span>{leave.days_count} days</span>
                        </div>
                      </div>
                    );
                  })
                )}
                {filteredLeaves.length > 10 && (
                  <p className="text-center text-sm text-slate-500 pt-2">
                    Showing 10 of {filteredLeaves.length} leaves. Export PDF to see all.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
