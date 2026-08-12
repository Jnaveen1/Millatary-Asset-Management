import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ArrowLeftRight, 
  UserCheck, 
  Flame, 
  FileText 
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'],
    },
    {
      name: 'Purchases',
      path: '/purchases',
      icon: ShoppingCart,
      roles: ['ADMIN', 'LOGISTICS_OFFICER'],
    },
    {
      name: 'Transfers',
      path: '/transfers',
      icon: ArrowLeftRight,
      roles: ['ADMIN', 'LOGISTICS_OFFICER'],
    },
    {
      name: 'Assignments',
      path: '/assignments',
      icon: UserCheck,
      roles: ['ADMIN', 'BASE_COMMANDER'],
    },
    {
      name: 'Expenditures',
      path: '/expenditures',
      icon: Flame,
      roles: ['ADMIN', 'BASE_COMMANDER'],
    },
    {
      name: 'Audit Logs',
      path: '/audit-logs',
      icon: FileText,
      roles: ['ADMIN', 'BASE_COMMANDER'],
    },
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 min-h-[calc(100vh-4rem)] flex flex-col p-4">
      <div className="mb-4 px-3 py-2">
        <p className="text-[11px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
          Tactical Modules
        </p>
      </div>

      <nav className="flex-1 space-y-1.5">
        {allowedNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-4 px-3">
        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800/80">
          <p className="text-[11px] font-mono text-slate-400">OPERATIONAL STATUS</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400 font-mono">ENCRYPTED ONLINE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
