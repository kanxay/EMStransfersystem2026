import React from 'react';
import { UserSession } from '../types';
import { Activity, LogOut, PlusCircle, Shield, Building2, ListOrdered, FileSpreadsheet } from 'lucide-react';

interface NavbarProps {
  session: UserSession | null;
  currentView: 'form' | 'admin-dashboard' | 'admin-settings' | 'user-history';
  onNavigate: (view: 'form' | 'admin-dashboard' | 'admin-settings' | 'user-history') => void;
  onLogout: () => void;
  dbStatus: { isTurso: boolean; configured: boolean };
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  currentView,
  onNavigate,
  onLogout,
  dbStatus,
}) => {
  return (
    <header className="no-print sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm font-bold">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <button
            onClick={() => {
              if (session?.role === 'admin') onNavigate('admin-dashboard');
              else if (session?.role === 'user') onNavigate('user-history');
            }}
            className="text-left cursor-pointer focus:outline-hidden"
          >
            <div className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              EMSCPS <span className="font-normal text-slate-300 text-sm hidden sm:inline">| ລະບົບນຳສົ່ງຄົນເຈັບ</span>
            </div>
            <div className="text-[11px] text-teal-300 font-medium whitespace-nowrap leading-none hidden sm:block">
              ໂຮງໝໍແຂວງຈຳປາສັກ (Champasak Hospital)
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-4 text-xs sm:text-sm font-medium overflow-x-auto py-1">
          {session?.role === 'admin' && (
            <>
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentView === 'admin-dashboard'
                    ? 'bg-slate-800 text-teal-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => onNavigate('admin-settings')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentView === 'admin-settings'
                    ? 'bg-slate-800 text-teal-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>ຕັ້ງຄ່າໂຮງໝໍ (Settings)</span>
              </button>
            </>
          )}

          {session?.role === 'user' && (
            <>
              <button
                onClick={() => onNavigate('form')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentView === 'form'
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ ສ້າງໃບນຳສົ່ງໃໝ່</span>
              </button>
              <button
                onClick={() => onNavigate('user-history')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  currentView === 'user-history'
                    ? 'bg-slate-800 text-teal-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>ປະຫວັດການນຳສົ່ງ</span>
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: User Role & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {session ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:block text-right text-xs">
                <div className="text-white font-semibold flex items-center gap-1 justify-end">
                  {session.role === 'admin' ? (
                    <>
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>ຜູ້ດູແລລະບົບ (Admin)</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-3.5 h-3.5 text-teal-400" />
                      <span className="truncate max-w-[140px]">{session.hospitalName}</span>
                    </>
                  )}
                </div>
                <div className="text-slate-400 text-[10px]">
                  {dbStatus.isTurso ? 'Turso Cloud DB' : 'Local Offline DB'}
                </div>
              </div>

              <button
                onClick={onLogout}
                title="ອອກຈາກລະບົບ"
                className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-medium flex items-center gap-1 border border-slate-700 hover:border-rose-700"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ອອກຈາກລະບົບ</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
