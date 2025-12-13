import React, { useState, useEffect } from 'react';
import { Users, ChevronRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';

const HierarchyPage = () => {
  const [employees, setEmployees] = useState([]);
  const [hierarchy, setHierarchy] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      const emps = response.data;
      setEmployees(emps);
      buildHierarchy(emps);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      toast.error('Failed to load hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchy = (emps) => {
    // Group employees by department
    const deptMap = {};
    
    emps.forEach(emp => {
      if (!deptMap[emp.department]) {
        deptMap[emp.department] = {
          admins: [],
          managers: [],
          employees: []
        };
      }
      
      if (emp.role === 'admin') {
        deptMap[emp.department].admins.push(emp);
      } else if (emp.role === 'manager') {
        deptMap[emp.department].managers.push(emp);
      } else {
        deptMap[emp.department].employees.push(emp);
      }
    });
    
    setHierarchy(deptMap);
  };

  const getTeamMembers = (managerEmail) => {
    return employees.filter(emp => emp.manager_email === managerEmail);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500">Loading hierarchy...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Organization Hierarchy
        </h1>
        <p className="text-lg text-slate-600">View your company's organizational structure</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Employees</p>
            <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Admins</p>
            <p className="text-2xl font-bold text-blue-600">
              {employees.filter(e => e.role === 'admin').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Managers</p>
            <p className="text-2xl font-bold text-purple-600">
              {employees.filter(e => e.role === 'manager').length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Employees</p>
            <p className="text-2xl font-bold text-emerald-600">
              {employees.filter(e => e.role === 'employee').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy by Department */}
      <div className="space-y-6">
        {Object.keys(hierarchy).map((department) => (
          <Card key={department} className="border-slate-100 shadow-sm">
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <Building2 className="w-5 h-5" />
                {department}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Admins */}
                {hierarchy[department].admins.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Administrators
                    </h3>
                    <div className="space-y-2">
                      {hierarchy[department].admins.map((admin) => (
                        <div
                          key={admin.id}
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{admin.full_name}</p>
                            <p className="text-sm text-slate-600">{admin.designation}</p>
                          </div>
                          <Badge className="bg-blue-600 text-white">Admin</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Managers and their teams */}
                {hierarchy[department].managers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Managers & Teams
                    </h3>
                    <div className="space-y-4">
                      {hierarchy[department].managers.map((manager) => {
                        const teamMembers = getTeamMembers(manager.email);
                        return (
                          <div key={manager.id} className="border border-slate-200 rounded-lg overflow-hidden">
                            {/* Manager */}
                            <div className="flex items-center gap-3 p-4 bg-purple-50 border-b border-purple-100">
                              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-purple-700" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">{manager.full_name}</p>
                                <p className="text-sm text-slate-600">{manager.designation}</p>
                              </div>
                              <Badge className="bg-purple-600 text-white">Manager</Badge>
                              {teamMembers.length > 0 && (
                                <span className="text-sm text-slate-500">
                                  {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>

                            {/* Team Members */}
                            {teamMembers.length > 0 && (
                              <div className="p-4 bg-white">
                                <div className="space-y-2">
                                  {teamMembers.map((member) => (
                                    <div
                                      key={member.id}
                                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-medium text-slate-600">
                                          {member.full_name.charAt(0)}
                                        </span>
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium text-slate-900 text-sm">{member.full_name}</p>
                                        <p className="text-xs text-slate-600">{member.designation}</p>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {member.role}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Employees without managers */}
                {hierarchy[department].employees.filter(emp => !emp.manager_email).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Other Employees
                    </h3>
                    <div className="space-y-2">
                      {hierarchy[department].employees
                        .filter(emp => !emp.manager_email)
                        .map((employee) => (
                          <div
                            key={employee.id}
                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
                          >
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-slate-600">
                                {employee.full_name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{employee.full_name}</p>
                              <p className="text-sm text-slate-600">{employee.designation}</p>
                            </div>
                            <Badge variant="outline">{employee.role}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employees.length === 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardContent className="py-12">
            <div className="text-center text-slate-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg mb-2">No employees found</p>
              <p className="text-sm">Add employees to see the organization hierarchy</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HierarchyPage;
