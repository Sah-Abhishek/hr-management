import React, { useState, useEffect } from 'react';
import { Mail, MessageCircle, Save, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import api from '@/lib/api';

const NotificationSettingsPage = () => {
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const [emailConfig, setEmailConfig] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: 'HRMS System',
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    api_key: '',
    phone_number_id: '',
    business_account_id: '',
  });

  useEffect(() => {
    // Load settings from backend
    const loadSettings = async () => {
      try {
        const response = await api.get('/notification-settings');
        const settings = response.data;
        
        setEmailEnabled(settings.email_enabled || false);
        setWhatsappEnabled(settings.whatsapp_enabled || false);
        
        if (settings.smtp_host) {
          setEmailConfig({
            smtp_host: settings.smtp_host || '',
            smtp_port: String(settings.smtp_port || 587),
            smtp_username: settings.smtp_username || '',
            smtp_password: settings.smtp_password || '',
            from_email: settings.from_email || '',
            from_name: settings.from_name || 'HRMS System',
          });
        }
        
        if (settings.twilio_account_sid) {
          setWhatsappConfig({
            api_key: settings.twilio_account_sid || '',
            phone_number_id: settings.twilio_phone_number || '',
            business_account_id: settings.business_account_id || '',
          });
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const handleSaveEmail = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (emailEnabled) {
        if (!emailConfig.smtp_host || !emailConfig.smtp_username || !emailConfig.smtp_password || !emailConfig.from_email) {
          toast.error('Please fill all required SMTP fields');
          setSaving(false);
          return;
        }
      }

      // Save to backend
      const settings = {
        email_enabled: emailEnabled,
        whatsapp_enabled: whatsappEnabled,
        smtp_host: emailConfig.smtp_host,
        smtp_port: parseInt(emailConfig.smtp_port),
        smtp_username: emailConfig.smtp_username,
        smtp_password: emailConfig.smtp_password,
        from_email: emailConfig.from_email,
        from_name: emailConfig.from_name,
        twilio_account_sid: whatsappConfig.api_key,
        twilio_auth_token: whatsappConfig.api_key,
        twilio_phone_number: whatsappConfig.phone_number_id
      };

      await api.post('/notification-settings', settings);
      toast.success('Email settings saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsApp = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate required fields
      if (whatsappEnabled) {
        if (!whatsappConfig.api_key || !whatsappConfig.phone_number_id) {
          toast.error('Please fill all required WhatsApp fields');
          setSaving(false);
          return;
        }
      }

      // Save to backend
      const settings = {
        email_enabled: emailEnabled,
        whatsapp_enabled: whatsappEnabled,
        smtp_host: emailConfig.smtp_host,
        smtp_port: parseInt(emailConfig.smtp_port),
        smtp_username: emailConfig.smtp_username,
        smtp_password: emailConfig.smtp_password,
        from_email: emailConfig.from_email,
        from_name: emailConfig.from_name,
        twilio_account_sid: whatsappConfig.api_key,
        twilio_auth_token: whatsappConfig.api_key,
        twilio_phone_number: whatsappConfig.phone_number_id
      };

      await api.post('/notification-settings', settings);
      toast.success('WhatsApp settings saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save WhatsApp settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Notification Settings
        </h1>
        <p className="text-lg text-slate-600">Configure email and WhatsApp notifications for leave applications</p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email (SMTP)
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        {/* Email Configuration */}
        <TabsContent value="email">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  <Mail className="w-6 h-6" />
                  Email Notifications
                </span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="email-toggle" className="text-sm text-slate-600">Enable</Label>
                  <Switch
                    id="email-toggle"
                    checked={emailEnabled}
                    onCheckedChange={setEmailEnabled}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveEmail} className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>When enabled:</strong> Automatic emails will be sent when employees apply for leave and when managers/admins approve or reject leaves.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp-host">SMTP Host *</Label>
                    <Input
                      id="smtp-host"
                      placeholder="smtp.gmail.com"
                      value={emailConfig.smtp_host}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                      disabled={!emailEnabled}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">Gmail: smtp.gmail.com | Mailjet: in-v3.mailjet.com | Office365: smtp.office365.com</p>
                  </div>
                  <div>
                    <Label htmlFor="smtp-port">SMTP Port *</Label>
                    <Input
                      id="smtp-port"
                      placeholder="587"
                      value={emailConfig.smtp_port}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: e.target.value })}
                      disabled={!emailEnabled}
                      className="mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">Usually 587 for TLS or 465 for SSL</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="smtp-username">SMTP Username / API Key *</Label>
                  <Input
                    id="smtp-username"
                    type="text"
                    placeholder="your-email@gmail.com or API key"
                    value={emailConfig.smtp_username}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtp_username: e.target.value })}
                    disabled={!emailEnabled}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">For Mailjet: Use API Key here</p>
                </div>

                <div>
                  <Label htmlFor="smtp-password">SMTP Password / Secret Key *</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    placeholder="••••••••••••••••"
                    value={emailConfig.smtp_password}
                    onChange={(e) => setEmailConfig({ ...emailConfig, smtp_password: e.target.value })}
                    disabled={!emailEnabled}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">Gmail: App Password | Mailjet: Secret Key</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from-email">From Email *</Label>
                    <Input
                      id="from-email"
                      type="email"
                      placeholder="noreply@company.com"
                      value={emailConfig.from_email}
                      onChange={(e) => setEmailConfig({ ...emailConfig, from_email: e.target.value })}
                      disabled={!emailEnabled}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
                      placeholder="HRMS System"
                      value={emailConfig.from_name}
                      onChange={(e) => setEmailConfig({ ...emailConfig, from_name: e.target.value })}
                      disabled={!emailEnabled}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Button
                    type="submit"
                    className="w-full bg-slate-800 hover:bg-slate-900 rounded-full"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Email Settings'}
                  </Button>
                </div>
              </form>

              {/* Setup Guides */}
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Gmail Setup:</h4>
                  <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                    <li>Go to Google Account → Security → 2-Step Verification</li>
                    <li>Scroll to "App passwords" and create one</li>
                    <li>Host: smtp.gmail.com | Port: 587 | Username: Your Gmail</li>
                  </ol>
                </div>
                
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h4 className="font-semibold text-emerald-900 mb-2">Mailjet Setup:</h4>
                  <ol className="text-sm text-emerald-800 space-y-1 list-decimal list-inside">
                    <li>Sign up at mailjet.com and verify your sender email</li>
                    <li>Go to Account Settings → SMTP & Send API Settings</li>
                    <li>Host: in-v3.mailjet.com | Port: 587</li>
                    <li>Username: Your API Key | Password: Your Secret Key</li>
                    <li>From Email: Your verified sender email</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Configuration */}
        <TabsContent value="whatsapp">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  <MessageCircle className="w-6 h-6" />
                  WhatsApp Notifications
                </span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="whatsapp-toggle" className="text-sm text-slate-600">Enable</Label>
                  <Switch
                    id="whatsapp-toggle"
                    checked={whatsappEnabled}
                    onCheckedChange={setWhatsappEnabled}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveWhatsApp} className="space-y-4">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-900">
                    <strong>When enabled:</strong> WhatsApp messages will be sent to managers and employees for leave applications and approvals.
                  </p>
                </div>

                <div>
                  <Label htmlFor="whatsapp-api-key">WhatsApp API Key *</Label>
                  <Input
                    id="whatsapp-api-key"
                    type="password"
                    placeholder="Enter your WhatsApp Business API key"
                    value={whatsappConfig.api_key}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_key: e.target.value })}
                    disabled={!whatsappEnabled}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone-number-id">Phone Number ID *</Label>
                  <Input
                    id="phone-number-id"
                    placeholder="Your WhatsApp Business phone number ID"
                    value={whatsappConfig.phone_number_id}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phone_number_id: e.target.value })}
                    disabled={!whatsappEnabled}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="business-account-id">Business Account ID (Optional)</Label>
                  <Input
                    id="business-account-id"
                    placeholder="Your WhatsApp Business account ID"
                    value={whatsappConfig.business_account_id}
                    onChange={(e) => setWhatsappConfig({ ...whatsappConfig, business_account_id: e.target.value })}
                    disabled={!whatsappEnabled}
                    className="mt-1"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <Button
                    type="submit"
                    className="w-full bg-slate-800 hover:bg-slate-900 rounded-full"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save WhatsApp Settings'}
                  </Button>
                </div>
              </form>

              {/* WhatsApp Setup Guide */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2">WhatsApp Business API Setup:</h4>
                <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                  <li>Sign up for WhatsApp Business Platform at <a href="https://business.whatsapp.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">business.whatsapp.com</a></li>
                  <li>Create a Business Account and get verified</li>
                  <li>Get your Phone Number ID from the dashboard</li>
                  <li>Generate an API key with messaging permissions</li>
                  <li>Enter the credentials above</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Events */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            <Bell className="w-6 h-6" />
            Notification Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-900">When employee applies for leave</span>
              <span className="text-sm text-emerald-600 font-medium">→ Notify Manager</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-900">When manager approves leave</span>
              <span className="text-sm text-emerald-600 font-medium">→ Notify Admin & Employee</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-900">When admin approves leave (final)</span>
              <span className="text-sm text-emerald-600 font-medium">→ Notify Employee</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-900">When leave is rejected</span>
              <span className="text-sm text-emerald-600 font-medium">→ Notify Employee</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettingsPage;
