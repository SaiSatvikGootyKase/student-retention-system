import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Building, Save, Loader2, CheckCircle, Link2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUser, updateUser } from '../../api';
import type { User as UserType } from '../../api';

export default function Profile() {
  const { currentUser } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', department: '', avatarUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser?.userId) return;
    getUser(currentUser.userId)
      .then(u => {
        setUser(u);
        setForm({
          name: u.name || '',
          phone: u.phone || '',
          department: u.department || '',
          avatarUrl: u.avatarUrl || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?.userId) return;
    setSaving(true);
    try {
      const updated = await updateUser(currentUser.userId, form);
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // keep UI state
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-indigo" size={32} />
      </div>
    );
  }

  const initials = (user?.name || currentUser?.name || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const displayName = user?.name || currentUser?.name || 'User';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">View and update your faculty information</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div
          className="h-24 sm:h-28 bg-gradient-to-br from-brand-navy via-brand-navy to-indigo-950 shrink-0"
          aria-hidden
        />

        <div className="px-6 sm:px-10 pt-8 pb-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
            <div className="w-20 h-20 rounded-2xl bg-brand-indigo flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-md shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-brand-navy truncate">{displayName}</h2>
              <p className="text-sm text-slate-500">
                Faculty · {user?.department || currentUser?.department || 'Department not set'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="space-y-1 min-w-0">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Full name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full min-w-0 pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 XXXXXXXXXX"
                  className="w-full min-w-0 pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Department</label>
              <div className="relative">
                <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Computer Science"
                  className="w-full min-w-0 pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Avatar URL</label>
              <div className="relative">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="url"
                  value={form.avatarUrl}
                  onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full min-w-0 pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={user?.email || currentUser?.email || ''}
                  disabled
                  className="w-full min-w-0 pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-400">Email cannot be changed. Contact your admin.</p>
            </div>
          </div>

          <div className="mt-8 pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-brand-indigo hover:bg-brand-indigo/90 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save changes
            </button>
            {saved && (
              <div className="flex items-center gap-2 text-brand-emerald text-sm font-semibold">
                <CheckCircle size={16} /> Saved!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
