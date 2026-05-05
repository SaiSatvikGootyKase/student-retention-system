import React, { useEffect, useState } from 'react';
import { FileText, Plus, Trash2, Calendar, Clock, MapPin, Loader2, Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getExams, createExam, deleteExam } from '../../api';
import type { Exam } from '../../api';

export default function ExamScheduling() {
  const { currentUser } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', course: '', date: '', venue: '', durationMinutes: 60, description: '' });

  useEffect(() => {
    if (!currentUser?.userId) return;
    getExams({ facultyId: currentUser.userId })
      .then(setExams).catch(() => {}).finally(() => setLoading(false));
  }, [currentUser]);

  const handleCreate = async () => {
    if (!form.title || !form.course || !form.date) return;
    setSaving(true);
    try {
      const exam = await createExam({ ...form, facultyId: currentUser?.userId, date: new Date(form.date).toISOString() });
      setExams(prev => [exam, ...prev]);
      setForm({ title: '', course: '', date: '', venue: '', durationMinutes: 60, description: '' });
      setShowForm(false);
    } catch { } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await deleteExam(id);
    setExams(prev => prev.filter(e => e.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-indigo" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-brand-navy">Exam Scheduling</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage upcoming examinations</p></div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-brand-indigo hover:bg-brand-indigo/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
          <Plus size={16} /> Schedule Exam
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-brand-navy">New Exam</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'title', label: 'Exam Title *', placeholder: 'e.g. Mid-Term Exam' },
              { key: 'course', label: 'Course *', placeholder: 'e.g. CS101' },
              { key: 'venue', label: 'Venue', placeholder: 'e.g. Hall A' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
                <input type="text" value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50" />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Duration (minutes)</label>
              <input type="number" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} min={30}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date & Time *</label>
            <input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Exam instructions or notes..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50 resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-2 bg-brand-indigo hover:bg-brand-indigo/90 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Schedule Exam
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <FileText size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No exams scheduled yet</p>
          <p className="text-sm text-slate-400 mt-1">Click "Schedule Exam" to add one</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map(exam => (
            <div key={exam.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-brand-indigo/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-rose/10 flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-brand-rose" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-navy">{exam.title}</h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full mt-1 inline-block">{exam.course}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(exam.id)} className="p-1.5 text-slate-400 hover:text-brand-rose hover:bg-brand-rose/10 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2"><Calendar size={12} />{new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="flex items-center gap-2"><Clock size={12} />{new Date(exam.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {exam.durationMinutes} min</div>
                {exam.venue && <div className="flex items-center gap-2"><MapPin size={12} />{exam.venue}</div>}
                {exam.description && <p className="text-xs text-slate-400 mt-2">{exam.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
