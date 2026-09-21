import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Lock, Palette, Bell, Shield, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Settings() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState([true, true, false]);
  const [showChangePw, setShowChangePw] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleToggleNotif = (index: number) => {
    const updated = [...notifications];
    updated[index] = !updated[index];
    setNotifications(updated);
    toast.success(`${updated[index] ? 'Enabled' : 'Disabled'} notification`);
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    toast.info(darkMode ? 'Light mode coming soon — dark mode is optimized for security work' : 'Dark mode activated');
  };

  const handleEnable2FA = () => {
    setTwoFA(!twoFA);
    toast.success(twoFA ? 'Two-factor authentication disabled' : 'Two-factor authentication enabled (demo)');
  };

  const handleChangePassword = () => {
    if (!oldPw || !newPw) { toast.error('Please fill in both fields'); return; }
    if (newPw.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setSaving(true);
    setTimeout(() => {
      toast.success('Password changed successfully');
      setOldPw('');
      setNewPw('');
      setShowChangePw(false);
      setSaving(false);
    }, 800);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile */}
          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" /> Profile
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                <User className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-xs text-slate-500">Username</div>
                  <div className="text-sm text-white">{user?.username || 'Not set'}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                <Mail className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="text-sm text-white">{user?.email || 'Not set'}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                <Calendar className="w-5 h-5 text-slate-500" />
                <div>
                  <div className="text-xs text-slate-500">Member Since</div>
                  <div className="text-sm text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" /> Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                <div>
                  <div className="text-sm text-white">Two-Factor Authentication</div>
                  <div className="text-xs text-slate-500">{twoFA ? 'Currently enabled' : 'Add an extra layer of security'}</div>
                </div>
                <button onClick={handleEnable2FA}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={twoFA
                    ? { background: 'rgba(46, 213, 115, 0.15)', color: '#2ed573', border: '1px solid rgba(46, 213, 115, 0.3)' }
                    : { background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                  {twoFA ? 'Enabled' : 'Enable'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                <div>
                  <div className="text-sm text-white">Change Password</div>
                  <div className="text-xs text-slate-500">Update your password regularly</div>
                </div>
                <button onClick={() => setShowChangePw(!showChangePw)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {showChangePw ? 'Cancel' : 'Change'}
                </button>
              </div>

              {showChangePw && (
                <div className="p-4 rounded-lg space-y-3" style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.15)' }}>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Current Password</label>
                    <div className="relative">
                      <input type={showOldPw ? 'text' : 'password'} value={oldPw} onChange={e => setOldPw(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3 py-2 pr-10 rounded-lg text-sm text-white outline-none"
                        style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }} />
                      <button type="button" onClick={() => setShowOldPw(!showOldPw)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">New Password</label>
                    <div className="relative">
                      <input type={showNewPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3 py-2 pr-10 rounded-lg text-sm text-white outline-none"
                        style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }} />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={handleChangePassword} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)' }}>
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Password'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" /> Notifications
            </h3>
            <div className="space-y-3">
              {['Email notifications for scan results', 'Vulnerability alerts', 'Weekly security reports'].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                  <span className="text-sm text-white">{item}</span>
                  <button onClick={() => handleToggleNotif(i)}
                    className={`relative w-10 h-5 rounded-full cursor-pointer transition-all ${notifications[i] ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: notifications[i] ? '22px' : '2px' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-cyan-400" /> Appearance
            </h3>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">Dark Mode</div>
                  <div className="text-xs text-slate-500">{darkMode ? 'Currently active' : 'Switch to dark theme'}</div>
                </div>
                <button onClick={handleToggleDarkMode}
                  className={`relative w-10 h-5 rounded-full cursor-pointer transition-all ${darkMode ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: darkMode ? '22px' : '2px' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
