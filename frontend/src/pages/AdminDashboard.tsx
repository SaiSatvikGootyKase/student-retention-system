import React, { useState } from 'react';
import { GraduationCap, UserPlus, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { adminCreateUser } from '../api';

type FormState = {
  name: string;
  email: string;
  password: string;
  department: string;
};

const emptyForm = (): FormState => ({
  name: '',
  email: '',
  password: '',
  department: '',
});

export default function AdminDashboard({ adminUserId }: { adminUserId: string }) {
  const [faculty, setFaculty] = useState<FormState>(emptyForm);
  const [student, setStudent] = useState<FormState>(emptyForm);
  const [loadingF, setLoadingF] = useState(false);
  const [loadingS, setLoadingS] = useState(false);
  const [msgF, setMsgF] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [msgS, setMsgS] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const submitFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgF(null);
    if (!adminUserId) {
      setMsgF({ type: 'err', text: 'Not signed in as admin.' });
      return;
    }
    setLoadingF(true);
    try {
      await adminCreateUser({
        adminUserId,
        name: faculty.name.trim(),
        email: faculty.email.trim(),
        password: faculty.password,
        role: 'FACULTY',
        department: faculty.department.trim() || undefined,
      });
      setMsgF({ type: 'ok', text: `Faculty account created for ${faculty.email.trim()}.` });
      setFaculty(emptyForm());
    } catch (err: unknown) {
      setMsgF({ type: 'err', text: err instanceof Error ? err.message : 'Request failed.' });
    } finally {
      setLoadingF(false);
    }
  };

  const submitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgS(null);
    if (!adminUserId) {
      setMsgS({ type: 'err', text: 'Not signed in as admin.' });
      return;
    }
    if (!student.department.trim()) {
      setMsgS({ type: 'err', text: 'School / department is required for students.' });
      return;
    }
    setLoadingS(true);
    try {
      await adminCreateUser({
        adminUserId,
        name: student.name.trim(),
        email: student.email.trim(),
        password: student.password,
        role: 'STUDENT',
        department: student.department.trim(),
      });
      setMsgS({ type: 'ok', text: `Student account created for ${student.email.trim()}.` });
      setStudent(emptyForm());
    } catch (err: unknown) {
      setMsgS({ type: 'err', text: err instanceof Error ? err.message : 'Request failed.' });
    } finally {
      setLoadingS(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-indigo focus:outline-none focus:ring-2 focus:ring-brand-indigo/15';

  return (
    <div className="mx-auto max-w-5xl space-y-8 page-fade">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-navy">Administration</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Create faculty and student accounts. New students must complete the retention profile on first login.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-emerald/10 text-brand-emerald">
              <UserPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-navy">New faculty</h2>
              <p className="text-xs text-slate-500">Creates a FACULTY user (password is set here).</p>
            </div>
          </div>

          {msgF && (
            <div
              className={`mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
                msgF.type === 'ok'
                  ? 'border-brand-emerald/30 bg-brand-emerald/5 text-emerald-900'
                  : 'border-brand-rose/25 bg-brand-rose/5 text-brand-rose'
              }`}
            >
              {msgF.type === 'ok' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
              {msgF.text}
            </div>
          )}

          <form onSubmit={submitFaculty} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Full name</label>
              <input className={inputCls} value={faculty.name} onChange={(e) => setFaculty({ ...faculty, name: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Email</label>
              <input type="email" className={inputCls} value={faculty.email} onChange={(e) => setFaculty({ ...faculty, email: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
              <input type="password" className={inputCls} value={faculty.password} onChange={(e) => setFaculty({ ...faculty, password: e.target.value })} required minLength={6} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Department (optional)</label>
              <input className={inputCls} value={faculty.department} onChange={(e) => setFaculty({ ...faculty, department: e.target.value })} placeholder="e.g. Computer Science" />
            </div>
            <button
              type="submit"
              disabled={loadingF}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-emerald py-2.5 text-sm font-bold text-white shadow transition hover:bg-brand-emerald/90 disabled:opacity-60"
            >
              {loadingF ? <Loader2 size={16} className="animate-spin" /> : null}
              Create faculty account
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-indigo/10 text-brand-indigo">
              <GraduationCap size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-navy">New student</h2>
              <p className="text-xs text-slate-500">Creates a STUDENT user and linked profile.</p>
            </div>
          </div>

          {msgS && (
            <div
              className={`mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${
                msgS.type === 'ok'
                  ? 'border-brand-emerald/30 bg-brand-emerald/5 text-emerald-900'
                  : 'border-brand-rose/25 bg-brand-rose/5 text-brand-rose'
              }`}
            >
              {msgS.type === 'ok' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
              {msgS.text}
            </div>
          )}

          <form onSubmit={submitStudent} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Full name</label>
              <input className={inputCls} value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Email</label>
              <input type="email" className={inputCls} value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
              <input type="password" className={inputCls} value={student.password} onChange={(e) => setStudent({ ...student, password: e.target.value })} required minLength={6} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">School / department (required)</label>
              <input className={inputCls} value={student.department} onChange={(e) => setStudent({ ...student, department: e.target.value })} required placeholder="e.g. Science stream, GP" />
            </div>
            <button
              type="submit"
              disabled={loadingS}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-indigo py-2.5 text-sm font-bold text-white shadow transition hover:bg-brand-indigo/90 disabled:opacity-60"
            >
              {loadingS ? <Loader2 size={16} className="animate-spin" /> : null}
              Create student account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
