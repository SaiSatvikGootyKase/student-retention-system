import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  Bell,
  BookOpen,
  CheckSquare,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getTeacherDashboardStudentsRisk, getTeacherDashboardSummary } from '../../api';
import type { StudentRiskRow, TeacherDashboardSummary } from '../../api';

interface FacultyHomeProps {
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

function tierRank(tier: string | undefined): number {
  switch ((tier || '').toUpperCase()) {
    case 'HIGH':
      return 0;
    case 'MEDIUM':
      return 1;
    case 'LOW':
      return 2;
    default:
      return 3;
  }
}

function formatLastUpdated(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function riskLabel(tier: string): string {
  switch ((tier || '').toUpperCase()) {
    case 'HIGH':
      return 'High Risk';
    case 'MEDIUM':
      return 'Medium Risk';
    case 'LOW':
      return 'Low Risk';
    default:
      return tier || '—';
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const quickLinks = [
  { id: 'create-assignment', label: 'Create Assignment', icon: BookOpen, color: 'bg-brand-indigo/10 text-brand-indigo', desc: 'Post new coursework' },
  { id: 'evaluation', label: 'Evaluation', icon: CheckSquare, color: 'bg-brand-emerald/10 text-brand-emerald', desc: 'Grade submissions' },
  { id: 'attendance', label: 'Attendance', icon: Users, color: 'bg-brand-amber/10 text-brand-amber', desc: 'Mark class attendance' },
  { id: 'exams', label: 'Exam Scheduling', icon: FileText, color: 'bg-brand-rose/10 text-brand-rose', desc: 'Manage exam dates' },
  { id: 'messaging', label: 'Messaging', icon: MessageSquare, color: 'bg-purple-100 text-purple-600', desc: 'Chat with students' },
  { id: 'announcements-faculty', label: 'Announcements', icon: Bell, color: 'bg-cyan-100 text-cyan-600', desc: 'Post updates' },
];

function PerformanceTrendChart({
  labels,
  assignments,
  attendance,
  participation,
}: {
  labels: string[];
  assignments: number[];
  attendance: number[];
  participation: number[];
}) {
  const w = 420;
  const h = 220;
  const pad = { l: 40, r: 16, t: 12, b: 44 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const n = Math.max(labels.length, 2);

  const safe = (arr: number[], len: number) => {
    const out = [...arr];
    while (out.length < len) out.push(out[out.length - 1] ?? 0);
    return out.slice(0, len);
  };

  const len = labels.length;
  const a = safe(assignments, len);
  const att = safe(attendance, len);
  const p = safe(participation, len);
  const smoothSeries = (vals: number[]) => {
    if (vals.length <= 2) return vals;
    return vals.map((v, i) => {
      const prev = vals[Math.max(0, i - 1)];
      const next = vals[Math.min(vals.length - 1, i + 1)];
      const smoothed = prev * 0.25 + v * 0.5 + next * 0.25;
      return Number(smoothed.toFixed(1));
    });
  };
  const sa = smoothSeries(a);
  const satt = smoothSeries(att);
  const sp = smoothSeries(p);

  const all = [...sa, ...satt, ...sp].filter((x) => Number.isFinite(x));
  const rawMin = all.length ? Math.min(...all) : 0;
  const rawMax = all.length ? Math.max(...all) : 100;
  const margin = 5;
  let yMin = Math.max(0, rawMin - margin);
  let yMax = Math.min(100, rawMax + margin);
  let span = yMax - yMin;
  if (span < 18) {
    const mid = (yMin + yMax) / 2;
    yMin = Math.max(0, mid - 12);
    yMax = Math.min(100, mid + 12);
    span = Math.max(yMax - yMin, 1);
  }

  const xAt = (i: number) => pad.l + innerW * (n === 1 ? 0.5 : i / (n - 1));
  const yAt = (v: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, v));
    return pad.t + innerH * (1 - (clamped - yMin) / span);
  };

  const linePath = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(v)}`)
      .join(' ');

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) =>
    Math.round(yMin + (span * i) / (tickCount - 1)),
  );

  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-full h-auto" role="img" aria-label="Student performance trend">
        {yTicks.map((tick, ti) => (
          <g key={`y-${ti}-${tick}`}>
            <line x1={pad.l} x2={w - pad.r} y1={yAt(tick)} y2={yAt(tick)} className="stroke-slate-100" strokeWidth={1} />
            <text x={6} y={yAt(tick) + 4} className="fill-slate-400 text-[10px]">
              {tick}
            </text>
          </g>
        ))}
        <path d={linePath(sa)} fill="none" stroke="#22c55e" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
        <path d={linePath(satt)} fill="none" stroke="#3b82f6" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
        <path d={linePath(sp)} fill="none" stroke="#f97316" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
        {labels.map((lab, i) => (
          <text key={lab} x={xAt(i)} y={h - 14} textAnchor="middle" className="fill-slate-500 text-[10px]">
            {lab.replace('Week ', 'W')}
          </text>
        ))}
      </svg>
      <p className="text-[10px] text-slate-400 px-0.5">
        Y-axis zoomed to ~{Math.round(yMin)}–{Math.round(yMax)}% (full scale 0–100) so week-to-week changes read clearly.
      </p>
      <p className="text-[10px] text-slate-400 px-0.5">Lines are lightly smoothed to reduce one-week visual spikes.</p>
    </div>
  );
}

function RiskDonut({
  high,
  medium,
  low,
  onActivate,
}: {
  high: number;
  medium: number;
  low: number;
  onActivate: () => void;
}) {
  const total = high + medium + low;
  const pct = (n: number) => (total <= 0 ? 0 : (n / total) * 100);
  const pHigh = pct(high);
  const pMed = pct(medium);

  const grad =
    total <= 0
      ? 'conic-gradient(#e2e8f0 0deg 360deg)'
      : `conic-gradient(#ef4444 0deg ${pHigh * 3.6}deg, #eab308 ${pHigh * 3.6}deg ${(pHigh + pMed) * 3.6}deg, #22c55e ${(pHigh + pMed) * 3.6}deg 360deg)`;

  return (
    <button
      type="button"
      onClick={onActivate}
      className="relative mx-auto flex h-44 w-44 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none ring-offset-2 transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-brand-indigo"
      style={{ background: grad }}
      aria-label="Open students at risk list by risk distribution"
    >
      <span className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-center text-sm font-bold text-brand-navy shadow-inner">
        {total > 0 ? `${total}` : '—'}
        <span className="sr-only"> students total</span>
      </span>
    </button>
  );
}

export default function FacultyHome({ onNavigate, searchQuery = '' }: FacultyHomeProps) {
  const { currentUser } = useAuth();
  const firstName = currentUser?.name?.split(' ')[0] || 'Faculty';

  const [summary, setSummary] = useState<TeacherDashboardSummary | null>(null);
  const [riskRows, setRiskRows] = useState<StudentRiskRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showAtRiskTable, setShowAtRiskTable] = useState(false);
  const [riskTierSortHighFirst, setRiskTierSortHighFirst] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const riskTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const fid = currentUser?.userId?.trim();
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [s, rows] = await Promise.all([
          getTeacherDashboardSummary(fid || undefined),
          getTeacherDashboardStudentsRisk(fid || undefined),
        ]);
        if (!cancelled) {
          setSummary(s);
          setRiskRows(rows || []);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.userId]);

  const openRiskTable = useCallback(() => {
    setShowAtRiskTable(true);
    requestAnimationFrame(() => {
      riskTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const filteredRiskRows = useMemo(() => {
    if (!q) return riskRows;
    return riskRows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.major.toLowerCase().includes(q) ||
        r.displayStudentId.toLowerCase().includes(q) ||
        (r.section && r.section.toLowerCase().includes(q)) ||
        riskLabel(r.riskTier).toLowerCase().includes(q),
    );
  }, [riskRows, q]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRiskRows];
    copy.sort((a, b) => {
      const ta = tierRank(a.riskTier);
      const tb = tierRank(b.riskTier);
      const cmp = riskTierSortHighFirst ? ta - tb : tb - ta;
      if (cmp !== 0) return cmp;
      return a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' });
    });
    return copy;
  }, [filteredRiskRows, riskTierSortHighFirst]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const safePage = Math.min(page, pageCount - 1);
  const pagedRows = useMemo(() => {
    const start = safePage * rowsPerPage;
    return sortedRows.slice(start, start + rowsPerPage);
  }, [sortedRows, safePage, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [rowsPerPage, filteredRiskRows.length, riskTierSortHighFirst]);

  const visibleQuickLinks = quickLinks.filter((l) => matchesQuickSearch(l, searchQuery));

  const kpiCards = summary
    ? [
        {
          key: 'total',
          label: 'TOTAL STUDENTS',
          value: String(summary.totalStudents),
          sub: summary.advisorySection
            ? `Your section: ${summary.advisorySection}`
            : 'All sections (no faculty filter)',
          icon: Users,
          iconWrap: 'text-sky-600 bg-sky-50',
          trendUp: true,
          onClick: openRiskTable,
        },
        {
          key: 'atrisk',
          label: 'AT RISK',
          value: String(summary.atRiskCount),
          sub: 'High tier — needs attention',
          icon: AlertTriangle,
          iconWrap: 'text-rose-600 bg-rose-50',
          trendUp: true,
          onClick: openRiskTable,
        },
        {
          key: 'interventions',
          label: 'ACTIVE INTERVENTIONS',
          value: String(summary.activeInterventions),
          sub: 'Tracked follow-ups',
          icon: Bell,
          iconWrap: 'text-amber-600 bg-amber-50',
          trendUp: false,
        },
        {
          key: 'avg',
          label: 'AVG. PERFORMANCE',
          value: `${summary.avgPerformancePercent.toFixed(1)}%`,
          sub: summary.advisorySection
            ? `Section ${summary.advisorySection} average`
            : 'Cohort academic standing',
          icon: BarChart2,
          iconWrap: 'text-emerald-600 bg-emerald-50',
          trendUp: true,
        },
      ]
    : [];

  return (
    <div className="space-y-8 page-fade">
      <div className="relative overflow-hidden rounded-2xl bg-brand-navy p-8 text-white shadow-lg transition-shadow duration-300 ease-out hover:shadow-xl hover:shadow-brand-navy/40">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-indigo rounded-full opacity-10 -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="relative z-10">
          <p className="text-brand-indigo font-semibold text-sm mb-1">Faculty Portal 👨‍🏫</p>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome, {firstName}</h1>
          <p className="text-slate-300 text-sm max-w-md">
            Manage your classes, track student progress, and keep your students engaged and on track.
          </p>
          {summary?.advisorySection && (
            <p className="mt-3 inline-flex rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-indigo transition-colors duration-200 hover:bg-white/15">
              Advisory section: {summary.advisorySection}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => onNavigate('create-assignment')}
              className="rounded-lg bg-brand-indigo px-5 py-2.5 text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-indigo/90 hover:shadow-lg hover:shadow-brand-indigo/35 active:translate-y-0 active:scale-[0.99]"
            >
              Create Assignment
            </button>
            <button
              type="button"
              onClick={() => onNavigate('attendance')}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-bold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
            >
              <Users size={16} /> Mark Attendance
            </button>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p className="font-medium">{loadError}</p>
          {loadError.includes('/teachers/dashboard') && (
            <p className="mt-2 text-xs leading-relaxed text-rose-900/90">
              The faculty dashboard routes exist in this repo’s Spring code. A 404 here almost always means the
              process on port 8080 is an older build. Stop the backend, then from the{' '}
              <span className="rounded bg-white/60 px-1 font-mono text-[11px]">student-retention-system</span> folder
              run <span className="rounded bg-white/60 px-1 font-mono text-[11px]">.\gradlew.bat bootRun</span>
              (or <span className="rounded bg-white/60 px-1 font-mono text-[11px]">docker compose build backend</span>{' '}
              then <span className="rounded bg-white/60 px-1 font-mono text-[11px]">docker compose up</span>) so the
              latest <span className="font-mono text-[11px]">TeacherController</span> is loaded.
            </p>
          )}
        </div>
      )}

      {!loadError && summary && summary.totalStudents === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          <p className="font-semibold text-brand-navy">No students in the roster yet.</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Seeded accounts use <span className="font-mono">mentor</span> + <span className="font-mono">section</span>{' '}
            on each profile (e.g. CSIT-A–D). If you use a custom faculty login, set{' '}
            <span className="font-mono">profiles.mentor</span> to your user id for students you advise, or sign in as a
            seeded faculty user. Run{' '}
            <span className="font-mono">python ML_model/scripts/seed_lms_portfolio_sample.py --replace</span> to reload
            demo sections.
          </p>
        </div>
      )}

      <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">Student Performance and Risk Assessment</h2>
            <p className="text-sm text-slate-500">
              KPIs and roster are scoped to students in{' '}
              <span className="font-medium text-brand-navy">
                {summary?.advisorySection ?? 'your assigned section (mentor link)'}
              </span>
              . Each section is assigned to one faculty mentor.
            </p>
          </div>

          {loading && !summary ? (
            <p className="text-sm text-slate-500">Loading dashboard…</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpiCards.map((c) => {
                  const Icon = c.icon;
                  const body = (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold tracking-wide text-slate-500">{c.label}</p>
                        <p className="mt-1 text-2xl font-bold text-brand-navy">{c.value}</p>
                        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                          {c.trendUp ? (
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                          )}
                          {c.sub}
                        </p>
                      </div>
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${c.iconWrap}`}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                    </div>
                  );
                  if (c.onClick) {
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={c.onClick}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-indigo/45 hover:shadow-card-hover active:translate-y-0 active:scale-[0.99]"
                      >
                        {body}
                      </button>
                    );
                  }
                  return (
                    <div
                      key={c.key}
                      className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow duration-200 hover:shadow-md"
                    >
                      {body}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 ease-out hover:border-slate-300 hover:shadow-md">
                  <h3 className="text-base font-bold text-brand-navy">Student Performance Trend</h3>
                  <p className="text-xs text-slate-500">Weekly metrics (assignments, attendance, participation).</p>
                  <div className="mt-4">
                    {summary && summary.trendWeekLabels.length > 0 ? (
                      <PerformanceTrendChart
                        labels={summary.trendWeekLabels}
                        assignments={summary.trendAssignmentsPct}
                        attendance={summary.trendAttendancePct}
                        participation={summary.trendParticipationPct}
                      />
                    ) : (
                      <p className="text-sm text-slate-400">No trend data.</p>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Assignments %
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" /> Attendance %
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-orange-500" /> Participation %
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 ease-out hover:border-slate-300 hover:shadow-md">
                  <h3 className="text-base font-bold text-brand-navy">Risk Distribution</h3>
                  <p className="text-xs text-slate-500">
                    Overview of student risk levels. Click the chart or any count below to open the sorted roster (high risk first).
                  </p>
                  <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
                    {summary ? (
                      <RiskDonut
                        high={summary.highRiskCount}
                        medium={summary.mediumRiskCount}
                        low={summary.lowRiskCount}
                        onActivate={openRiskTable}
                      />
                    ) : null}
                    <ul className="min-w-[10rem] space-y-2 text-sm">
                      {summary ? (
                        <>
                          <li>
                            <button
                              type="button"
                              onClick={openRiskTable}
                              className="flex w-full items-center justify-between gap-6 rounded-lg px-2 py-1 text-left hover:bg-slate-50"
                            >
                              <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> High
                              </span>
                              <span className="font-semibold text-brand-navy">{summary.highRiskCount}</span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={openRiskTable}
                              className="flex w-full items-center justify-between gap-6 rounded-lg px-2 py-1 text-left hover:bg-slate-50"
                            >
                              <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Medium
                              </span>
                              <span className="font-semibold text-brand-navy">{summary.mediumRiskCount}</span>
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={openRiskTable}
                              className="flex w-full items-center justify-between gap-6 rounded-lg px-2 py-1 text-left hover:bg-slate-50"
                            >
                              <span className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low
                              </span>
                              <span className="font-semibold text-brand-navy">{summary.lowRiskCount}</span>
                            </button>
                          </li>
                        </>
                      ) : null}
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-slate-500">
                <button
                  type="button"
                  onClick={openRiskTable}
                  className="font-semibold text-brand-indigo hover:underline"
                >
                  View student roster (sorted high risk → low)
                </button>
              </p>
            </>
          )}
        </section>

      {showAtRiskTable && (
        <div ref={riskTableRef} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-navy">Students at Risk</h2>
                <p className="text-sm text-slate-500">Students requiring attention — high risk listed first.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAtRiskTable(false)}
                className="text-sm font-medium text-slate-500 hover:text-brand-navy"
              >
                Hide
              </button>
              <button
                type="button"
                onClick={() => setRowsPerPage(Math.min(100, sortedRows.length || 100))}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-indigo hover:underline"
              >
                View all <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Student name</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Performance</th>
                  <th className="px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-semibold text-brand-navy hover:text-brand-indigo"
                      onClick={() => setRiskTierSortHighFirst((v) => !v)}
                      title="Toggle: high risk first vs low risk first"
                    >
                      Risk level
                      <ChevronDown
                        className={`h-4 w-4 transition ${riskTierSortHighFirst ? '' : 'rotate-180'}`}
                        aria-hidden
                      />
                    </button>
                  </th>
                  <th className="px-4 py-3">Last updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => {
                  const tier = (row.riskTier || '').toUpperCase();
                  const perf = row.performancePercent;
                  const barColor =
                    tier === 'HIGH' ? 'bg-red-500' : tier === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500';
                  const up = tier === 'LOW';
                  return (
                    <tr key={row.studentId} className="border-b border-slate-50 hover:bg-slate-50/80">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-brand-navy">
                            {initials(row.fullName)}
                          </span>
                          <div>
                            <p className="font-semibold text-brand-navy">{row.fullName}</p>
                            <p className="text-xs text-slate-500">{row.major}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-brand-navy">
                          {row.section || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-slate-600">{row.displayStudentId}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-brand-navy">{perf.toFixed(0)}%</span>
                          {up ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" aria-hidden />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-rose-500" aria-hidden />
                          )}
                        </div>
                        <div className="mt-1.5 h-1.5 w-36 max-w-full overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, Math.max(8, perf))}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {tier === 'HIGH' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white">
                            <AlertTriangle className="h-3.5 w-3.5" /> {riskLabel(row.riskTier)}
                          </span>
                        )}
                        {tier === 'MEDIUM' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
                            <AlertTriangle className="h-3.5 w-3.5" /> {riskLabel(row.riskTier)}
                          </span>
                        )}
                        {(tier === 'LOW' || !tier) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {riskLabel(row.riskTier)}
                          </span>
                        )}
                        {tier && tier !== 'HIGH' && tier !== 'MEDIUM' && tier !== 'LOW' && (
                          <span className="inline-flex rounded-full bg-slate-500 px-2.5 py-1 text-xs font-semibold text-white">
                            {riskLabel(row.riskTier)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatLastUpdated(row.lastUpdatedIso)}</td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigate('evaluation')}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-navy hover:bg-slate-50"
                        >
                          View <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sortedRows.length === 0 && !loading && (
              <p className="px-6 py-8 text-center text-sm text-slate-500">No students match the current filters.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-4 border-t border-slate-100 px-6 py-4 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <span className="text-slate-500">Rows per page</span>
              <select
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
              >
                {[5, 10, 25, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <span>
              {sortedRows.length === 0 ? '0–0' : `${safePage * rowsPerPage + 1}–${Math.min((safePage + 1) * rowsPerPage, sortedRows.length)}`}{' '}
              of {sortedRows.length}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Previous page"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40"
                disabled={safePage >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-brand-navy mb-4">Quick Actions</h2>
        {searchQuery.trim() && visibleQuickLinks.length === 0 ? (
          <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-4">
            No quick actions match your search. Clear the search or use the sidebar.
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
