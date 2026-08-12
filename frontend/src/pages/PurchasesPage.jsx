import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

const PurchasesPage = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // Form state
  const [baseId, setBaseId] = useState(user?.role === 'BASE_COMMANDER' ? user.baseId || '' : '');
  const [equipmentTypeId, setEquipmentTypeId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, bRes, eRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/bases'),
        api.get('/equipment'),
      ]);
      setPurchases(pRes.data);
      setBases(bRes.data);
      setEquipmentTypes(eRes.data);

      if (!baseId && bRes.data.length > 0) {
        setBaseId(bRes.data[0].id);
      }
      if (eRes.data.length > 0) {
        setEquipmentTypeId(eRes.data[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load purchases history');
    } finally {
      setLoading(false);
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
      setError('Quantity must be a positive number greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await api.post('/purchases', {
        baseId: Number(baseId),
        equipmentTypeId: Number(equipmentTypeId),
        quantity: parsedQty,
        purchaseDate,
      });

      setSuccess('Asset purchase logged successfully into system!');
      setQuantity('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 uppercase flex items-center gap-2.5">
          <ShoppingCart className="h-6 w-6 text-emerald-400" />
          Asset Procurement & Purchases
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          RECORD NEW ASSET PURCHASES AND INVENTORY SUPPLY INFLOWS
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

      {/* NEW PURCHASE FORM */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h2 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-emerald-400" />
          Record New Purchase Entry
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Target Base</label>
            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
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
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              required
            >
              {equipmentTypes.map((et) => (
                <option key={et.id} value={et.id}>{et.name} ({et.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Quantity Purchased</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold text-slate-400 mb-1.5">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="md:col-span-4 flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-2.5 font-semibold text-xs text-slate-950 shadow-lg shadow-emerald-950/50 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 transition"
            >
              {submitting ? 'Recording Purchase...' : 'CONFIRM PURCHASE ENTRY'}
            </button>
          </div>
        </form>
      </div>

      {/* PURCHASES HISTORY TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider mb-4">
          Procurement History Log
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Purchase ID</th>
                <th className="py-3 px-4">Base Location</th>
                <th className="py-3 px-4">Equipment Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Purchase Date</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-500">#{p.id}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-200">{p.base_name}</td>
                  <td className="py-3 px-4 font-sans font-medium text-slate-100">{p.equipment_name}</td>
                  <td className="py-3 px-4 text-slate-400">{p.category}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-400">+{p.quantity}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(p.purchase_date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-slate-400">{p.created_by_username}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 font-mono text-xs">
                    No purchase history records found.
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

export default PurchasesPage;
