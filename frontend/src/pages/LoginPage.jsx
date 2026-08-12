import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, User, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoUser = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070a11] px-4 py-12">
      {/* Subtle grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      <div className="relative w-full max-w-md">
        {/* Card Header Shield Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl shadow-emerald-950/60 border border-emerald-400/30">
            <Shield className="h-9 w-9 text-slate-950 stroke-[2.5]" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-100 uppercase">
            Military Asset Management
          </h2>
          <p className="mt-1 font-mono text-xs text-emerald-400 tracking-widest">COMMAND & LOGISTICS PORTAL</p>
        </div>

        {/* Login Form Container */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter personnel username"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 font-semibold text-sm text-slate-950 shadow-lg shadow-emerald-950/50 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.99] disabled:opacity-50 transition duration-150"
            >
              {submitting ? 'Authenticating...' : 'AUTHENTICATE SYSTEM ACCESS'}
            </button>
          </form>

          {/* Quick Fill Demo Credentials */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <p className="text-center font-mono text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Quick Fill Demo Roles
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoUser('admin', 'Password123!')}
                className="flex flex-col items-center rounded-lg border border-purple-500/20 bg-purple-500/10 p-2 text-center text-xs hover:bg-purple-500/20 transition"
              >
                <span className="font-semibold text-purple-300">ADMIN</span>
                <span className="text-[9px] font-mono text-purple-400/80">Global</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoUser('commander_alpha', 'Password123!')}
                className="flex flex-col items-center rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-center text-xs hover:bg-amber-500/20 transition"
              >
                <span className="font-semibold text-amber-300">COMMANDER</span>
                <span className="text-[9px] font-mono text-amber-400/80">Fort Alpha</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoUser('logistics_officer', 'Password123!')}
                className="flex flex-col items-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-center text-xs hover:bg-cyan-500/20 transition"
              >
                <span className="font-semibold text-cyan-300">LOGISTICS</span>
                <span className="text-[9px] font-mono text-cyan-400/80">Officer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
