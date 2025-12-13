import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, FileText, CheckSquare, User, LogOut, Menu, X, Settings, Bell, Network, ClipboardList } from 'lucide-react';
import { clearAuth, getAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { user } = getAuth();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'manager', 'employee'] },
    { name: 'Employees', href: '/employees', icon: Users, roles: ['admin', 'manager'] },
    { name: 'Hierarchy', href: '/hierarchy', icon: Network, roles: ['admin', 'manager'] },
    { name: 'My Leaves', href: '/leaves', icon: FileText, roles: ['admin', 'manager', 'employee'] },
    { name: 'All Leaves', href: '/all-leaves', icon: ClipboardList, roles: ['admin'] },
    { name: 'Approvals', href: '/approvals', icon: CheckSquare, roles: ['admin', 'manager'] },
    { name: 'Leave Policy', href: '/leave-policy', icon: FileText, roles: ['admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
    { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['admin'] },
    { name: 'Profile', href: '/profile', icon: User, roles: ['admin', 'manager', 'employee'] },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role)
  );

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-slate-200">
        <div className="flex items-center h-16 px-6 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            HRMS
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all
                  ${
                    active
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {currentUser?.full_name || user?.full_name}
              </p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            data-testid="logout-btn"
            variant="ghost"
            className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white">
            <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
              <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                HRMS
              </h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="px-4 py-6 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all
                      ${
                        active
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-900"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            HRMS
          </h1>
          <div className="w-6" />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;