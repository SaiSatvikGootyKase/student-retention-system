import React, { useState, useEffect, useMemo } from 'react';
import { Plus, BookOpen, Trash2, Save, Loader2, AlertCircle, Calendar, Pencil, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAssignments, createAssignment, deleteAssignment, getUsers, updateAssignment, completeAssignment } from '../../api';
import type { Assignment, User } from '../../api';
import { studentMongoIdFromUserRow } from '../../utils/studentContext';

export default function CreateAssignment() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', course: '', dueDate: '', assignedStudentIds: [] as string[] });

  useEffect(() => {
    if (!currentUser?.userId) return;
    Promise.all([
      getAssignments({ facultyId: currentUser.userId }),
      getUsers(),
    ]).then(([asgns, users]) => {
      setAssignments(asgns);
      setStudents(users.filter(u => u.role === 'STUDENT').sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(() => setError('Failed to load data')).finally(() => setLoading(false));
  }, [currentUser]);

  const inferSection = (student: User): string => {
    const fromUser = (student as User & { section?: string }).section;
    if (fromUser && fromUser.trim()) return fromUser.trim().toUpperCase();
    const lowerEmail = (student.email || '').toLowerCase();
    if (lowerEmail.includes('batch1.')) return 'CSIT-A';
    if (lowerEmail.includes('batch2.')) return 'CSIT-B';
    if (lowerEmail.includes('batch3.')) return 'CSIT-C';
    if (lowerEmail.includes('batch4.')) return 'CSIT-D';
    const csit = lowerEmail.match(/csit-[a-d]/i);
    if (csit?.[0]) return csit[0].toUpperCase();
    return 'UNASSIGNED';
  };

  const studentsBySection = useMemo(() => {
    const grouped = new Map<string, User[]>();
    for (const student of students) {
      const section = inferSection(student);
      const list = grouped.get(section) ?? [];
      list.push(student);
      grouped.set(section, list);
    }
    for (const [key, list] of grouped.entries()) {
      grouped.set(key, [...list].sort((a, b) => a.name.localeCompare(b.name)));
    }
    const sectionOrder = ['CSIT-A', 'CSIT-B', 'CSIT-C', 'CSIT-D'];
    return [...grouped.entries()].sort(([a], [b]) => {
      const ai = sectionOrder.indexOf(a);
      const bi = sectionOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [students]);

  const assignAllStudents = () => {
    const allIds = students.map((s) => studentMongoIdFromUserRow(s));
    setForm((f) => ({ ...f, assignedStudentIds: allIds }));
  };

  const clearAllStudents = () => {
    setForm((f) => ({ ...f, assignedStudentIds: [] }));
  };

  const toggleSectionSelection = (sectionStudents: User[]) => {
    const ids = sectionStudents.map((s) => studentMongoIdFromUserRow(s));
    const idSet = new Set(ids);
    setForm((f) => ({
      ...f,
      assignedStudentIds: ids.every((id) => f.assignedStudentIds.includes(id))
        ? f.assignedStudentIds.filter((id) => !idSet.has(id))
        : Array.from(new Set([...f.assignedStudentIds, ...ids])),
    }));
  };

  const resetForm = () => {
    setForm({ title: '', description: '', course: '', dueDate: '', assignedStudentIds: [] });
    setEditingId(null);
  };

  const formatDateTimeLocal = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const z = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
  };

  const handleSave = async () => {
    if (!form.title || !form.course || !form.dueDate) { setError('Please fill all required fields.'); return; }
    setSaving(true); setError('');
    try {
      if (editingId) {
        const updated = await updateAssignment(editingId, {
          ...form,
          facultyId: currentUser?.userId,
          dueDate: new Date(form.dueDate).toISOString(),
        });
        setAssignments(prev => prev.map(a => a.id === editingId ? updated : a));
      } else {
        const created = await createAssignment({ ...form, facultyId: currentUser?.userId, dueDate: new Date(form.dueDate).toISOString() });
        setAssignments(prev => [created, ...prev]);
      }
      resetForm();
      setShowForm(false);
    } catch { setError(`Failed to ${editingId ? 'update' : 'create'} assignment.`); }
    finally { setSaving(false); }
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingId(assignment.id);
    setForm({
      title: assignment.title || '',
      description: assignment.description || '',
      course: assignment.course || '',
      dueDate: formatDateTimeLocal(assignment.dueDate),
      assignedStudentIds: assignment.assignedStudentIds ?? [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteAssignment(id);
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const handleMarkComplete = async (id: string) => {
    const updated = await completeAssignment(id);
    setAssignments(prev => prev.map(a => a.id === id ? updated : a));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-indigo" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-brand-navy">Create Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign to any section — select all students for a cohort-wide task, or pick individuals.
          </p></div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-brand-indigo hover:bg-brand-indigo/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {error && <div className="flex items-center gap-2 p-4 bg-brand-rose/5 border border-brand-rose/20 rounded-xl text-brand-rose text-sm"><AlertCircle size={16} />{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-brand-navy">{editingId ? 'Edit Assignment' : 'New Assignment'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'title', label: 'Title *', type: 'text', placeholder: 'Assignment title' },
              { key: 'course', label: 'Course *', type: 'text', placeholder: 'e.g. CS101' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
                <input type={type} value={form[key as keyof typeof form] as string}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50" />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Due Date *</label>
            <input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Assignment instructions..." rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo bg-slate-50 resize-none" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Assign to Students</label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={assignAllStudents}
                  className="text-xs font-semibold text-brand-indigo hover:underline"
                >
                  Select all ({students.length})
                </button>
                <button
                  type="button"
                  onClick={clearAllStudents}
                  className="text-xs font-semibold text-slate-600 hover:underline"
                >
                  Deselect all
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {studentsBySection.map(([section, sectionStudents]) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => toggleSectionSelection(sectionStudents)}
                  className="rounded-full border border-brand-indigo/30 bg-brand-indigo/5 px-3 py-1 text-xs font-semibold text-brand-indigo hover:bg-brand-indigo/10"
                >
                  {sectionStudents.every((s) => form.assignedStudentIds.includes(studentMongoIdFromUserRow(s)))
                    ? `Deselect ${section}`
                    : `Assign ${section}`} ({sectionStudents.length})
                </button>
              ))}
            </div>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-50">
              {students.map(s => {
                const sid = studentMongoIdFromUserRow(s);
                return (
                <label key={s.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={form.assignedStudentIds.includes(sid)}
                    onChange={e => setForm(f => ({
                      ...f, assignedStudentIds: e.target.checked
                        ? [...f.assignedStudentIds, sid]
                        : f.assignedStudentIds.filter(id => id !== sid)
                    }))} className="rounded" />
                  <span className="text-sm text-brand-navy">{s.name}</span>
                  <span className="text-xs text-slate-400">{s.email}</span>
                </label>
                );
              })}
              {students.length === 0 && <p className="text-sm text-slate-400 px-4 py-3">No student accounts found</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-brand-indigo hover:bg-brand-indigo/90 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {editingId ? 'Save Changes' : 'Create Assignment'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {assignments.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No assignments available</p>
          <p className="text-sm text-slate-400 mt-1">Click "New Assignment" to add one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-indigo/10 flex items-center justify-center shrink-0">
                  <BookOpen size={20} className="text-brand-indigo" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-navy text-sm">{a.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-full">{a.course}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                    <span>{(a.assignedStudentIds ?? []).length} assigned</span>
                    <span>{a.submissions.length} submission{a.submissions.length !== 1 ? 's' : ''}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${a.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {a.completed ? 'Completed' : 'Open'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(a)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => handleMarkComplete(a.id)}
                  disabled={Boolean(a.completed)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                >
                  <CheckCircle2 size={13} /> {a.completed ? 'Completed' : 'Mark Complete'}
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-2 text-slate-400 hover:text-brand-rose hover:bg-brand-rose/10 rounded-lg transition-colors"
                  title="Delete assignment"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
