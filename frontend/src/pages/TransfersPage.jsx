import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftRight, Send, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';

const TransfersPage = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // Form state
  const [sourceBaseId, setSourceBaseId] = useState(user?.role === 'BASE_COMMANDER' ? user.baseId || '' : '');
  const [destinationBaseId, setDestinationBaseId] = useState('');
  const [equipmentTypeId, setEquipmentTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [tRes, bRes, eRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/bases'),
        api.get('/equipment'),
      ]);
      setTransfers(tRes.data);
      setBases(bRes.data);
      setEquipmentTypes(eRes.data);

      if (bRes.data.length > 0) {
        if (!sourceBaseId) setSourceBaseId(bRes.data[0].id);
        if (bRes.data.length > 1) {
          const defaultDest = bRes.data.find(b => Number(b.id) !== Number(sourceBaseId || bRes.data[0].id));
          setDestinationBaseId(defaultDest ? defaultDest.id : bRes.data[1].id);
        }
      }
      if (eRes.data.length > 0 && !equipmentTypeId) {
        setEquipmentTypeId(eRes.data[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load transfer logs');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceBaseId || !destinationBaseId || !equipmentTypeId || !quantity) {
      setError('Source base, destination base, equipment type, and quantity are required.');
      return;
    }

    if (Number(sourceBaseId) === Number(destinationBaseId)) {
      setError('Source base and destination base cannot be the same location.');
      return;
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Transfer quantity must be a positive integer.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await api.post('/transfers', {
        sourceBaseId: Number(sourceBaseId),
        destinationBaseId: Number(destinationBaseId),
        equipmentTypeId: Number(equipmentTypeId),
        quantity: parsedQty,
        transferDate,
      });

      setSuccess('Atomic inter-base transfer executed successfully!');
      setQuantity('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 uppercase flex items-center gap-2.5">
          <ArrowLeftRight className="h-6 w-6 text-cyan-400" />
          Inter-Base Asset Transfers
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          ATOMIC CROSS-BASE ASSET MOVEMENT AND STOCK REALLOCATION
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

      {/* NEW TRANSFER FORM */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Send className="h-4 w-4 text-cyan-400" />
          Dispatch Inter-Base Transfer
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Source Base (Outflow)</label>
            <select
              value={sourceBaseId}
              onChange={(e) => setSourceBaseId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              required
            >
              {bases.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Destination Base (Inflow)</label>
            <select
              value={destinationBaseId}
              onChange={(e) => setDestinationBaseId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              required
            >
              {equipmentTypes.map((et) => (
                <option key={et.id} value={et.id}>{et.name} ({et.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Transfer Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 20"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Transfer Date</label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <div className="md:col-span-5 flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-2.5 font-semibold text-xs text-slate-950 shadow-lg shadow-cyan-950/50 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 transition"
            >
              {submitting ? 'Executing Atomic Transfer...' : 'DISPATCH ATOMIC TRANSFER'}
            </button>
          </div>
        </form>
      </div>

      {/* TRANSFERS HISTORY LOG TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider mb-4">
          Transfer Dispatch Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transfer ID</th>
                <th className="py-3 px-4">Source Base</th>
                <th className="py-3 px-4">Destination Base</th>
                <th className="py-3 px-4">Equipment Item</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Transfer Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Initiated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-500">#{t.id}</td>
                  <td className="py-3 px-4 font-sans font-medium text-rose-300 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-rose-400" />
                    {t.source_base_name}
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-emerald-300 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                    {t.destination_base_name}
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-100">{t.equipment_name}</td>
                  <td className="py-3 px-4 text-right font-bold text-cyan-400">{t.quantity}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(t.transfer_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{t.initiated_by_username}</td>
                </tr>
              ))}
              {transfers.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500 font-mono text-xs">
                    No transfer history records found.
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

export default TransfersPage;
