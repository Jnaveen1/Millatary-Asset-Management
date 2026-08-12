import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, Filter, Eye, X } from 'lucide-react';

const AuditLogsPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const res = await api.get('/audit-logs', { params });
      setAuditLogs(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load system audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'PURCHASE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'TRANSFER':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'ASSIGNMENT':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'EXPENDITURE':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 uppercase flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-purple-400" />
            Central System Audit Trail
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            IMMUTABLE TRANSACTION AND ACCESS AUDIT RECORDS
          </p>
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">All Audit Actions</option>
            <option value="PURCHASE" className="bg-slate-900">PURCHASE</option>
            <option value="TRANSFER" className="bg-slate-900">TRANSFER</option>
            <option value="ASSIGNMENT" className="bg-slate-900">ASSIGNMENT</option>
            <option value="EXPENDITURE" className="bg-slate-900">EXPENDITURE</option>
          </select>
        </div>
      </div>

      {/* AUDIT LOGS TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">User Role</th>
                <th className="py-3 px-4">Base Location</th>
                <th className="py-3 px-4">Transaction Payload Details</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-500">#{log.id}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] border font-semibold ${getActionBadge(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-200">{log.username}</td>
                  <td className="py-3 px-4 text-slate-400">{log.role}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{log.base_name || 'Global System'}</td>
                  <td className="py-3 px-4 text-slate-300 truncate max-w-xs font-mono text-[11px]">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedLogDetails(log)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      title="Inspect JSON Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500 font-mono text-xs">
                    No matching audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON DETAILS INSPECTION MODAL */}
      {selectedLogDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-purple-500/40 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold uppercase tracking-wide text-slate-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                Audit Record #{selectedLogDetails.id} Details
              </h3>
              <button
                onClick={() => setSelectedLogDetails(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div><span className="text-slate-500">USER:</span> {selectedLogDetails.username} ({selectedLogDetails.role})</div>
                <div><span className="text-slate-500">ACTION:</span> {selectedLogDetails.action}</div>
                <div><span className="text-slate-500">BASE:</span> {selectedLogDetails.base_name || 'Global'}</div>
                <div><span className="text-slate-500">DATE:</span> {new Date(selectedLogDetails.created_at).toLocaleString()}</div>
              </div>

              <div className="mt-3">
                <label className="block text-slate-400 font-semibold mb-1">Structured JSON Payload:</label>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedLogDetails.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedLogDetails(null)}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 font-semibold text-xs text-slate-200 border border-slate-700 transition"
              >
                CLOSE INSPECTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
