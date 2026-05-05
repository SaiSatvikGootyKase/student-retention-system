import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, CheckCircle, Upload, AlertCircle, Loader2, Paperclip, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAssignments, submitAssignment } from '../../api';
import type { Assignment } from '../../api';
import { getStudentRecordId } from '../../utils/studentContext';

export default function Assignments() {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<
    Record<string, { fileName: string; mimeType: string; base64: string } | null>
  >({});

  const MAX_ATTACHMENT_BYTES = 6 * 1024 * 1024;

  useEffect(() => {
    const sid = getStudentRecordId(currentUser);
    if (!sid) return;
    getAssignments({ studentId: sid })
      .then(setAssignments)
      .catch(() => setError('Failed to load assignments'))
      .finally(() => setLoading(false));
  }, [currentUser]);

  /** Prefill draft when reopening a submitted assignment for update. */
  useEffect(() => {
    if (!expandedId || !currentUser) return;
    const row = assignments.find((x) => x.id === expandedId);
    if (!row) return;
    const sid = getStudentRecordId(currentUser);
    const sub = sid ? row.submissions.find((s) => s.studentId === sid) : undefined;
    if (sub?.status === 'SUBMITTED' && sub.content && sub.content !== '(document only)') {
      setContent((c) => (c[expandedId] !== undefined ? c : { ...c, [expandedId]: sub.content ?? '' }));
    }
  }, [expandedId, assignments, currentUser]);

  const getStudentSubmission = (a: Assignment) => {
    const sid = getStudentRecordId(currentUser);
    return sid ? a.submissions.find(s => s.studentId === sid) : undefined;
  };

  const readFileAsAttachment = (file: File): Promise<{ fileName: string; mimeType: string; base64: string }> => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return Promise.reject(new Error(`Choose a file under ${Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024))} MB.`));
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const m = result.match(/^data:([^;]*);base64,(.+)$/);
        if (!m) {
          reject(new Error('Could not read that file type.'));
          return;
        }
        resolve({ fileName: file.name, mimeType: m[1] || file.type || 'application/octet-stream', base64: m[2] });
      };
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelected = async (assignmentId: string, list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    try {
      const att = await readFileAsAttachment(file);
      setAttachments((prev) => ({ ...prev, [assignmentId]: att }));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not attach file.');
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    const text = content[assignmentId]?.trim() ?? '';
    const file = attachments[assignmentId];
    const sid = getStudentRecordId(currentUser);
    if (!sid || (!text && !file)) return;
    setSubmitting(assignmentId);
    try {
      const updated = await submitAssignment(assignmentId, {
        studentId: sid,
        content: text,
        ...(file
          ? {
              attachmentFileName: file.fileName,
              attachmentMimeType: file.mimeType,
              attachmentBase64: file.base64,
            }
          : {}),
      });
      setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? updated : a)));
      setContent((prev) => ({ ...prev, [assignmentId]: '' }));
      setAttachments((prev) => ({ ...prev, [assignmentId]: null }));
      setExpandedId(null);
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(null);
    }
  };

  const canSubmitWork = (a: Assignment) => {
    const sub = getStudentSubmission(a);
    return !sub || sub.status !== 'GRADED';
  };

  const statusBadge = (a: Assignment) => {
    const sub = getStudentSubmission(a);
    const overdue = new Date(a.dueDate) < new Date();
    if (sub?.status === 'GRADED') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">Graded</span>;
    if (sub?.status === 'SUBMITTED') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20">Submitted</span>;
    if (overdue) return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-brand-rose/10 text-brand-rose border border-brand-rose/20">Overdue</span>;
    return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-brand-amber/10 text-brand-amber border border-brand-amber/20">Pending</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-indigo" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">View and submit your coursework</p>
        </div>
        <div className="text-sm text-slate-500">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-brand-rose/5 border border-brand-rose/20 rounded-xl text-brand-rose text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {assignments.length === 0 && !loading && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No assignments yet</p>
          <p className="text-sm text-slate-400 mt-1">Check back later for new assignments from your faculty</p>
        </div>
      )}

      <div className="space-y-4">
        {assignments.map(a => {
          const sub = getStudentSubmission(a);
          const isExpanded = expandedId === a.id;
          return (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-indigo/10 flex items-center justify-center shrink-0">
                      <BookOpen size={20} className="text-brand-indigo" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-navy">{a.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{a.course}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <Clock size={12} />
                        Due: {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {statusBadge(a)}
                    {canSubmitWork(a) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(a.id);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-indigo px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-indigo/90"
                      >
                        <Upload size={13} aria-hidden />
                        {sub?.status === 'SUBMITTED' ? 'Update' : 'Submit'}
                      </button>
                    )}
                  </div>
                </div>

                {sub?.status === 'GRADED' && (
                  <div className="mt-4 p-3 bg-brand-emerald/5 border border-brand-emerald/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-brand-emerald" />
                      <span className="text-sm font-bold text-brand-emerald">Grade: {sub.grade}</span>
                    </div>
                    {sub.feedback && <p className="text-sm text-slate-600 mt-1">{sub.feedback}</p>}
                  </div>
                )}
              </div>

              {isExpanded && canSubmitWork(a) && (
                <div className="border-t border-slate-100 p-6 bg-slate-50" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm text-slate-600 mb-3">{a.description}</p>
                  <textarea
                    value={content[a.id] ?? ''}
                    onChange={(e) => setContent((prev) => ({ ...prev, [a.id]: e.target.value }))}
                    placeholder="Write your submission here (or attach a document below)..."
                    rows={4}
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo resize-none"
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      id={`attach-doc-${a.id}`}
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        void handleFileSelected(a.id, e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <label
                      htmlFor={`attach-doc-${a.id}`}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-indigo/40 hover:bg-slate-50"
                    >
                      <Paperclip size={16} className="text-brand-indigo" aria-hidden />
                      Attach document
                    </label>
                    {attachments[a.id] && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-brand-navy">
                        {attachments[a.id]!.fileName}
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => ({ ...prev, [a.id]: null }))}
                          className="ml-1 rounded p-0.5 text-slate-500 hover:bg-slate-200 hover:text-brand-rose"
                          aria-label="Remove attachment"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">PDF, Word, images, or ZIP — max about 6 MB.</p>
                  <button
                    type="button"
                    onClick={() => handleSubmit(a.id)}
                    disabled={(!(content[a.id]?.trim() ?? '') && !attachments[a.id]) || submitting === a.id}
                    className="mt-3 flex items-center gap-2 bg-brand-indigo hover:bg-brand-indigo/90 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors"
                  >
                    {submitting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Submit
                  </button>
                </div>
              )}
              {isExpanded && !canSubmitWork(a) && (
                <div className="border-t border-slate-100 p-6 bg-slate-50" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm font-medium text-slate-700 mb-2">Instructions</p>
                  <p className="text-sm text-slate-600">{a.description}</p>
                  <p className="mt-3 text-xs text-slate-500">This assignment is graded — no further submission.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
