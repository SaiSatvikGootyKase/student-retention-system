import React, { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Award, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentRecordId } from '../../utils/studentContext';
import { getResults } from '../../api';
import type { Result } from '../../api';

const gradeColor: Record<string, string> = {
  'A+': 'text-brand-emerald', A: 'text-brand-emerald', 'A-': 'text-brand-emerald',
  'B+': 'text-brand-indigo', B: 'text-brand-indigo', 'B-': 'text-brand-indigo',
  'C+': 'text-brand-amber', C: 'text-brand-amber', 'C-': 'text-brand-amber',
  D: 'text-brand-rose', F: 'text-brand-rose',
};

export default function Results() {
  const { currentUser } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sid = getStudentRecordId(currentUser);
    if (!sid) return;
    getResults({ studentId: sid })
      .then(setResults)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const avgPct = results.length > 0
    ? Math.round(results.reduce((s, r) => s + (r.marksObtained / r.maxMarks) * 100, 0) / results.length)
    : 0;

  const semesters = [...new Set(results.map(r => r.semester))];

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-indigo" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Results</h1>
        <p className="text-sm text-slate-500 mt-1">Your academic grades and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Average Score', value: `${avgPct}%`, icon: BarChart2, cls: 'text-brand-indigo bg-brand-indigo/10' },
          { label: 'Subjects', value: results.length.toString(), icon: Award, cls: 'text-brand-emerald bg-brand-emerald/10' },
          { label: 'Performance', value: avgPct >= 80 ? 'Excellent' : avgPct >= 60 ? 'Good' : 'Needs Work', icon: TrendingUp, cls: 'text-brand-amber bg-brand-amber/10' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cls}`}><Icon size={20} /></div>
            <div><p className="text-xs text-slate-500 font-medium">{label}</p><p className="text-xl font-bold text-brand-navy">{value}</p></div>
          </div>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <BarChart2 size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No results published yet</p>
        </div>
      ) : (
        semesters.map(sem => (
          <div key={sem} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
              <h3 className="font-bold text-brand-navy">Semester: {sem}</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-100">
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Marks</th>
                  <th className="px-6 py-3">Percentage</th>
                  <th className="px-6 py-3">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.filter(r => r.semester === sem).map(r => {
                  const pct = Math.round((r.marksObtained / r.maxMarks) * 100);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-brand-navy text-sm">{r.subject}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{r.course}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{r.marksObtained}/{r.maxMarks}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 80 ? 'bg-brand-emerald' : pct >= 60 ? 'bg-brand-indigo' : pct >= 40 ? 'bg-brand-amber' : 'bg-brand-rose'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm text-slate-600">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${gradeColor[r.grade] || 'text-slate-700'}`}>{r.grade}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
