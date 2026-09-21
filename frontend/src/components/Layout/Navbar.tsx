import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, FileScan, History, Brain, BookOpen, Settings,
  LogOut, Menu, X, Shield, ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/scanner', label: 'Code Scanner', icon: FileScan },
  { path: '/history', label: 'Analysis History', icon: History },
  { path: '/models', label: 'Models', icon: Brain },
  { path: '/docs', label: 'Documentation', icon: BookOpen },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
        style={{
          background: 'rgba(10, 14, 39, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
        }}>
        <Link to="/" className="flex items-center gap-3 mr-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: '#00d4ff' }}>VulnGuard<span style={{ color: '#e2e8f0' }}>AI</span></span>
        </Link>

        <div className="hidden lg:flex items-center gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={isAuthenticated ? item.path : '/login'}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${active ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-4 ml-auto">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-400">{user?.username}</span>
              <button onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <Link to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)' }}>
              Sign In <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden ml-4 text-slate-400">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(10, 14, 39, 0.98)' }}>
          <div className="pt-20 px-6 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={isAuthenticated ? item.path : '/login'}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-white/5">
                  <Icon className="w-5 h-5" /> {item.label}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 mt-4">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-semibold mt-4"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)' }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
