import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, User, Building2 } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'BASE_COMMANDER':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOGISTICS_OFFICER':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-950/50">
          <Shield className="h-6 w-6 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wide text-slate-100 uppercase">
            Military Asset Management
          </h1>
          <p className="text-[10px] font-mono text-emerald-400 tracking-wider">SECURE TACTICAL LOGISTICS V1.0</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user?.baseName && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-mono">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span>{user.baseName}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wider font-mono ${getRoleBadgeColor(user?.role)}`}>
            {user?.role}
          </span>
        </div>

        <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden md:inline font-mono text-sm font-medium text-slate-200">
            {user?.username}
          </span>

          <button
            onClick={logout}
            title="Sign Out"
            className="ml-2 flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
