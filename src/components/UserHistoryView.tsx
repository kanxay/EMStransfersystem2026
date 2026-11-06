import React, { useState, useEffect } from 'react';
import { Referral, UserSession, ReferralStatus } from '../types';
import { getReferrals } from '../lib/turso';
import {
  PlusCircle,
  Search,
  FileText,
  Edit3,
  Calendar,
  Clock,
  User,
  Activity,
  Printer,
  ChevronRight,
  Filter
} from 'lucide-react';

interface UserHistoryViewProps {
  session: UserSession;
  onNewReferral: () => void;
  onEditReferral: (referral: Referral) => void;
  onViewSlip: (referral: Referral) => void;
}

export const UserHistoryView: React.FC<UserHistoryViewProps> = ({
  session,
  onNewReferral,
  onEditReferral,
  onViewSlip,
}) => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [session.hospitalId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await getReferrals({
        hospitalId: session.hospitalId,
      });
      setReferrals(list);
    } catch (e) {
      console.error('Failed to load user referrals', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = referrals.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.patient_name && r.patient_name.toLowerCase().includes(q)) ||
        (r.diagnosis && r.diagnosis.toLowerCase().includes(q))
      );
    }
    return true;
  });

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
        return <span className="text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            ລາຍການນຳສົ່ງຄົນເຈັບ
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {session.hospitalName} - ແຂວງ{session.hospitalProvince || 'ຈຳປາສັກ'} (ທັງໝົດ {referrals.length} ລາຍການ)
          </p>
        </div>

        <button
          onClick={onNewReferral}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ ສ້າງໃບນຳສົ່ງໃໝ່</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder="ຄົ້ນຫາຕາມລະຫັດ, ຊື່ຄົນເຈັບ, ການວິນິດໄສ..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-600 font-medium">ສະຖານະ:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">ທຸກສະຖານະ ({referrals.length})</option>
            <option value="ສົ່ງແລ້ວ">ສົ່ງແລ້ວ</option>
            <option value="ກຳລັງມາ">ກຳລັງມາ</option>
            <option value="ຮອດແລ້ວ">ຮອດແລ້ວ</option>
            <option value="ຮັບເຂົ້າຮັກສາ">ຮັບເຂົ້າຮັກສາ</option>
            <option value="ສົ່ງກັບ">ສົ່ງກັບ</option>
          </select>
        </div>
      </div>

      {/* List / Cards */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
          ກຳລັງໂຫຼດຂໍ້ມູນ...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">ບໍ່ພົບລາຍການນຳສົ່ງ</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all'
              ? 'ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບເງື່ອນໄຂການຄົ້ນຫາ'
              : 'ທ່ານຍັງບໍ່ທັນໄດ້ສ້າງໃບນຳສົ່ງຄົນເຈັບເທື່ອ'}
          </p>
          {!search && statusFilter === 'all' && (
            <button
              onClick={onNewReferral}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ສ້າງໃບນຳສົ່ງທຳອິດ</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => (
            <div
              key={r.id}
              className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-teal-300 transition-all shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {r.id}
                    </span>
                    {getStatusBadge(r.status)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{r.referral_time || r.created_at?.slice(0, 16)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onViewSlip(r)}
                    title="ເບິ່ງໃບນຳສົ່ງ / ພິມ / ດາວໂຫຼດ PDF"
                    className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200 text-xs font-medium flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">ໃບນຳສົ່ງ PDF</span>
                  </button>
                  <button
                    onClick={() => onEditReferral(r)}
                    title="ແກ້ໄຂຂໍ້ມູນ"
                    className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 text-xs"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Patient info & diagnosis */}
              <div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{r.patient_name}</span>
                  <span className="text-slate-500 text-xs font-normal">
                    ({r.age} ປີ, {r.gender})
                  </span>
                </div>
                <div className="mt-1 text-xs">
                  <span className="font-semibold text-slate-700">Diagnosis: </span>
                  <span className="text-slate-900 font-medium">{r.diagnosis}</span>
                </div>
              </div>

              {/* Vitals summary */}
              <div className="bg-slate-50 p-2.5 rounded-lg text-xs grid grid-cols-4 gap-2 border border-slate-100">
                <div>
                  <span className="text-slate-500 block text-[10px]">BP:</span>
                  <span className="font-bold font-mono">{r.bp || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PR:</span>
                  <span className="font-bold font-mono">{r.pulse_rate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">SpO2:</span>
                  <span className="font-bold font-mono">{r.spo2 || '-'}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">GCS Score:</span>
                  <span className="font-bold font-mono text-teal-800">{r.gcs_score || '-'}/15</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-100">
                <span>ເຫດຜົນ: {r.referral_reason}</span>
                <span className="text-teal-700 font-medium">➔ ໂຮງໝໍແຂວງຈຳປາສັກ</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
