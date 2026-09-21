import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
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
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white outline-none"
                style={{ background: 'rgba(10, 14, 39, 0.8)', border: '1px solid rgba(0, 212, 255, 0.2)' }} />
            </div>
            <button className="w-full py-3 rounded-lg font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0088ff)' }}>
              Send Reset Link
            </button>
          </div>
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
