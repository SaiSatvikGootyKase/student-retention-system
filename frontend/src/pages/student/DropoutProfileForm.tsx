import React, { useState } from 'react';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { patchStudentDropoutProfile, type DropoutMlProfilePayload } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import DropoutMlProfileFormFields from '../../components/student/DropoutMlProfileFormFields';
import { emptyPayload } from '../../utils/dropoutProfilePayload';
import { enrichMlPayloadFromLms } from '../../utils/enrichMlPayloadFromLms';
import { getStudentRecordId } from '../../utils/studentContext';

type Props = {
  onComplete: () => void;
};

export default function DropoutProfileForm({ onComplete }: Props) {
  const { currentUser } = useAuth();
  const schoolHint = currentUser?.department?.trim() || '';
  const [form, setForm] = useState<DropoutMlProfilePayload>(() => emptyPayload(schoolHint));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const uid = currentUser?.userId;
  const name = currentUser?.name || 'Student';

  const update = <K extends keyof DropoutMlProfilePayload>(key: K, value: DropoutMlProfilePayload[K]) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const num = (key: keyof DropoutMlProfilePayload, v: string, min: number, max: number) => {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return;
    update(key, Math.min(max, Math.max(min, n)) as DropoutMlProfilePayload[typeof key]);
  };

  const selectClass =
    'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-indigo/20';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setError('');
    setSaving(true);
    try {
      const sid = getStudentRecordId(currentUser);
      const payload = await enrichMlPayloadFromLms(form, sid);
      await patchStudentDropoutProfile(uid, payload);
      onComplete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-slate flex items-start justify-center p-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Complete your retention profile</h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Hi {name}, you registered with basic details. Please submit the fields below so dropout-risk models can use
            your profile. Values follow the same format as the training dataset (yes/no, GP/MS, etc.).
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-brand-rose/5 border border-brand-rose/20 rounded-lg text-sm text-brand-rose font-medium">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 max-h-[70vh] overflow-y-auto pr-1">
          <DropoutMlProfileFormFields form={form} update={update} num={num} selectClass={selectClass} />

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-brand-indigo hover:bg-brand-indigo/90 disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm shadow-md"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save and continue to dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
