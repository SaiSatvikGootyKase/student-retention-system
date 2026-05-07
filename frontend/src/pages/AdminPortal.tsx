import React from 'react';
import { LogOut, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AdminDashboard from './AdminDashboard';

export default function AdminPortal() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-brand-slate">
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-indigo/10 text-brand-indigo">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-navy">Admin portal</p>
            <p className="text-xs text-slate-500">
              {currentUser?.name ?? 'Admin'} · {currentUser?.email}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </header>
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <AdminDashboard adminUserId={currentUser?.userId ?? ''} />
      </main>
    </div>
  );
}
