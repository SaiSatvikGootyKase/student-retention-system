import React, { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../api';
import type { Announcement } from '../../api';

export default function AnnouncementsFaculty() {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', course: '' });

  useEffect(() => {
    if (!currentUser?.userId) return;
    getAnnouncements({ facultyId: currentUser.userId })
      .then(setAnnouncements).catch(() => {}).finally(() => setLoading(false));
  }, [currentUser]);

  const handleCreate = async () => {
    if (!form.title || !form.body) return;
    setSaving(true);
    try {
      const ann = await createAnnouncement({ ...form, facultyId: currentUser?.userId });
      setAnnouncements(prev => [ann, ...prev]);
      setForm({ title: '', body: '', course: '' });
      setShowForm(false);
    } catch { } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await deleteAnnouncement(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-indigo" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-brand-navy">Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">Post updates and notices for your students</p></div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-brand-indigo hover:bg-brand-indigo/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
          <Plus size={16} /> New Announcement
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-brand-navy">New Announcement</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Course</label>
              <input type="text" value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} placeholder="e.g. CS101 (optional)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Message *</label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Write your announcement here..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50 resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-2 bg-brand-indigo hover:bg-brand-indigo/90 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Post Announcement
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}
      {announcements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Bell size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No announcements posted yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div key={ann.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-indigo/10 flex items-center justify-center shrink-0"><Bell size={18} className="text-brand-indigo" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-brand-navy text-sm">{ann.title}</h3>
                    {ann.course && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{ann.course}</span>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{ann.body}</p>
                  <p className="text-xs text-slate-400 mt-2">{new Date(ann.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(ann.id)} className="p-1.5 text-slate-400 hover:text-brand-rose hover:bg-brand-rose/10 rounded-lg transition-colors shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
