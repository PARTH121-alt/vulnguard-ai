import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Shield, Bell, Lock, Palette } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
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

          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" /> Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                <div>
                  <div className="text-sm text-white">Two-Factor Authentication</div>
                  <div className="text-xs text-slate-500">Add an extra layer of security</div>
                </div>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400"
                  style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)' }}>
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                <div>
                  <div className="text-sm text-white">Change Password</div>
                  <div className="text-xs text-slate-500">Update your password regularly</div>
                </div>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  Change
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-400" /> Notifications
            </h3>
            <div className="space-y-3">
              {['Email notifications for scan results', 'Vulnerability alerts', 'Weekly security reports'].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
                  <span className="text-sm text-white">{item}</span>
                  <div className={`relative w-10 h-5 rounded-full cursor-pointer transition-all ${i < 2 ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all`}
                      style={{ left: i < 2 ? '22px' : '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-6"
            style={{ background: 'rgba(17, 22, 56, 0.7)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-cyan-400" /> Appearance
            </h3>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(10, 14, 39, 0.5)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white">Dark Mode</div>
                  <div className="text-xs text-slate-500">Currently active (cybersecurity theme)</div>
                </div>
                <div className="relative w-10 h-5 rounded-full bg-cyan-500 cursor-pointer">
                  <div className="absolute top-0.5 left-5.5 w-4 h-4 rounded-full bg-white" style={{ left: '22px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
