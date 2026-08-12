import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navigation/Navbar';
import Sidebar from './components/Navigation/Sidebar';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PurchasesPage from './pages/PurchasesPage';
import TransfersPage from './pages/TransfersPage';
import AssignmentsPage from './pages/AssignmentsPage';
import ExpendituresPage from './pages/ExpendituresPage';
import AuditLogsPage from './pages/AuditLogsPage';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OFFICER']} />}>
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER']} />}>
              <Route path="/assignments" element={<AssignmentsPage />} />
              <Route path="/expenditures" element={<ExpendituresPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
            </Route>
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Dashboard Layout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<DashboardLayout />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
