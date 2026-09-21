import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Register() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await signup(username, email, password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)' }} />
      </div>
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)' }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ color: '#00d4ff' }}>VulnGuard<span style={{ color: '#e2e8f0' }}>AI</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 text-sm mt-1">Join VulnGuard AI for secure code analysis</p>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(17, 22, 56, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white outline-none"
                  style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white outline-none"
                  style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm text-white outline-none"
                  style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white outline-none"
                  style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)' }}>
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                <><UserPlus className="w-4 h-4" /> Create Account</>}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
