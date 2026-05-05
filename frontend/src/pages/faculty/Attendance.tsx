import React, { useEffect, useState } from 'react';
import { CheckSquare, Calendar, Users, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAttendance, markAttendance, getContacts } from '../../api';
import type { Attendance, User } from '../../api';

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE'] as const;
const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'bg-brand-emerald text-white',
  ABSENT: 'bg-brand-rose text-white',
  LATE: 'bg-brand-amber text-white',
};

export default function AttendancePage() {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [course, setCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.userId) {
      setLoading(false);
      return;
    }
    getContacts(currentUser.userId)
      .then(users => setStudents(users.filter(u => u.role === 'STUDENT')))
      .catch(() => {}).finally(() => setLoading(false));
  }, [currentUser?.userId]);

  useEffect(() => {
    if (!course || !currentUser?.userId) return;
    getAttendance({ facultyId: currentUser.userId, course, date })
      .then(recs => {
        setRecords(recs);
        const map: Record<string, string> = {};
        recs.forEach(r => {
          map[r.studentId] = r.status;
        });
        setAttendance(map);
      }).catch(() => {});
  }, [course, date, currentUser]);

  const studentRowId = (u: User) => u.linkedProfileId || u.id;

  const handleMark = async (studentDocId: string, status: string) => {
    if (!course || !currentUser?.userId) return;
    setSaving(studentDocId);
    try {
      await markAttendance(currentUser.userId, { studentId: studentDocId, course, date, status });
      setAttendance(prev => ({ ...prev, [studentDocId]: status }));
    } catch { } finally { setSaving(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-indigo" size={32} /></div>;

  const present = Object.values(attendance).filter(s => s === 'PRESENT').length;
  const absent = Object.values(attendance).filter(s => s === 'ABSENT').length;
  const late = Object.values(attendance).filter(s => s === 'LATE').length;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-brand-navy">Attendance Tracking</h1>
        <p className="text-sm text-slate-500 mt-1">Mark and manage student attendance per class</p></div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-wrap gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Course</label>
          <input value={course} onChange={e => setCourse(e.target.value)} placeholder="CS101 — Programming Fundamentals"
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1"><Calendar size={12} />Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo" />
        </div>
        {course && (
          <div className="flex items-end gap-4">
            <div className="text-center"><p className="text-2xl font-bold text-brand-emerald">{present}</p><p className="text-xs text-slate-500">Present</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-brand-rose">{absent}</p><p className="text-xs text-slate-500">Absent</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-brand-amber">{late}</p><p className="text-xs text-slate-500">Late</p></div>
          </div>
        )}
      </div>

      {!course ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <CheckSquare size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">Enter a course code to start marking attendance</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Users size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No students found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users size={16} className="text-slate-500" />
            <span className="text-sm font-bold text-brand-navy">{students.length} Students — {course} — {date}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {students.map(s => {
              const sid = studentRowId(s);
              const status = attendance[sid];
              const initials = s.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold">{initials}</div>
                    <div>
                      <p className="font-semibold text-brand-navy text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {STATUS_OPTIONS.map(opt => (
                      <button key={opt} onClick={() => handleMark(sid, opt)} disabled={saving === sid}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${status === opt ? STATUS_STYLES[opt] : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        {opt}
                      </button>
                    ))}
                    {saving === sid && <Loader2 size={14} className="animate-spin text-brand-indigo" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
