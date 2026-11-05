import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  const setPreset = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-400 mb-4 shadow-xl backdrop-blur-md">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            DEPA Consent Manager
          </h1>
          <p className="text-sm text-indigo-200/80 mt-1">
            Data Principal Governance & Electronic Consent Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Authenticate to access role-specific consent governance dashboards.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address or Student ID
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. S1001 or student1001@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Presets Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center space-x-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Quick Test Credentials
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPreset('student1001@example.com', 'Password@123')}
                className="p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-emerald-800 flex items-center justify-between">
                  <span>Student (S1001)</span>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[11px] text-emerald-600 truncate">Ashok Mugada</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset('superadmin@depa.cm', 'SuperAdmin@123')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-purple-800 flex items-center justify-between">
                  <span>Super Admin</span>
                  <KeyRound className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-[11px] text-purple-600">Full CM Governance</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset('admin@collegea.edu', 'OrgAdmin@123')}
                className="p-2.5 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-blue-800">College A Admin</div>
                <div className="text-[11px] text-blue-600">Provider Org Scope</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset('admin@collegeb.edu', 'OrgAdmin@123')}
                className="p-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-amber-800">College B Admin</div>
                <div className="text-[11px] text-amber-600">Consumer Org Scope</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-indigo-200/60 mt-6">
          DEPA Architecture: Real-time RS256 Consent Tokens &amp; End-to-End P2P Encryption
        </p>
      </div>
    </div>
  );
}

