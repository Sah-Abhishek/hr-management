import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import '@/App.css';
import { isAuthenticated } from '@/lib/auth';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EmployeesPage from '@/pages/EmployeesPage';
import LeavesPage from '@/pages/LeavesPage';
import ApprovalsPage from '@/pages/ApprovalsPage';
import ProfilePage from '@/pages/ProfilePage';
import LeavePolicyPage from '@/pages/LeavePolicyPage';
import SettingsPage from '@/pages/SettingsPage';
import NotificationSettingsPage from '@/pages/NotificationSettingsPage';
import HierarchyPage from '@/pages/HierarchyPage';
import AllLeavesPage from '@/pages/AllLeavesPage';
import LeaveBalancePage from '@/pages/LeaveBalancePage';
import CompOffPage from '@/pages/CompOffPage';
import OrganizationsPage from '@/pages/OrganizationsPage';
import ReportsPage from '@/pages/ReportsPage';
import PayrollPage from '@/pages/PayrollPage';
import Layout from '@/components/Layout';

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="leaves" element={<LeavesPage />} />
            <Route path="all-leaves" element={<AllLeavesPage />} />
            <Route path="leave-balance" element={<LeaveBalancePage />} />
            <Route path="comp-off" element={<CompOffPage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="leave-policy" element={<LeavePolicyPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationSettingsPage />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="hierarchy" element={<HierarchyPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
