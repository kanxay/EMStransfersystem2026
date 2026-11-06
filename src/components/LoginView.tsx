import React, { useState, useEffect } from 'react';
import { Hospital, UserSession } from '../types';
import { getHospitals, seedChampasakHospitals } from '../lib/turso';
import { Activity, Shield, Building2, KeyRound, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

// Admin passcode configurable as a constant
export const ADMIN_PASSCODE = 'admin2026';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
  dbStatus: { isTurso: boolean; configured: boolean; error: string | null };
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, dbStatus }) => {
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      const list = await getHospitals();
      setHospitals(list);
      if (list.length > 0 && !selectedHospitalId) {
        setSelectedHospitalId(String(list[0].id));
      }
    } catch (e) {
      console.error('Failed to load hospitals for login', e);
    }
  };

  const handleSeedHospitals = async () => {
    try {
      setSeeding(true);
      await seedChampasakHospitals();
      await loadHospitals();
    } catch (e) {
      console.error('Failed to seed hospitals', e);
    } finally {
      setSeeding(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (role === 'admin') {
      if (password === ADMIN_PASSCODE) {
        const session: UserSession = { role: 'admin' };
        localStorage.setItem('emscps_user_session', JSON.stringify(session));
        onLoginSuccess(session);
      } else {
        setErrorMsg('ລະຫັດຜ່ານ Admin ບໍ່ຖືກຕ້ອງ (ຄ່າເລີ່ມຕົ້ນ: admin2026)');
      }
    } else {
      if (!selectedHospitalId) {
        setErrorMsg('ກະລຸນາເລືອກໂຮງໝໍ');
        return;
      }
      const hosp = hospitals.find(h => String(h.id) === selectedHospitalId);
      if (!hosp) {
        setErrorMsg('ບໍ່ພົບຂໍ້ມູນໂຮງໝໍ');
        return;
      }

      // Check hospital password (plain text as required)
      if (hosp.password && hosp.password !== password) {
        setErrorMsg('ລະຫັດຜ່ານຂອງໂຮງໝໍບໍ່ຖືກຕ້ອງ');
        return;
      }

      const session: UserSession = {
        role: 'user',
        hospitalId: hosp.id,
        hospitalName: hosp.name,
        hospitalProvince: hosp.province,
      };
      localStorage.setItem('emscps_user_session', JSON.stringify(session));
      onLoginSuccess(session);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* App Title & Crest */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3">
            <Activity className="w-9 h-9" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            EMSCPS - ລະບົບນຳສົ່ງຄົນເຈັບ
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            ໂຮງໝໍແຂວງຈຳປາສັກ (Champasak Provincial Hospital)
          </p>

          {/* Database Connection Status Banner */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className={`w-2 h-2 rounded-full ${dbStatus.isTurso ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>
              {dbStatus.isTurso
                ? 'ເຊື່ອມຕໍ່ຖານຂໍ້ມູນ Turso Cloud ສຳເລັດ'
                : 'ໃຊ້ງານໃນໂໝດຖານຂໍ້ມູນ Local Storage'}
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                ປະເພດຜູ້ໃຊ້ງານ (User Role)
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setRole('user');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    role === 'user'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>ໂຮງໝໍເມືອງ (User)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('admin');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    role === 'admin'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>ຜູ້ດູແລລະບົບ (Admin)</span>
                </button>
              </div>
            </div>

            {/* User Login: Hospital Dropdown */}
            {role === 'user' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ເລືອກໂຮງໝໍເມືອງ
                </label>
                {hospitals.length > 0 ? (
                  <select
                    value={selectedHospitalId}
                    onChange={e => setSelectedHospitalId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} - ແຂວງ{h.province}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                    <p>
                      ຍັງບໍ່ທັນມີລາຍຊື່ໂຮງໝໍເມືອງໃນລະບົບ. ທ່ານສາມາດເຂົ້າສູ່ລະບົບດ້ວຍ <b>Admin</b> ເພື່ອເພີ່ມໃນໜ້າ Settings ຫຼື ຄລິກປຸ່ມລຸ່ມນີ້ເພື່ອໂຫຼດລາຍຊື່ຕົວຢ່າງ:
                    </p>
                    <button
                      type="button"
                      onClick={handleSeedHospitals}
                      disabled={seeding}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{seeding ? 'ກຳລັງໂຫຼດ...' : 'ໂຫຼດໂຮງໝໍເມືອງຕົວຢ່າງ (10 ເມືອງ)'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {role === 'admin' ? 'ລະຫັດຜ່ານ Admin' : 'ລະຫັດຜ່ານໂຮງໝໍ'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={role === 'admin' ? 'ໃສ່ລະຫັດ admin (ເຊັ່ນ: admin2026)' : 'ໃສ່ລະຫັດຜ່ານໂຮງໝໍ'}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  required
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              {role === 'admin' && (
                <p className="mt-1 text-[11px] text-slate-500">
                  * ລະຫັດເລີ່ມຕົ້ນແມ່ນ: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">admin2026</code>
                </p>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <span>ເຂົ້າສູ່ລະບົບ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-500">
          ລະບົບນຳສົ່ງຄົນເຈັບສຸກເສີນ EMSCPS © {new Date().getFullYear()} ໂຮງໝໍແຂວງຈຳປາສັກ
        </div>
      </div>
    </div>
  );
};
