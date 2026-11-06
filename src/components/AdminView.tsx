import React, { useState, useEffect, useMemo } from 'react';
import { Hospital, Referral, ReferralStatus } from '../types';
import {
  getHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
  getReferrals,
  updateReferral,
  seedChampasakHospitals
} from '../lib/turso';
import { exportReferralsToCSV, exportHospitalsToCSV } from '../utils/csv';
import {
  Activity,
  Building2,
  Calendar,
  Filter,
  Download,
  FileText,
  Edit2,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  Hospital as HospIcon,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  RefreshCw,
  X,
  Check
} from 'lucide-react';

interface AdminViewProps {
  initialTab?: 'dashboard' | 'settings';
  onViewSlip: (referral: Referral) => void;
  onEditReferral: (referral: Referral) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  initialTab = 'dashboard',
  onViewSlip,
  onEditReferral,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>(initialTab);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters for Dashboard
  const [search, setSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('table');

  // Status Change Modal
  const [statusModalRef, setStatusModalRef] = useState<Referral | null>(null);
  const [newStatus, setNewStatus] = useState<ReferralStatus>('ສົ່ງແລ້ວ');
  const [arrivedAt, setArrivedAt] = useState('');
  const [outcome, setOutcome] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Settings: Add / Edit Hospital Modal
  const [showHospModal, setShowHospModal] = useState(false);
  const [editingHosp, setEditingHosp] = useState<Hospital | null>(null);
  const [hospFormProvince, setHospFormProvince] = useState('ຈຳປາສັກ');
  const [hospFormName, setHospFormName] = useState('');
  const [hospFormPassword, setHospFormPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [hList, rList] = await Promise.all([
        getHospitals(),
        getReferrals(),
      ]);
      setHospitals(hList);
      setReferrals(rList);
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  // Filtered referrals
  const filteredReferrals = useMemo(() => {
    return referrals.filter(r => {
      if (selectedHospital !== 'all' && String(r.hospital_id) !== selectedHospital) return false;
      if (selectedProvince !== 'all' && (r.hospital_province || r.province) !== selectedProvince) return false;
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
      if (startDate && r.created_at.slice(0, 10) < startDate) return false;
      if (endDate && r.created_at.slice(0, 10) > endDate) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (r.id && r.id.toLowerCase().includes(q)) ||
          (r.patient_name && r.patient_name.toLowerCase().includes(q)) ||
          (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
          (r.hospital_name && r.hospital_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [referrals, selectedHospital, selectedProvince, selectedStatus, startDate, endDate, search]);

  // Unique provinces list
  const provincesList = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach(h => h.province && set.add(h.province));
    referrals.forEach(r => {
      if (r.hospital_province) set.add(r.hospital_province);
      if (r.province) set.add(r.province);
    });
    return Array.from(set);
  }, [hospitals, referrals]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = referrals.length;
    const byStatus: Record<string, number> = {
      'ສົ່ງແລ້ວ': 0,
      'ກຳລັງມາ': 0,
      'ຮອດແລ້ວ': 0,
      'ຮັບເຂົ້າຮັກສາ': 0,
      'ສົ່ງກັບ': 0,
    };
    const byHosp: Record<string, number> = {};
    const byDiag: Record<string, number> = {};
    const dailyTrend: Record<string, number> = {};

    referrals.forEach(r => {
      if (byStatus[r.status] !== undefined) {
        byStatus[r.status]++;
      } else {
        byStatus[r.status] = 1;
      }

      const hName = r.hospital_name || `ໂຮງໝໍ #${r.hospital_id}`;
      byHosp[hName] = (byHosp[hName] || 0) + 1;

      const dName = (r.diagnosis || 'ອື່ນໆ').trim();
      byDiag[dName] = (byDiag[dName] || 0) + 1;

      const dayKey = r.created_at ? r.created_at.slice(0, 10) : 'N/A';
      dailyTrend[dayKey] = (dailyTrend[dayKey] || 0) + 1;
    });

    const topDiagnoses = Object.entries(byDiag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topHospitals = Object.entries(byHosp)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Sort last 7-14 days for trend
    const sortedDays = Object.keys(dailyTrend).sort().slice(-10);
    const trendData = sortedDays.map(d => ({ date: d, count: dailyTrend[d] }));

    return {
      total,
      byStatus,
      topDiagnoses,
      topHospitals,
      trendData,
    };
  }, [referrals]);

  // Status Modal Handlers
  const openStatusModal = (r: Referral) => {
    setStatusModalRef(r);
    setNewStatus(r.status);
    setArrivedAt(r.arrived_at || new Date().toISOString().slice(0, 16).replace('T', ' '));
    setOutcome(r.outcome || '');
    setRecordedBy(r.recorded_by || 'ER Nurse');
  };

  const handleSaveStatus = async () => {
    if (!statusModalRef) return;
    try {
      setIsUpdatingStatus(true);
      await updateReferral(statusModalRef.id, {
        status: newStatus,
        arrived_at: newStatus === 'ຮອດແລ້ວ' || newStatus === 'ຮັບເຂົ້າຮັກສາ' ? arrivedAt : statusModalRef.arrived_at,
        outcome,
        recorded_by: recordedBy,
      });
      await loadAll();
      setStatusModalRef(null);
    } catch (e) {
      console.error(e);
      alert('ເກີດຂໍ້ຜິດພາດໃນການອັບເດດສະຖານະ');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Settings: Hospital Handlers
  const handleOpenAddHosp = () => {
    setEditingHosp(null);
    setHospFormProvince('ຈຳປາສັກ');
    setHospFormName('');
    setHospFormPassword('');
    setShowHospModal(true);
  };

  const handleOpenEditHosp = (h: Hospital) => {
    setEditingHosp(h);
    setHospFormProvince(h.province);
    setHospFormName(h.name);
    setHospFormPassword(h.password || '');
    setShowHospModal(true);
  };

  const handleSaveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospFormName.trim()) return;

    try {
      if (editingHosp) {
        await updateHospital(editingHosp.id, {
          province: hospFormProvince.trim(),
          name: hospFormName.trim(),
          password: hospFormPassword,
        });
      } else {
        await createHospital({
          province: hospFormProvince.trim(),
          name: hospFormName.trim(),
          password: hospFormPassword,
        });
      }
      setShowHospModal(false);
      await loadAll();
    } catch (err) {
      console.error(err);
      alert('ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນໂຮງໝໍ');
    }
  };

  const handleDeleteHospital = async (id: number, name: string) => {
    if (confirm(`ທ່ານຕ້ອງການລຶບ "${name}" ອອກຈາກລະບົບແທ້ບໍ່?`)) {
      try {
        await deleteHospital(id);
        await loadAll();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSeedChampasak = async () => {
    if (confirm('ທ່ານຕ້ອງການໂຫຼດລາຍຊື່ໂຮງໝໍເມືອງຈຳປາສັກ (10 ເມືອງ) ເຂົ້າສູ່ລະບົບອັດຕະໂນມັດແທ້ບໍ່?')) {
      try {
        setSeeding(true);
        await seedChampasakHospitals();
        await loadAll();
      } catch (e) {
        console.error(e);
      } finally {
        setSeeding(false);
      }
    }
  };

  const toggleShowPassword = (id: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusBadge = (status: ReferralStatus) => {
    switch (status) {
      case 'ສົ່ງແລ້ວ':
        return <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs font-medium">ສົ່ງແລ້ວ</span>;
      case 'ກຳລັງມາ':
        return <span className="text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-xs font-medium">ກຳລັງມາ</span>;
      case 'ຮອດແລ້ວ':
        return <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs font-medium">ຮອດແລ້ວ</span>;
      case 'ຮັບເຂົ້າຮັກສາ':
        return <span className="text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs font-medium">ຮັບເຂົ້າຮັກສາ</span>;
      case 'ສົ່ງກັບ':
        return <span className="text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-medium">ສົ່ງກັບ</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Workspace Header & Tabs Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>ສູນບັນຊາການນຳສົ່ງຄົນເຈັບ</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-normal">
              Admin Workspace
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            ໂຮງໝໍແຂວງຈຳປາສັກ (Champasak Provincial Hospital)
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Dashboard (ຕິດຕາມການນຳສົ່ງ)</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Setting (ຕັ້ງຄ່າໂຮງໝໍ)</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DASHBOARD */}
      {/* ============================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                ນຳສົ່ງທັງໝົດ
              </span>
              <div className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
                {stats.total}
              </div>
              <span className="text-[10px] text-slate-400">ລາຍການ</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
              <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wide">
                ສົ່ງແລ້ວ (ໃໝ່)
              </span>
              <div className="text-2xl font-bold tabular-nums text-amber-700 mt-1">
                {stats.byStatus['ສົ່ງແລ້ວ'] || 0}
              </div>
              <span className="text-[10px] text-amber-600/80">ລໍຖ້າອອກເດີນທາງ</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-sky-200 bg-sky-50/30 shadow-xs">
              <span className="text-[11px] font-medium text-sky-700 uppercase tracking-wide">
                ກຳລັງມາ (En Route)
              </span>
              <div className="text-2xl font-bold tabular-nums text-sky-700 mt-1">
                {stats.byStatus['ກຳລັງມາ'] || 0}
              </div>
              <span className="text-[10px] text-sky-600/80">ຢູ່ໃນລົດສຸກເສີນ</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
              <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wide">
                ຮອດແລ້ວ
              </span>
              <div className="text-2xl font-bold tabular-nums text-emerald-700 mt-1">
                {stats.byStatus['ຮອດແລ້ວ'] || 0}
              </div>
              <span className="text-[10px] text-emerald-600/80">ຮອດຫ້ອງ ER ແລ້ວ</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-teal-200 bg-teal-50/30 shadow-xs">
              <span className="text-[11px] font-medium text-teal-700 uppercase tracking-wide">
                ຮັບເຂົ້າຮັກສາ
              </span>
              <div className="text-2xl font-bold tabular-nums text-teal-700 mt-1">
                {stats.byStatus['ຮັບເຂົ້າຮັກສາ'] || 0}
              </div>
              <span className="text-[10px] text-teal-600/80">Admitted / ICU</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                ສົ່ງກັບ
              </span>
              <div className="text-2xl font-bold tabular-nums text-slate-700 mt-1">
                {stats.byStatus['ສົ່ງກັບ'] || 0}
              </div>
              <span className="text-[10px] text-slate-400">Refer Back</span>
            </div>
          </div>

          {/* Analytics Strip: Trend Graph + Diagnosis & Hospital breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Trend Chart (Daily Referrals) */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>ແນວໂນ້ມຈຳນວນນຳສົ່ງຕາມວັນ (Daily Trend)</span>
                </h3>
                <span className="text-xs text-slate-500">10 ວັນຫຼ້າສຸດ</span>
              </div>

              {stats.trendData.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  ຍັງບໍ່ທັນມີຂໍ້ມູນນຳສົ່ງໃນຊ່ວງເວລານີ້
                </div>
              ) : (
                <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-200">
                  {(() => {
                    const maxVal = Math.max(...stats.trendData.map(d => d.count), 1);
                    return stats.trendData.map(d => {
                      const heightPercent = Math.max((d.count / maxVal) * 100, 10);
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                          <span className="text-[10px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.count}
                          </span>
                          <div
                            className="w-full bg-teal-500 hover:bg-teal-600 rounded-t-sm transition-all"
                            style={{ height: `${heightPercent}%` }}
                            title={`${d.date}: ${d.count} ລາຍການ`}
                          />
                          <span className="text-[9px] text-slate-500 font-mono rotate-[-45deg] origin-top-left mt-2 whitespace-nowrap">
                            {d.date.slice(5)}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Top Diagnosis & Hospital Breakdown */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                  5 ອັນດັບ ການວິນິດໄສ (Top Diagnoses)
                </h3>
                {stats.topDiagnoses.length === 0 ? (
                  <p className="text-xs text-slate-400">ບໍ່ມີຂໍ້ມູນ</p>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    {stats.topDiagnoses.map(([diag, cnt]) => (
                      <div key={diag} className="flex justify-between items-center text-slate-700">
                        <span className="truncate max-w-[190px] font-medium" title={diag}>
                          {diag}
                        </span>
                        <span className="font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {cnt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                  ໂຮງໝໍຕົ້ນທາງທີ່ສົ່ງຫຼາຍສຸດ
                </h3>
                {stats.topHospitals.length === 0 ? (
                  <p className="text-xs text-slate-400">ບໍ່ມີຂໍ້ມູນ</p>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    {stats.topHospitals.map(([hosp, cnt]) => (
                      <div key={hosp} className="flex justify-between items-center text-slate-700">
                        <span className="truncate max-w-[190px]" title={hosp}>
                          {hosp}
                        </span>
                        <span className="font-mono font-semibold bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded text-[11px]">
                          {cnt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  ຕົວກອງຂໍ້ມູນ (Filters)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* View Switch: Table / Cards */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                  <button
                    onClick={() => setDisplayMode('table')}
                    title="ແບບຕາຕະລາງ"
                    className={`p-1.5 rounded-md ${displayMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDisplayMode('cards')}
                    title="ແບບກາດ (Cards)"
                    className={`p-1.5 rounded-md ${displayMode === 'cards' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                {/* Export CSV with UTF-8 BOM */}
                <button
                  onClick={() => exportReferralsToCSV(filteredReferrals)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV (Excel)</span>
                </button>

                <button
                  onClick={loadAll}
                  title="ໂຫຼດຂໍ້ມູນໃໝ່"
                  className="p-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາຊື່, ລະຫັດ, ພະຍາດ..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Hospital */}
              <select
                value={selectedHospital}
                onChange={e => setSelectedHospital(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">ທຸກໂຮງໝໍ ({hospitals.length})</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>

              {/* Status */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">ທຸກສະຖານະ</option>
                <option value="ສົ່ງແລ້ວ">ສົ່ງແລ້ວ</option>
                <option value="ກຳລັງມາ">ກຳລັງມາ</option>
                <option value="ຮອດແລ້ວ">ຮອດແລ້ວ</option>
                <option value="ຮັບເຂົ້າຮັກສາ">ຮັບເຂົ້າຮັກສາ</option>
                <option value="ສົ່ງກັບ">ສົ່ງກັບ</option>
              </select>

              {/* Date From */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500">ແຕ່:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              {/* Date To */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500">ຫາ:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>

          {/* Data List: Table View or Cards View */}
          {loading ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
              ກຳລັງໂຫຼດຂໍ້ມູນ...
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">ບໍ່ພົບລາຍການນຳສົ່ງທີ່ກົງກັບເງື່ອນໄຂ</p>
              <p className="text-xs text-slate-400 mt-1">ລອງປັບປ່ຽນຕົວກອງ ຫຼື ລ້າງຄຳຄົ້ນຫາ</p>
            </div>
          ) : displayMode === 'table' ? (
            /* Table View */
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-3 whitespace-nowrap">ລະຫັດ ID</th>
                      <th className="p-3 whitespace-nowrap">ວັນທີ-ເວລາ</th>
                      <th className="p-3 whitespace-nowrap">ໂຮງໝໍຕົ້ນທາງ</th>
                      <th className="p-3 whitespace-nowrap">ຊື່ຄົນເຈັບ</th>
                      <th className="p-3 whitespace-nowrap">ອາຍຸ/ເພດ</th>
                      <th className="p-3 whitespace-nowrap">Diagnosis</th>
                      <th className="p-3 whitespace-nowrap">GCS</th>
                      <th className="p-3 whitespace-nowrap">BP / SpO2</th>
                      <th className="p-3 whitespace-nowrap">ສະຖານະ</th>
                      <th className="p-3 whitespace-nowrap text-right">ຈັດການ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReferrals.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-teal-800 whitespace-nowrap">
                          {r.id}
                        </td>
                        <td className="p-3 text-slate-600 whitespace-nowrap tabular-nums">
                          {r.referral_time || r.created_at?.slice(0, 16)}
                        </td>
                        <td className="p-3 font-medium text-slate-900 whitespace-nowrap">
                          {r.hospital_name || `ໂຮງໝໍ #${r.hospital_id}`}
                        </td>
                        <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                          {r.patient_name}
                        </td>
                        <td className="p-3 text-slate-600 whitespace-nowrap">
                          {r.age} ປີ / {r.gender}
                        </td>
                        <td className="p-3 text-slate-800 max-w-[200px] truncate" title={r.diagnosis}>
                          {r.diagnosis}
                        </td>
                        <td className="p-3 font-mono font-bold text-teal-700 whitespace-nowrap">
                          {r.gcs_score || '-'}/15
                        </td>
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                          {r.bp || '-'} / {r.spo2 || '-'}%
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <button
                            onClick={() => openStatusModal(r)}
                            title="ຄລິກເພື່ອປ່ຽນສະຖານະ"
                            className="cursor-pointer hover:opacity-80"
                          >
                            {getStatusBadge(r.status)}
                          </button>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => onViewSlip(r)}
                            title="ເບິ່ງໃບນຳສົ່ງ / ພິມ / PDF"
                            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditReferral(r)}
                            title="ແກ້ໄຂຂໍ້ມູນ"
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReferrals.map(r => (
                <div
                  key={r.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-300 transition-all shadow-xs space-y-2.5"
                >
                  <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {r.id}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {r.referral_time || r.created_at?.slice(0, 16)}
                      </div>
                    </div>
                    <button
                      onClick={() => openStatusModal(r)}
                      title="ຄລິກເພື່ອປ່ຽນສະຖານະ"
                      className="cursor-pointer hover:opacity-80"
                    >
                      {getStatusBadge(r.status)}
                    </button>
                  </div>

                  <div>
                    <div className="text-xs text-teal-700 font-semibold truncate">
                      {r.hospital_name || `ໂຮງໝໍ #${r.hospital_id}`}
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {r.patient_name} <span className="text-xs font-normal text-slate-500">({r.age} ປີ, {r.gender})</span>
                    </div>
                    <div className="text-xs text-slate-700 line-clamp-1 mt-0.5">
                      <b>Diagnosis:</b> {r.diagnosis}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg grid grid-cols-3 gap-1 text-[11px] text-center font-mono border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[9px]">BP</span>
                      <span className="font-bold">{r.bp || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">SpO2</span>
                      <span className="font-bold">{r.spo2 || '-'}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">GCS</span>
                      <span className="font-bold text-teal-800">{r.gcs_score || '-'}/15</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openStatusModal(r)}
                      className="text-xs text-slate-600 hover:text-slate-900 underline"
                    >
                      ປ່ຽນສະຖານະ
                    </button>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onViewSlip(r)}
                        className="px-2.5 py-1 text-xs bg-teal-50 text-teal-800 rounded-lg hover:bg-teal-100 font-medium border border-teal-200"
                      >
                        ໃບນຳສົ່ງ PDF
                      </button>
                      <button
                        onClick={() => onEditReferral(r)}
                        className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: SETTINGS (ຕັ້ງຄ່າໂຮງໝໍ) */}
      {/* ============================================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <span>ຈັດການລາຍຊື່ໂຮງໝໍເມືອງ (District Hospitals)</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                ເພີ່ມ, ແກ້ໄຂ, ລຶບ ແລະ ຕັ້ງລະຫັດເຂົ້າລະບົບສຳລັບແຕ່ລະໂຮງໝໍເມືອງ
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hospitals.length === 0 && (
                <button
                  onClick={handleSeedChampasak}
                  disabled={seeding}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{seeding ? 'ກຳລັງໂຫຼດ...' : 'ໂຫຼດ 10 ເມືອງຕົວຢ່າງ'}</span>
                </button>
              )}

              <button
                onClick={() => exportHospitalsToCSV(hospitals)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV ສຳຮອງ</span>
              </button>

              <button
                onClick={handleOpenAddHosp}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ ເພີ່ມໂຮງໝໍເມືອງ</span>
              </button>
            </div>
          </div>

          {/* Hospitals Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3 w-16">ລຳດັບ</th>
                    <th className="p-3">ຊື່ແຂວງ</th>
                    <th className="p-3">ຊື່ໂຮງໝໍເມືອງ (ພາສາລາວ)</th>
                    <th className="p-3">ລະຫັດເຂົ້າລະບົບ (Password)</th>
                    <th className="p-3 text-right">ຈັດການ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hospitals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        ຍັງບໍ່ທັນມີຂໍ້ມູນໂຮງໝໍເມືອງໃນລະບົບ. ກົດປຸ່ມ "+ ເພີ່ມໂຮງໝໍເມືອງ" ເພື່ອເລີ່ມຕົ້ນ.
                      </td>
                    </tr>
                  ) : (
                    hospitals.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono text-slate-500 font-semibold">{h.id}</td>
                        <td className="p-3 font-medium text-slate-800">{h.province}</td>
                        <td className="p-3 font-bold text-slate-900">{h.name}</td>
                        <td className="p-3 font-mono">
                          <div className="flex items-center gap-2">
                            <span>
                              {showPasswords[h.id] ? h.password || '(ບໍ່ມີ)' : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(h.id)}
                              className="text-slate-400 hover:text-slate-700"
                              title={showPasswords[h.id] ? 'ເຊື່ອງລະຫັດ' : 'ສະແດງລະຫັດ'}
                            >
                              {showPasswords[h.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditHosp(h)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            title="ແກ້ໄຂ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteHospital(h.id, h.name)}
                            className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                            title="ລຶບ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STATUS CHANGE MODAL */}
      {/* ============================================================== */}
      {statusModalRef && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                ອັບເດດສະຖານະການນຳສົ່ງ: {statusModalRef.id}
              </h3>
              <button
                onClick={() => setStatusModalRef(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div><b>ຄົນເຈັບ:</b> {statusModalRef.patient_name}</div>
              <div><b>ໂຮງໝໍຕົ້ນທາງ:</b> {statusModalRef.hospital_name}</div>
              <div><b>Diagnosis:</b> {statusModalRef.diagnosis}</div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ສະຖານະການນຳສົ່ງ
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as ReferralStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="ສົ່ງແລ້ວ">ສົ່ງແລ້ວ (ຕົ້ນທາງສົ່ງອອກ)</option>
                  <option value="ກຳລັງມາ">ກຳລັງມາ (En Route)</option>
                  <option value="ຮອດແລ້ວ">ຮອດແລ້ວ (ຮອດ ER ໂຮງໝໍແຂວງ)</option>
                  <option value="ຮັບເຂົ້າຮັກສາ">ຮັບເຂົ້າຮັກສາ (Admitted / ICU / OR)</option>
                  <option value="ສົ່ງກັບ">ສົ່ງກັບ (Refer Back ໂຮງໝໍເມືອງ)</option>
                </select>
              </div>

              {(newStatus === 'ຮອດແລ້ວ' || newStatus === 'ຮັບເຂົ້າຮັກສາ') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ວັນທີ-ເວລາຮອດ ໂຮງໝໍແຂວງ
                  </label>
                  <input
                    type="text"
                    value={arrivedAt}
                    onChange={e => setArrivedAt(e.target.value)}
                    placeholder="2026-11-05 15:45"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຜົນສຸດທ້າຍ / ບັນທຶກເພີ່ມເຕີມ (Outcome)
                </label>
                <textarea
                  rows={2}
                  value={outcome}
                  onChange={e => setOutcome(e.target.value)}
                  placeholder="ເຊັ່ນ: ຮັບເຂົ້າຫ້ອງຜ່າຕັດດ່ວນ, ຮັບເຂົ້າ ICU, ອາການຄົງທີ່ດີ..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຜູ້ບັນທຶກ / ພະຍາບານ ER ໂຮງໝໍແຂວງ
                </label>
                <input
                  type="text"
                  value={recordedBy}
                  onChange={e => setRecordedBy(e.target.value)}
                  placeholder="ຊື່ຜູ້ຮັບ ແລະ ບັນທຶກ"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setStatusModalRef(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={isUpdatingStatus}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                {isUpdatingStatus ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກສະຖານະ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD / EDIT HOSPITAL MODAL */}
      {/* ============================================================== */}
      {showHospModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingHosp ? 'ແກ້ໄຂຂໍ້ມູນໂຮງໝໍເມືອງ' : 'ເພີ່ມໂຮງໝໍເມືອງໃໝ່'}
              </h3>
              <button
                onClick={() => setShowHospModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHospital} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ແຂວງ
                </label>
                <input
                  type="text"
                  required
                  value={hospFormProvince}
                  onChange={e => setHospFormProvince(e.target.value)}
                  placeholder="ຈຳປາສັກ"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ໂຮງໝໍເມືອງ (ພາສາລາວ)
                </label>
                <input
                  type="text"
                  required
                  value={hospFormName}
                  onChange={e => setHospFormName(e.target.value)}
                  placeholder="ເຊັ່ນ: ໂຮງໝໍເມືອງປາກຊ່ອງ"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ລະຫັດເຂົ້າລະບົບ (Password ບໍ່ຕ້ອງເຂົ້າລະຫັດ)
                </label>
                <input
                  type="text"
                  required
                  value={hospFormPassword}
                  onChange={e => setHospFormPassword(e.target.value)}
                  placeholder="ລະຫັດຜ່ານສຳລັບໂຮງໝໍນີ້ເຂົ້າລະບົບ"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * ເກັບເປັນຂໍ້ຄວາມທຳມະດາຕາມຂໍ້ກຳນົດ ເພື່ອໃຫ້ Admin ກວດເບິ່ງ ແລະ ແຈ້ງໂຮງໝໍເມືອງໄດ້ງ່າຍ
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHospModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ຍົກເລີກ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  ບັນທຶກ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
