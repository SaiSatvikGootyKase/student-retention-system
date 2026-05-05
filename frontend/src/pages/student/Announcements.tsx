import React, { useEffect, useState } from 'react';
import { Bell, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { getAnnouncements } from '../../api';
import type { Announcement } from '../../api';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnnouncements()
      .then(setAnnouncements)
      .catch(() => setError('Failed to load announcements'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-indigo" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Announcements</h1>
        <p className="text-sm text-slate-500 mt-1">Important updates from your faculty</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-brand-rose/5 border border-brand-rose/20 rounded-xl text-brand-rose text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {announcements.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Bell size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No announcements yet</p>
          <p className="text-sm text-slate-400 mt-1">Your faculty will post important updates here</p>
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((ann, i) => (
          <div key={ann.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:border-brand-indigo/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                i % 3 === 0 ? 'bg-brand-indigo/10 text-brand-indigo' :
                i % 3 === 1 ? 'bg-brand-emerald/10 text-brand-emerald' :
                'bg-brand-amber/10 text-brand-amber'
              }`}>
                <Bell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-brand-navy">{ann.title}</h3>
                  <span className="text-xs font-medium text-slate-400 shrink-0 bg-slate-100 px-2 py-1 rounded-full">{ann.course}</span>
                </div>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{ann.body}</p>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
                  <Calendar size={12} />
                  {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
