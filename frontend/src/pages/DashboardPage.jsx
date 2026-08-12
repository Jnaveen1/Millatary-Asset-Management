import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Filter, RotateCcw, ArrowUpDown, ShieldCheck, AlertTriangle, Layers, X, PlusCircle, ArrowDownRight, ArrowUpRight 
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState({
    openingBalance: 0,
    purchases: 0,
    transfersIn: 0,
    transfersOut: 0,
    netMovement: 0,
    assigned: 0,
    expended: 0,
    closingBalance: 0,
  });

  const [inventory, setInventory] = useState([]);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // Filters state
  const [selectedBase, setSelectedBase] = useState(user?.role === 'BASE_COMMANDER' ? user.baseId || '' : '');
  const [selectedEquip, setSelectedEquip] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNetModal, setShowNetModal] = useState(false);

  // Fetch Dropdown options
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [bRes, eRes] = await Promise.all([
          api.get('/bases'),
          api.get('/equipment'),
        ]);
        setBases(bRes.data);
        setEquipmentTypes(eRes.data);
      } catch (err) {
        console.error('Failed to load filter dropdown options:', err);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch Dashboard metrics
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBase) params.baseId = selectedBase;
      if (selectedEquip) params.equipmentTypeId = selectedEquip;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/assets/dashboard', { params });
      setMetrics(res.data.metrics);
      setInventory(res.data.inventory);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch inventory dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedBase, selectedEquip, startDate, endDate]);

  const handleResetFilters = () => {
    setSelectedBase(user?.role === 'BASE_COMMANDER' ? user.baseId || '' : '');
    setSelectedEquip('');
    setStartDate('');
    setEndDate('');
  };

  // Recharts Chart Colors
  const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Aggregate inventory by category for Donut chart
  const categoryDataMap = inventory.reduce((acc, item) => {
    const cat = item.category || 'OTHER';
    acc[cat] = (acc[cat] || 0) + Number(item.current_balance);
    return acc;
  }, {});

  const categoryChartData = Object.keys(categoryDataMap).map((cat) => ({
    name: cat,
    value: categoryDataMap[cat],
  }));

  // Aggregate inventory by Base for Bar Chart
  const baseDataMap = inventory.reduce((acc, item) => {
    const bName = item.base_name || 'Unknown';
    acc[bName] = (acc[bName] || 0) + Number(item.current_balance);
    return acc;
  }, {});

  const baseChartData = Object.keys(baseDataMap).map((bName) => ({
    name: bName,
    balance: baseDataMap[bName],
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 uppercase">
            Operational Asset Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            REAL-TIME INVENTORY TRACKING & TRANSACTIONAL BALANCE CALCULATION
          </p>
        </div>

        {/* Filter Bar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Base Filter */}
          {user?.role !== 'BASE_COMMANDER' && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedBase}
                onChange={(e) => setSelectedBase(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900">All Bases</option>
                {bases.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Equipment Type Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedEquip}
              onChange={(e) => setSelectedEquip(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Equipment</option>
              {equipmentTypes.map((et) => (
                <option key={et.id} value={et.id} className="bg-slate-900">
                  {et.name} ({et.category})
                </option>
              ))}
            </select>
          </div>

          {/* Date Pickers */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            placeholder="End Date"
          />

          <button
            onClick={handleResetFilters}
            title="Reset Filters"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl px-3 py-1.5 text-xs border border-slate-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Opening Balance Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Opening Balance
            </span>
            <span className="text-xs font-mono text-slate-500">INIT</span>
          </div>
          <div className="mt-3 text-2xl font-extrabold font-mono text-slate-100">
            {metrics.openingBalance.toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Balance prior to filter period</p>
        </div>

        {/* 2. Net Movement Card (CLICKABLE FOR MODAL BREAKDOWN) */}
        <div 
          onClick={() => setShowNetModal(true)}
          className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-slate-900 p-5 shadow-lg shadow-emerald-950/30 cursor-pointer hover:border-emerald-400 transition group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              Net Movement
              <ArrowUpDown className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-125 transition" />
            </span>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              CLICK FOR DETAILS
            </span>
          </div>
          <div className={`mt-3 text-2xl font-extrabold font-mono ${metrics.netMovement >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.netMovement >= 0 ? `+${metrics.netMovement.toLocaleString()}` : metrics.netMovement.toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] text-emerald-400/80">Purchases + Transfers In - Transfers Out</p>
        </div>

        {/* 3. Assigned Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
              Assigned
            </span>
            <span className="text-xs font-mono text-slate-500">ISSUED</span>
          </div>
          <div className="mt-3 text-2xl font-extrabold font-mono text-amber-300">
            {metrics.assigned.toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Assets issued to personnel</p>
        </div>

        {/* 4. Expended Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400">
              Expended
            </span>
            <span className="text-xs font-mono text-slate-500">CONSUMED</span>
          </div>
          <div className="mt-3 text-2xl font-extrabold font-mono text-rose-400">
            {metrics.expended.toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Consumed ammo & destroyed assets</p>
        </div>

        {/* 5. Closing Balance Card */}
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 to-slate-900 p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              Closing Balance
            </span>
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3 text-2xl font-extrabold font-mono text-cyan-300">
            {metrics.closingBalance.toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] text-cyan-400/80">Calculated Current Inventory</p>
        </div>
      </div>

      {/* VISUAL CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Stock Levels by Base */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
          <h3 className="text-sm font-mono font-semibold text-slate-200 uppercase tracking-wider mb-4">
            Stock Inventory by Base Location
          </h3>
          <div className="h-64">
            {baseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={baseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                  />
                  <Bar dataKey="balance" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 font-mono text-xs">
                NO BASE STOCK DATA AVAILABLE
              </div>
            )}
          </div>
        </div>

        {/* Donut Chart: Asset Category Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-xl">
          <h3 className="text-sm font-mono font-semibold text-slate-200 uppercase tracking-wider mb-4">
            Asset Distribution by Equipment Category
          </h3>
          <div className="h-64">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                  />
                  <Legend tick={{ fill: '#94a3b8', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 font-mono text-xs">
                NO CATEGORY DATA AVAILABLE
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED INVENTORY STOCK TABLE */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono font-semibold text-slate-200 uppercase tracking-wider">
            Detailed Inventory Breakdown
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {inventory.length} Asset Items Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Base Location</th>
                <th className="py-3 px-4">Equipment Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Purchases</th>
                <th className="py-3 px-4 text-right">Transfers In</th>
                <th className="py-3 px-4 text-right">Transfers Out</th>
                <th className="py-3 px-4 text-right">Assigned</th>
                <th className="py-3 px-4 text-right">Expended</th>
                <th className="py-3 px-4 text-right font-bold text-slate-200">Current Balance</th>
                <th className="py-3 px-4 text-center">Stock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {inventory.map((item, idx) => {
                const bal = Number(item.current_balance);
                let statusBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    IN STOCK
                  </span>
                );
                if (bal <= 0) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      DEPLETED
                    </span>
                  );
                } else if (bal <= 20) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      LOW STOCK
                    </span>
                  );
                }

                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">{item.base_name}</td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-100">{item.equipment_name}</td>
                    <td className="py-3 px-4 text-slate-400">{item.category}</td>
                    <td className="py-3 px-4 text-right text-slate-300">+{item.purchases}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">+{item.transfers_in}</td>
                    <td className="py-3 px-4 text-right text-rose-400">-{item.transfers_out}</td>
                    <td className="py-3 px-4 text-right text-amber-300">-{item.assigned}</td>
                    <td className="py-3 px-4 text-right text-rose-300">-{item.expended}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                      {bal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">{statusBadge}</td>
                  </tr>
                );
              })}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan="10" className="py-8 text-center text-slate-500 font-mono text-xs">
                    No matching inventory records found for applied filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NET MOVEMENT BREAKDOWN MODAL */}
      {showNetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold uppercase tracking-wide text-slate-100 flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5 text-emerald-400" />
                Net Movement Breakdown
              </h3>
              <button
                onClick={() => setShowNetModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4 font-mono">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-emerald-400" />
                  Purchases
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  +{metrics.purchases.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-cyan-400" />
                  Transfers In
                </span>
                <span className="text-sm font-bold text-cyan-400">
                  +{metrics.transfersIn.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-rose-400" />
                  Transfers Out
                </span>
                <span className="text-sm font-bold text-rose-400">
                  -{metrics.transfersOut.toLocaleString()}
                </span>
              </div>

              <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Net Movement Calculation
                </span>
                <span className={`text-base font-extrabold ${metrics.netMovement >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {metrics.netMovement >= 0 ? `+${metrics.netMovement.toLocaleString()}` : metrics.netMovement.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowNetModal(false)}
                className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 font-semibold text-xs text-slate-200 border border-slate-700 transition"
              >
                CLOSE BREAKDOWN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
