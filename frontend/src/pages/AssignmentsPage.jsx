import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { UserCheck, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

const AssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // Form state
  const [baseId, setBaseId] = useState(user?.role === 'BASE_COMMANDER' ? user.baseId || '' : '');
  const [equipmentTypeId, setEquipmentTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [assignmentDate, setAssignmentDate] = useState(new Date().toISOString().split('T')[0]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [aRes, bRes, eRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/bases'),
        api.get('/equipment'),
      ]);
      setAssignments(aRes.data);
      setBases(bRes.data);
      setEquipmentTypes(eRes.data);

      if (!baseId && bRes.data.length > 0) {
        setBaseId(bRes.data[0].id);
      }
      if (eRes.data.length > 0 && !equipmentTypeId) {
        setEquipmentTypeId(eRes.data[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load assignments');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!baseId || !equipmentTypeId || !quantity || !assignedTo) {
      setError('Base, equipment type, quantity, and assignee unit/personnel are required.');
      return;
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Quantity must be a positive integer.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await api.post('/assignments', {
        baseId: Number(baseId),
        equipmentTypeId: Number(equipmentTypeId),
        quantity: parsedQty,
        assignedTo,
        assignmentDate,
      });

      setSuccess('Asset assignment logged successfully!');
      setQuantity('');
      setAssignedTo('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 uppercase flex items-center gap-2.5">
          <UserCheck className="h-6 w-6 text-amber-400" />
          Personnel & Platoon Asset Assignments
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          TRACK ASSETS ISSUED TO ACTIVE MILITARY UNITS AND INDIVIDUAL PERSONNEL
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* NEW ASSIGNMENT FORM */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-amber-400" />
          Issue Asset Assignment
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Base Location</label>
            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              required
            >
              {bases.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Equipment Item</label>
            <select
              value={equipmentTypeId}
              onChange={(e) => setEquipmentTypeId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              required
            >
              {equipmentTypes.map((et) => (
                <option key={et.id} value={et.id}>{et.name} ({et.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Quantity Assigned</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 15"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Assigned To (Unit/Name)</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="e.g. Recon Squad Alpha"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Assignment Date</label>
            <input
              type="date"
              value={assignmentDate}
              onChange={(e) => setAssignmentDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="md:col-span-5 flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-2.5 font-semibold text-xs text-slate-950 shadow-lg shadow-amber-950/50 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 transition"
            >
              {submitting ? 'Issuing Assignment...' : 'CONFIRM ASSET ASSIGNMENT'}
            </button>
          </div>
        </form>
      </div>

      {/* ASSIGNMENTS HISTORY TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider mb-4">
          Active Assignments Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Assignment ID</th>
                <th className="py-3 px-4">Base Location</th>
                <th className="py-3 px-4">Equipment Item</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Assigned To (Unit / Officer)</th>
                <th className="py-3 px-4">Assignment Date</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-500">#{a.id}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-200">{a.base_name}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-100">{a.equipment_name}</td>
                  <td className="py-3 px-4 text-right font-bold text-amber-300">-{a.quantity}</td>
                  <td className="py-3 px-4 text-slate-200 font-sans">{a.assigned_to}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(a.assignment_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-slate-400">{a.created_by_username}</td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 font-mono text-xs">
                    No assignment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;
