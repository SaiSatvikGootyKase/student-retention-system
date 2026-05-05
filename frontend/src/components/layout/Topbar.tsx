import React from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface TopbarProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  /** Called when user presses Enter in the search field (e.g. jump to first matching page). */
  onSearchEnter?: () => void;
  /** Opens the announcements area (student or faculty dashboard). */
  onBellClick?: () => void;
}

const Topbar = ({
  searchQuery = '',
  onSearchChange = () => {},
  onSearchEnter,
  onBellClick,
}: TopbarProps) => {
  const { currentUser, logout } = useAuth();
  const isFaculty = currentUser?.role === 'FACULTY';
  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/90 px-8 shadow-sm shadow-slate-900/5 backdrop-blur-md transition-shadow duration-300 ease-out hover:shadow-md hover:shadow-slate-900/[0.07]">
      <div className="w-96 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="search"
          role="searchbox"
          aria-label="Search pages and quick links"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearchEnter?.();
            }
          }}
          placeholder={isFaculty ? 'Search pages (e.g. attendance, exam)...' : 'Search pages (e.g. results, fees)...'}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm transition-all duration-200 ease-out placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-brand-indigo focus:outline-none focus:ring-2 focus:ring-brand-indigo/25"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onBellClick?.()}
          aria-label="Announcements"
          title="Announcements"
          className="relative rounded-full p-2 text-slate-500 transition-all duration-200 ease-out hover:scale-110 hover:bg-brand-indigo/10 hover:text-brand-indigo active:scale-95"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-rose rounded-full" aria-hidden />
        </button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-indigo text-sm font-bold text-white ring-2 ring-transparent transition-all duration-200 ease-out hover:scale-105 hover:ring-brand-indigo/30">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-tight text-brand-navy leading-tight">{currentUser?.name}</p>
            <p className="text-xs text-slate-500 font-medium">{isFaculty ? 'Faculty' : 'Student'} · {currentUser?.department || 'University'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="rounded-lg p-2 text-slate-400 transition-all duration-200 ease-out hover:scale-105 hover:bg-brand-rose/10 hover:text-brand-rose active:scale-95"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
