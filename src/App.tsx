import React, { useState, useEffect } from 'react';
import { UserSession, Referral } from './types';
import { initDatabase, getDatabaseStatus } from './lib/turso';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { ReferralFormView } from './components/ReferralFormView';
import { AdminView } from './components/AdminView';
import { UserHistoryView } from './components/UserHistoryView';
import { ReferralSlipModal } from './components/ReferralSlipModal';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentView, setCurrentView] = useState<'form' | 'admin-dashboard' | 'admin-settings' | 'user-history'>('user-history');
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [activeSlipReferral, setActiveSlipReferral] = useState<Referral | null>(null);
  const [dbStatus, setDbStatus] = useState<{ isTurso: boolean; configured: boolean; error: string | null }>({
    isTurso: false,
    configured: false,
    error: null,
  });

  useEffect(() => {
    // 1. Initialize database connection
    initDatabase().then(() => {
      setDbStatus(getDatabaseStatus());
    });

    // 2. Restore user session from localStorage if exists
    try {
      const savedSession = localStorage.getItem('emscps_user_session');
      if (savedSession) {
        const parsed: UserSession = JSON.parse(savedSession);
        setSession(parsed);
        if (parsed.role === 'admin') {
          setCurrentView('admin-dashboard');
        } else {
          setCurrentView('user-history');
        }
      }
    } catch (e) {
      console.error('Failed to restore session', e);
    }
  }, []);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    if (newSession.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('form');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('emscps_user_session');
    setSession(null);
    setEditingReferral(null);
    setActiveSlipReferral(null);
  };

  const handleFormSuccess = (savedReferral: Referral) => {
    setEditingReferral(null);
    // Show official referral slip modal immediately
    setActiveSlipReferral(savedReferral);
    if (session?.role === 'user') {
      setCurrentView('user-history');
    } else {
      setCurrentView('admin-dashboard');
    }
  };

  const handleEditReferral = (ref: Referral) => {
    setEditingReferral(ref);
    setCurrentView('form');
  };

  const handleViewSlip = (ref: Referral) => {
    setActiveSlipReferral(ref);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans">
      <Navbar
        session={session}
        currentView={currentView}
        onNavigate={view => {
          setEditingReferral(null);
          setCurrentView(view);
        }}
        onLogout={handleLogout}
        dbStatus={dbStatus}
      />

      <main className="flex-1 pb-12">
        {!session ? (
          <LoginView onLoginSuccess={handleLoginSuccess} dbStatus={dbStatus} />
        ) : session.role === 'admin' ? (
          <AdminView
            initialTab={currentView === 'admin-settings' ? 'settings' : 'dashboard'}
            onViewSlip={handleViewSlip}
            onEditReferral={handleEditReferral}
          />
        ) : (
          <>
            {currentView === 'form' && (
              <ReferralFormView
                session={session}
                editingReferral={editingReferral}
                onSuccess={handleFormSuccess}
                onCancel={() => {
                  setEditingReferral(null);
                  setCurrentView('user-history');
                }}
              />
            )}
            {currentView === 'user-history' && (
              <UserHistoryView
                session={session}
                onNewReferral={() => {
                  setEditingReferral(null);
                  setCurrentView('form');
                }}
                onEditReferral={handleEditReferral}
                onViewSlip={handleViewSlip}
              />
            )}
          </>
        )}
      </main>

      {/* Official Referral Slip Modal */}
      <ReferralSlipModal
        referral={activeSlipReferral}
        isOpen={Boolean(activeSlipReferral)}
        onClose={() => setActiveSlipReferral(null)}
      />

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>EMSCPS - ລະບົບນຳສົ່ງຄົນເຈັບ ໂຮງໝໍແຂວງຈຳປາສັກ (Champasak Hospital)</span>
          <span className="text-slate-400">
            Build for Cloudflare Pages · Static Client · LibSQL / Turso
          </span>
        </div>
      </footer>
    </div>
  );
}
