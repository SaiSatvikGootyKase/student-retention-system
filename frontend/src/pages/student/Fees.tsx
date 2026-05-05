import React, { useEffect, useState } from 'react';
import { DollarSign, CheckCircle, Clock, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentRecordId } from '../../utils/studentContext';
import { getFees, payFee } from '../../api';
import type { Fee } from '../../api';

const statusConfig: Record<string, { label: string; cls: string }> = {
  PAID: { label: 'Paid', cls: 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20' },
  PENDING: { label: 'Pending', cls: 'bg-brand-amber/10 text-brand-amber border-brand-amber/20' },
  OVERDUE: { label: 'Overdue', cls: 'bg-brand-rose/10 text-brand-rose border-brand-rose/20' },
};

export default function Fees() {
  const { currentUser } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    const sid = getStudentRecordId(currentUser);
    if (!sid) return;
    getFees(sid)
      .then(setFees)
      .catch(() => setError('Failed to load fee records'))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const handlePay = async (feeId: string) => {
    setPaying(feeId);
    try {
      const updated = await payFee(feeId);
      setFees(prev => prev.map(f => f.id === feeId ? updated : f));
    } catch {
      setError('Payment failed. Please try again.');
    } finally {
      setPaying(null);
    }
  };

  const totalDue = fees.filter(f => f.status !== 'PAID').reduce((s, f) => s + f.amount, 0);
  const totalPaid = fees.filter(f => f.status === 'PAID').reduce((s, f) => s + f.amount, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-brand-indigo" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Fee Payments</h1>
        <p className="text-sm text-slate-500 mt-1">Track your fee status and payment history</p>
      </div>
      {error && (
        <div className="flex items-center gap-2 p-4 bg-brand-rose/5 border border-brand-rose/20 rounded-xl text-brand-rose text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Due', value: `₹${totalDue.toLocaleString()}`, icon: AlertCircle, cls: 'text-brand-rose bg-brand-rose/10' },
          { label: 'Total Paid', value: `₹${totalPaid.toLocaleString()}`, icon: CheckCircle, cls: 'text-brand-emerald bg-brand-emerald/10' },
          { label: 'Records', value: fees.length.toString(), icon: DollarSign, cls: 'text-brand-indigo bg-brand-indigo/10' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cls}`}><Icon size={20} /></div>
            <div><p className="text-xs text-slate-500 font-medium">{label}</p><p className="text-xl font-bold text-brand-navy">{value}</p></div>
          </div>
        ))}
      </div>
      {fees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <DollarSign size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-500">No fee records found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-brand-navy text-sm uppercase tracking-wider">Fee Records</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {fees.map(fee => {
              const cfg = statusConfig[fee.status] || statusConfig.PENDING;
              return (
                <div key={fee.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      {fee.status === 'PAID' ? <CheckCircle size={18} className="text-brand-emerald" /> :
                       fee.status === 'OVERDUE' ? <AlertCircle size={18} className="text-brand-rose" /> :
                       <Clock size={18} className="text-brand-amber" />}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-navy text-sm">{fee.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Due: {new Date(fee.dueDate).toLocaleDateString()}
                        {fee.paidAt && ` · Paid: ${new Date(fee.paidAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-brand-navy">₹{fee.amount.toLocaleString()}</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${cfg.cls}`}>{cfg.label}</span>
                    {fee.status !== 'PAID' && (
                      <button onClick={() => handlePay(fee.id)} disabled={paying === fee.id}
                        className="flex items-center gap-1.5 bg-brand-indigo hover:bg-brand-indigo/90 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                        {paying === fee.id ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                        Pay Now
                      </button>
                    )}
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
