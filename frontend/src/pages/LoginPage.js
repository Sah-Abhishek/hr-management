import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { setAuth, isAuthenticated } from '@/lib/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'employee',
    department: '',
    designation: '',
    phone: '',
    manager_email: '',
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', loginForm);
      const { access_token, user } = response.data;
      setAuth(access_token, user);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      let errorMessage = 'Login failed';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map(err => err.msg || err).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', registerForm);
      const { access_token, user } = response.data;
      setAuth(access_token, user);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      let errorMessage = 'Registration failed';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        // Handle array of validation errors (FastAPI format)
        if (Array.isArray(detail)) {
          const errors = detail.map(err => {
            if (typeof err === 'object' && err.msg) {
              return `${err.loc ? err.loc[err.loc.length - 1] : 'Field'}: ${err.msg}`;
            }
            return String(err);
          });
          errorMessage = errors.join('; ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (typeof detail === 'object') {
          errorMessage = JSON.stringify(detail);
        }
      }
      
      toast.error(errorMessage);
      console.error('Registration error:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1
              className="text-4xl font-bold text-slate-900 mb-2"
              style={{ fontFamily: 'Plus Jakarta Sans' }}
            >
              Welcome to HRMS
            </h1>
            <p className="text-lg text-slate-600">Employee Leave Management System</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        data-testid="login-email-input"
                        type="email"
                        placeholder="john@example.com"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, email: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        data-testid="login-password-input"
                        type="password"
                        placeholder="••••••••"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm({ ...loginForm, password: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="submit"
                      data-testid="login-submit-btn"
                      className="w-full bg-slate-800 hover:bg-slate-900 rounded-full"
                      disabled={loading}
                    >
                      {loading ? 'Logging in...' : 'Login'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleRegister} className="space-y-4" noValidate>
                    <div>
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input
                        id="reg-name"
                        data-testid="register-name-input"
                        type="text"
                        placeholder="John Doe"
                        value={registerForm.full_name}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, full_name: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        data-testid="register-email-input"
                        type="email"
                        placeholder="john@example.com"
                        value={registerForm.email}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, email: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        data-testid="register-password-input"
                        type="password"
                        placeholder="••••••••"
                        value={registerForm.password}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, password: e.target.value })
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reg-department">Department</Label>
                        <Input
                          id="reg-department"
                          data-testid="register-department-input"
                          type="text"
                          placeholder="Engineering"
                          value={registerForm.department}
                          onChange={(e) =>
                            setRegisterForm({ ...registerForm, department: e.target.value })
                          }
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reg-designation">Designation</Label>
                        <Input
                          id="reg-designation"
                          data-testid="register-designation-input"
                          type="text"
                          placeholder="Developer"
                          value={registerForm.designation}
                          onChange={(e) =>
                            setRegisterForm({ ...registerForm, designation: e.target.value })
                          }
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reg-role">Role</Label>
                      <Select
                        value={registerForm.role}
                        onValueChange={(value) =>
                          setRegisterForm({ ...registerForm, role: value })
                        }
                      >
                        <SelectTrigger data-testid="register-role-select" className="mt-1">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="reg-phone">Phone (Optional)</Label>
                      <Input
                        id="reg-phone"
                        data-testid="register-phone-input"
                        type="tel"
                        placeholder="+1234567890"
                        value={registerForm.phone}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, phone: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-manager">Manager Email (Optional)</Label>
                      <Input
                        id="reg-manager"
                        data-testid="register-manager-input"
                        type="email"
                        placeholder="manager@example.com"
                        value={registerForm.manager_email}
                        onChange={(e) =>
                          setRegisterForm({ ...registerForm, manager_email: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="submit"
                      data-testid="register-submit-btn"
                      className="w-full bg-slate-800 hover:bg-slate-900 rounded-full"
                      disabled={loading}
                    >
                      {loading ? 'Registering...' : 'Register'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:flex-1 relative">
        <img
          src="https://images.unsplash.com/photo-1733471754436-a7b293256c43?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwYWJzdHJhY3QlMjBvZmZpY2UlMjBhcmNoaXRlY3R1cmUlMjBicmlnaHR8ZW58MHx8fHwxNzY1NjU3NjY2fDA&ixlib=rb-4.1.0&q=85"
          alt="Office"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/20" />
      </div>
    </div>
  );
};

export default LoginPage;