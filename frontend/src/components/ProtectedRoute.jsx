import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-emerald-500">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-4 font-mono text-sm uppercase tracking-widest text-slate-400">Authenticating System Clearance...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <ShieldAlert className="h-16 w-16 text-rose-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold text-slate-100">ACCESS RESTRICTED (HTTP 403)</h1>
        <p className="mt-2 text-slate-400 max-w-md">
          Your account role (<span className="text-emerald-400 font-mono">{user?.role}</span>) does not possess military clearance for this module.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition"
        >
          Return to Permitted View
        </button>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
