import React, { useEffect, useState } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, Award, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAssignments, gradeSubmission } from '../../api';
import type { Assignment, Submission } from '../../api';

export default function Evaluation() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState<Record<string, { grade: string; feedback: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.userId) return;
    getAssignments({ facultyId: currentUser.userId })
      .then(setAssignments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleGrade = async (assignmentId: string, studentId: string) => {
    const key = `${assignmentId}-${studentId}`;
    const { grade, feedback } = gradeForm[key] || {};
    if (!grade) return;
    setSaving(key);
    try {
      const updated = await gradeSubmission(assignmentId, studentId, grade, feedback || '');
      setAssignments(prev => prev.map(a => a.id === assignmentId ? updated : a));
    } catch { } finally { setSaving(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-indigo" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Evaluation</h1>
        <p className="text-sm text-slate-500 mt-1">Review and grade student submissions</p>
      </div>
      {assignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <ClipboardList size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No assignments to evaluate</p>
        </div>
      ) : assignments.map(a => {
        const pending = a.submissions.filter(s => s.status !== 'GRADED').length;
        const isOpen = expanded === a.id;
        return (
          <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : a.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-indigo/10 flex items-center justify-center">
                  <ClipboardList size={20} className="text-brand-indigo" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-brand-navy">{a.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{a.course} · {a.submissions.length} submission{a.submissions.length !== 1 ? 's' : ''} · {pending} pending</p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {a.submissions.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-slate-400">No submissions yet</p>
                ) : a.submissions.map((sub: Submission) => {
                  const key = `${a.id}-${sub.studentId}`;
                  const form = gradeForm[key] || { grade: '', feedback: '' };
                  return (
                    <div key={sub.studentId} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-brand-navy">Student: {sub.studentId}</span>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                              sub.status === 'GRADED' ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-brand-amber/10 text-brand-amber'}`}>
                              {sub.status}
                            </span>
                            {sub.grade && <span className="text-sm font-bold text-brand-indigo flex items-center gap-1"><Award size={14} />{sub.grade}</span>}
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm text-slate-700 mb-3 space-y-2">
                            <p className="whitespace-pre-wrap">{sub.content}</p>
                            {sub.attachmentFileName && sub.attachmentBase64 && (
                              <a
                                href={`data:${sub.attachmentMimeType || 'application/octet-stream'};base64,${sub.attachmentBase64}`}
                                download={sub.attachmentFileName}
                                className="inline-flex text-xs font-bold text-brand-indigo hover:underline"
                              >
                                Download attached file: {sub.attachmentFileName}
                              </a>
                            )}
                          </div>
                          {sub.feedback && <p className="text-xs text-slate-500 italic mb-3">Feedback: {sub.feedback}</p>}
                          {sub.status !== 'GRADED' && (
                            <div className="flex items-center gap-2">
                              <input value={form.grade} onChange={e => setGradeForm(f => ({ ...f, [key]: { ...form, grade: e.target.value } }))}
                                placeholder="Grade (A+, A, B...)" className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo" />
                              <input value={form.feedback} onChange={e => setGradeForm(f => ({ ...f, [key]: { ...form, feedback: e.target.value } }))}
                                placeholder="Feedback (optional)" className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo" />
                              <button onClick={() => handleGrade(a.id, sub.studentId)} disabled={!form.grade || saving === key}
                                className="flex items-center gap-1.5 bg-brand-emerald hover:bg-brand-emerald/90 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                {saving === key ? <Loader2 size={12} className="animate-spin" /> : <Award size={12} />} Grade
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
