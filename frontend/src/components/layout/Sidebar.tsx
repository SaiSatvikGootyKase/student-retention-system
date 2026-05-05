import React, { useEffect, useState } from 'react';
import { AlertTriangle, LogOut } from 'lucide-react';
import { getStudentMlInsights } from '../../api';
import type { StudentMlInsightsDto } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { getStudentIdForMlApi } from '../../utils/studentContext';
import {
  facultyNavItems,
  filterNavBySearch,
  studentNavItems,
  type DashboardNavItem,
} from '../../config/dashboardNav';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  searchQuery: string;
}

const Sidebar = ({ activePage, onNavigate, searchQuery }: SidebarProps) => {
  const { currentUser, logout } = useAuth();
  const isFaculty = currentUser?.role === 'FACULTY';
  const studentRecordId = getStudentIdForMlApi(currentUser ?? null);
  const [mlInsights, setMlInsights] = useState<StudentMlInsightsDto | null>(null);
  const [mlInsightsLoaded, setMlInsightsLoaded] = useState(false);

  useEffect(() => {
    if (isFaculty || !studentRecordId) {
      setMlInsightsLoaded(true);
      return;
    }
    let cancelled = false;
    setMlInsightsLoaded(false);
    getStudentMlInsights(studentRecordId)
      .then((d) => {
        if (!cancelled) setMlInsights(d);
      })
      .catch(() => {
        if (!cancelled) setMlInsights(null);
      })
      .finally(() => {
        if (!cancelled) setMlInsightsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isFaculty, studentRecordId]);

  const navItems: DashboardNavItem[] = isFaculty ? facultyNavItems : studentNavItems;
  const filtered = filterNavBySearch(navItems, searchQuery);
  const q = searchQuery.trim();
  const toShow: DashboardNavItem[] =
    !q ? navItems : filtered.length > 0 ? filtered : navItems.filter(i => i.id === 'home');
  const showNoMatchHint = Boolean(q && filtered.length === 0);

  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <aside className="w-64 bg-brand-navy text-white flex flex-col h-screen fixed top-0 left-0 border-r border-slate-800 z-20 shadow-xl shadow-black/20">
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 transition-all duration-200 ease-out hover:bg-white/10">
          <div className="w-9 h-9 rounded-full bg-brand-indigo flex items-center justify-center text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{currentUser?.name || 'User'}</p>
            <p className="text-xs text-slate-400 capitalize">{isFaculty ? 'Faculty' : 'Student'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {showNoMatchHint && (
          <p className="text-xs text-slate-400 px-3 py-2 mb-1 rounded-lg bg-white/5">
            No menu match for &quot;{searchQuery.trim()}&quot;. Showing Dashboard only — clear the search to see all pages.
          </p>
        )}
        {toShow.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
                isActive
                  ? 'bg-brand-indigo text-white shadow-md shadow-brand-indigo/30 ring-1 ring-white/15'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.08] hover:translate-x-0.5 active:scale-[0.99]'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>

      {!isFaculty && mlInsights && (
        <div className="mx-3 mb-3 rounded-xl border border-white/10 bg-black/25 px-3 py-3 transition-all duration-300 hover:border-white/20 hover:bg-black/35">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">At risk level</p>
          <p
            className={`mt-1 text-sm font-bold ${
              mlInsights.riskTier === 'HIGH'
                ? 'text-rose-400'
                : mlInsights.riskTier === 'MEDIUM'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
            }`}
          >
            {mlInsights.riskLevelLabel}
          </p>
          <p className="mt-2 text-xs leading-snug text-slate-400">
            From retention analytics & dropout dataset. Open{' '}
            <button
              type="button"
              onClick={() => onNavigate('recommendations')}
              className="font-semibold text-brand-indigo underline decoration-brand-indigo/40 transition-colors duration-200 hover:text-white"
            >
              Recommendations
            </button>{' '}
            for ML lecture picks.
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full rounded-full ${
                mlInsights.riskTier === 'HIGH'
                  ? 'bg-rose-500'
                  : mlInsights.riskTier === 'MEDIUM'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{
                width: `${mlInsights.riskTier === 'HIGH' ? 88 : mlInsights.riskTier === 'MEDIUM' ? 55 : 28}%`,
              }}
            />
          </div>
        </div>
      )}

      {!isFaculty && mlInsightsLoaded && !mlInsights && studentRecordId && (
        <div className="mx-3 mb-3 flex items-start gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          Risk insight unavailable (check API / student id).
        </div>
      )}

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 transition-all duration-200 ease-out hover:text-brand-rose hover:bg-brand-rose/15 active:scale-[0.98] text-sm font-medium"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
