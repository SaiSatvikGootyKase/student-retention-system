import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  BarChart2,
  Calendar,
  DollarSign,
  Bell,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { getStudentMlInsights } from '../../api';
import type { StudentMlInsightsDto } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import { getStudentIdForMlApi } from '../../utils/studentContext';

interface StudentHomeProps {
  onNavigate: (page: string) => void;
  searchQuery?: string;
}

function matchesQuickSearch(
  link: { id: string; label: string; desc: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const blob = `${link.label} ${link.desc} ${link.id}`.toLowerCase();
  return blob.includes(q);
}

const quickLinks = [
  { id: 'assignments', label: 'Assignments', icon: BookOpen, color: 'bg-brand-indigo/10 text-brand-indigo', desc: 'View & submit work' },
  { id: 'recommendations', label: 'Recommendations', icon: Sparkles, color: 'bg-violet-100 text-violet-700', desc: 'ML lecture picks for you' },
  { id: 'results', label: 'Results', icon: BarChart2, color: 'bg-brand-emerald/10 text-brand-emerald', desc: 'Your grades & GPA' },
  { id: 'timetable', label: 'Timetable', icon: Calendar, color: 'bg-brand-amber/10 text-brand-amber', desc: 'Class schedule' },
  { id: 'fees', label: 'Fees', icon: DollarSign, color: 'bg-brand-rose/10 text-brand-rose', desc: 'Payment status' },
  { id: 'announcements', label: 'Announcements', icon: Bell, color: 'bg-purple-100 text-purple-600', desc: 'Latest updates' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, color: 'bg-cyan-100 text-cyan-600', desc: 'Message your mentor' },
];

function riskStatColor(tier: string | undefined): string {
  if (tier === 'HIGH') return 'text-rose-600 bg-rose-50';
  if (tier === 'MEDIUM') return 'text-amber-600 bg-amber-50';
  return 'text-emerald-600 bg-emerald-50';
}

export default function StudentHome({ onNavigate, searchQuery = '' }: StudentHomeProps) {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(' ')[0] || 'Student';
  const [ml, setMl] = useState<StudentMlInsightsDto | null>(null);

  useEffect(() => {
    const sid = getStudentIdForMlApi(currentUser ?? null);
    if (!sid) return;
    let cancelled = false;
    getStudentMlInsights(sid)
      .then((d) => {
        if (!cancelled) setMl(d);
      })
      .catch(() => {
        if (!cancelled) setMl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const statsRow = useMemo(
    () => [
      {
        label: 'Academic Health',
        value: ml ? (ml.riskTier === 'LOW' ? 'On track' : 'Review plan') : '…',
        icon: TrendingUp,
        color: ml && ml.riskTier !== 'LOW' ? 'text-amber-600 bg-amber-50' : 'text-brand-emerald bg-brand-emerald/10',
      },
      {
        label: 'Risk level',
        value: ml?.riskLevelLabel ?? '…',
        icon: AlertTriangle,
        color: riskStatColor(ml?.riskTier),
      },
      { label: 'Attendance', value: '92%', icon: Calendar, color: 'text-brand-indigo bg-brand-indigo/10' },
      { label: 'Pending fees', value: 'Check', icon: DollarSign, color: 'text-brand-rose bg-brand-rose/10' },
    ],
    [ml],
  );

  const visibleQuickLinks = quickLinks.filter((l) => matchesQuickSearch(l, searchQuery));
  const visibleStats = statsRow.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${s.label} ${s.value}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 page-fade">
      <div className="relative overflow-hidden rounded-2xl bg-brand-navy p-8 text-white shadow-lg transition-shadow duration-300 ease-out hover:shadow-xl hover:shadow-brand-navy/40">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-indigo rounded-full opacity-10 -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="relative z-10">
          <p className="text-brand-indigo font-semibold text-sm mb-1">Welcome back 👋</p>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{firstName}</h1>
          <p className="text-slate-300 text-sm max-w-md">
            Stay on top of your academics. Check your assignments, view your grades, and connect with your faculty mentor.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('assignments')}
              className="rounded-lg bg-brand-indigo px-5 py-2.5 text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-indigo/90 hover:shadow-lg hover:shadow-brand-indigo/35 active:translate-y-0 active:scale-[0.99]"
            >
              View Assignments
            </button>
            <button
              type="button"
              onClick={() => onNavigate('recommendations')}
              className="flex items-center gap-2 rounded-lg bg-violet-500/90 px-5 py-2.5 text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/30 active:translate-y-0 active:scale-[0.99]"
            >
              <Sparkles size={16} /> ML recommendations
            </button>
            <button
              type="button"
              onClick={() => onNavigate('chat')}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
            >
              <MessageSquare size={16} /> Chat with Mentor
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {visibleStats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-indigo/20 hover:shadow-md"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-lg font-bold text-brand-navy">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold text-brand-navy mb-4">Quick Access</h2>
        {searchQuery.trim() && visibleQuickLinks.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-4">
            No quick links match your search. Clear the search or use the sidebar.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {visibleQuickLinks.map(({ id, label, icon: Icon, color, desc }) => (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-brand-indigo/35 hover:shadow-card-hover"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={20} />
                </div>
                <p className="font-bold text-brand-navy group-hover:text-brand-indigo transition-colors text-sm">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
