import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, Send, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    setTimeout(() => {
      setSent(true);
      setLoading(false);
      toast.success('Reset link sent!');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)' }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ color: '#00d4ff' }}>VulnGuard<span style={{ color: '#e2e8f0' }}>AI</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-slate-400 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>
        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(17, 22, 56, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">Check Your Email</h2>
              <p className="text-sm text-slate-400 mb-6">
                We sent a password reset link to <strong className="text-white">{email}</strong>
              </p>
              <button onClick={() => { setSent(false); setEmail(''); }}
                className="text-sm text-cyan-400 hover:text-cyan-300">
                Try another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-5">
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
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)' }}>
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                  <><Send className="w-4 h-4" /> Send Reset Link</>}
              </button>
            </form>
          )}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
