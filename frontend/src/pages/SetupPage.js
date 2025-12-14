import React, { useState } from 'react';
import { CheckCircle, Database, User, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import api from '@/lib/api';

const SetupPage = ({ onSetupComplete }) => {
  const [step, setStep] = useState(1);
  const [testing, setTesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);

  // Database configuration
  const [dbConfig, setDbConfig] = useState({
    mongo_url: '',
    db_name: 'hrms_production',
    pem_certificate: ''
  });

  // Admin configuration
  const [adminConfig, setAdminConfig] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [testResult, setTestResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDbConfig({ ...dbConfig, pem_certificate: event.target.result });
        toast.success('PEM certificate uploaded successfully');
      };
      reader.readAsText(file);
    }
  };

  const testConnection = async () => {
    if (!dbConfig.mongo_url) {
      toast.error('Please enter MongoDB URL');
      return;
    }

    if (!dbConfig.db_name) {
      toast.error('Please enter database name');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await api.post('/setup/test-connection', dbConfig);
      
      if (response.data.success) {
        setTestResult({ success: true, message: response.data.message });
        setConnectionTested(true);
        toast.success('Database connection successful!');
      } else {
        // Check if error is about URL encoding
        const errorMsg = response.data.message || '';
        if (errorMsg.includes('RFC 3986') || errorMsg.includes('quote_plus')) {
          setTestResult({ 
            success: false, 
            message: 'Special characters detected in username or password. Please URL-encode your credentials. Common: @ → %40, # → %23, $ → %24, % → %25'
          });
        } else {
          setTestResult({ success: false, message: errorMsg });
        }
        setConnectionTested(false);
        toast.error('Connection failed');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Connection test failed';
      
      // Check if error is about URL encoding
      if (errorMsg.includes('RFC 3986') || errorMsg.includes('quote_plus') || errorMsg.includes('escaped')) {
        setTestResult({ 
          success: false, 
          message: '❌ Special characters in password must be URL-encoded!\n\nExamples:\n  @ → %40\n  # → %23\n  $ → %24\n  % → %25\n\nUse an online URL encoder or Python\'s urllib.parse.quote_plus()'
        });
      } else {
        setTestResult({ success: false, message: errorMsg });
      }
      setConnectionTested(false);
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!connectionTested) {
        toast.error('Please test the database connection first');
        return;
      }
      setStep(2);
    }
  };

  const handleSetup = async () => {
    // Validate admin configuration
    if (!adminConfig.name || !adminConfig.email || !adminConfig.password) {
      toast.error('Please fill in all admin details');
      return;
    }

    if (adminConfig.password !== adminConfig.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (adminConfig.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/setup/configure', {
        db_config: dbConfig,
        admin_config: {
          name: adminConfig.name,
          email: adminConfig.email,
          password: adminConfig.password
        }
      });

      if (response.data.success) {
        toast.success('Setup completed successfully!');
        setTimeout(() => {
          onSetupComplete();
        }, 2000);
      } else {
        toast.error(response.data.message || 'Setup failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Setup failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            HRMS Setup Wizard
          </h1>
          <p className="text-gray-600">Configure your Human Resource Management System</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              {step > 1 ? <CheckCircle className="w-6 h-6" /> : <Database className="w-5 h-5" />}
            </div>
            <span className="ml-2 font-medium">Database</span>
          </div>
          
          <div className={`w-16 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="ml-2 font-medium">Admin Account</span>
          </div>
        </div>

        {/* Step 1: Database Configuration */}
        {step === 1 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Configuration
              </CardTitle>
              <CardDescription>
                Configure your MongoDB database connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mongo_url">MongoDB Connection URL *</Label>
                <Input
                  id="mongo_url"
                  placeholder="mongodb+srv://username:password@cluster.mongodb.net"
                  value={dbConfig.mongo_url}
                  onChange={(e) => setDbConfig({ ...dbConfig, mongo_url: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: mongodb+srv://user:pass@cluster.mongodb.net/?appName=hrms
                </p>
              </div>

              <div>
                <Label htmlFor="db_name">Database Name *</Label>
                <Input
                  id="db_name"
                  placeholder="hrms_production"
                  value={dbConfig.db_name}
                  onChange={(e) => setDbConfig({ ...dbConfig, db_name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pem_cert">PEM Certificate (Optional)</Label>
                <div className="mt-1">
                  <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                    <span className="flex items-center space-x-2">
                      <Upload className="w-6 h-6 text-gray-600" />
                      <span className="font-medium text-gray-600">
                        {dbConfig.pem_certificate ? 'Certificate Uploaded ✓' : 'Drop PEM file or click to upload'}
                      </span>
                    </span>
                    <input
                      id="pem_cert"
                      type="file"
                      accept=".pem"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Upload if your MongoDB requires SSL certificate authentication
                </p>
              </div>

              {testResult && (
                <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <AlertCircle className={`w-4 h-4 ${testResult.success ? 'text-green-600' : 'text-red-600'}`} />
                  <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={testConnection}
                  disabled={testing}
                  variant="outline"
                  className="flex-1"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleNextStep}
                  disabled={!connectionTested}
                  className="flex-1"
                >
                  Next: Admin Account →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Admin Account */}
        {step === 2 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Create Admin Account
              </CardTitle>
              <CardDescription>
                Set up the administrator account for your HRMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="admin_name">Full Name *</Label>
                <Input
                  id="admin_name"
                  placeholder="John Doe"
                  value={adminConfig.name}
                  onChange={(e) => setAdminConfig({ ...adminConfig, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="admin_email">Email Address *</Label>
                <Input
                  id="admin_email"
                  type="email"
                  placeholder="admin@company.com"
                  value={adminConfig.email}
                  onChange={(e) => setAdminConfig({ ...adminConfig, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="admin_password">Password *</Label>
                <Input
                  id="admin_password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={adminConfig.password}
                  onChange={(e) => setAdminConfig({ ...adminConfig, password: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Re-enter password"
                  value={adminConfig.confirmPassword}
                  onChange={(e) => setAdminConfig({ ...adminConfig, confirmPassword: e.target.value })}
                  className="mt-1"
                />
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  This account will have full administrative access to the HRMS. 
                  Keep these credentials secure!
                </AlertDescription>
              </Alert>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  ← Back
                </Button>
                
                <Button
                  onClick={handleSetup}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SetupPage;
