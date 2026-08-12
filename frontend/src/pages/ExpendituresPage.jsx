import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Flame, AlertCircle, CheckCircle2 } from 'lucide-react';

const ExpendituresPage = () => {
  const { user } = useAuth();
  const [expenditures, setExpenditures] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // Form state
  const [baseId, setBaseId] = useState(user?.role === 'BASE_COMMANDER' ? user.baseId || '' : '');
  const [equipmentTypeId, setEquipmentTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [expenditureDate, setExpenditureDate] = useState(new Date().toISOString().split('T')[0]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [eRes, bRes, eqRes] = await Promise.all([
        api.get('/expenditures'),
        api.get('/bases'),
        api.get('/equipment'),
      ]);
      setExpenditures(eRes.data);
      setBases(bRes.data);
      setEquipmentTypes(eqRes.data);

      if (!baseId && bRes.data.length > 0) {
        setBaseId(bRes.data[0].id);
      }
      if (eqRes.data.length > 0 && !equipmentTypeId) {
        setEquipmentTypeId(eqRes.data[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load expenditure records');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!baseId || !equipmentTypeId || !quantity) {
      setError('Base, equipment type, and quantity are required.');
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
      await api.post('/expenditures', {
        baseId: Number(baseId),
        equipmentTypeId: Number(equipmentTypeId),
        quantity: parsedQty,
        reason,
        expenditureDate,
      });

      setSuccess('Asset expenditure / consumption recorded successfully!');
      setQuantity('');
      setReason('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record expenditure');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 uppercase flex items-center gap-2.5">
          <Flame className="h-6 w-6 text-rose-500" />
          Ammunition & Asset Expenditures
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          RECORD CONSUMED AMMUNITION AND DISPOSED OR DEMOLISHED ASSETS
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

      {/* NEW EXPENDITURE FORM */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Flame className="h-4 w-4 text-rose-400" />
          Log Asset Expenditure / Consumption
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Base Location</label>
            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
              required
            >
              {equipmentTypes.map((et) => (
                <option key={et.id} value={et.id}>{et.name} ({et.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Expended Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Reason / Operation</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Firing Range Drill"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Expenditure Date</label>
            <input
              type="date"
              value={expenditureDate}
              onChange={(e) => setExpenditureDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none"
              required
            />
          </div>

          <div className="md:col-span-5 flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-2.5 font-semibold text-xs text-slate-950 shadow-lg shadow-rose-950/50 hover:from-rose-500 hover:to-rose-400 disabled:opacity-50 transition"
            >
              {submitting ? 'Logging Expenditure...' : 'CONFIRM EXPENDITURE'}
            </button>
          </div>
        </form>
      </div>

      {/* EXPENDITURES HISTORY TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider mb-4">
          Expenditure & Consumption History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Expenditure ID</th>
                <th className="py-3 px-4">Base Location</th>
                <th className="py-3 px-4">Equipment Item</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Reason / Operation Details</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {expenditures.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-500">#{e.id}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-200">{e.base_name}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-100">{e.equipment_name}</td>
                  <td className="py-3 px-4 text-right font-bold text-rose-400">-{e.quantity}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans">{e.reason}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(e.expenditure_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-slate-400">{e.created_by_username}</td>
                </tr>
              ))}
              {expenditures.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 font-mono text-xs">
                    No expenditure records found.
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

export default ExpendituresPage;
