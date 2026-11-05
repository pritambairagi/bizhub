import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Plus, CreditCard, Calendar, CheckCircle2, AlertCircle,
  Clock, Trash2, TrendingDown, DollarSign, X, Loader2
} from 'lucide-react';

interface EMIRecord {
  _id: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  nextDueDate: string;
  borrowerName: string;
  borrowerPhone: string;
  note: string;
  status: 'active' | 'completed' | 'overdue';
  payments: Array<{ date: string; amount: number; note: string }>;
}

export default function EMIPage() {
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEMI, setSelectedEMI] = useState<EMIRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [form, setForm] = useState({
    title: '', totalAmount: '', installmentAmount: '', totalInstallments: '',
    frequency: 'monthly', startDate: new Date().toISOString().slice(0, 10),
    borrowerName: '', borrowerPhone: '', note: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['emi-records'],
    queryFn: () => api.get('/finance/emi').then(r => r.data.data),
  });
  const records: EMIRecord[] = data || [];

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/finance/emi', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emi-records'] }); toast.success('EMI record created'); setShowAddModal(false); resetForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create'),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.post(`/finance/emi/${id}/pay`, { amount }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emi-records'] }); toast.success('Payment recorded'); setPayAmount(''); setSelectedEMI(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/emi/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emi-records'] }); toast.success('Deleted'); },
  });

  const resetForm = () => setForm({
    title: '', totalAmount: '', installmentAmount: '', totalInstallments: '',
    frequency: 'monthly', startDate: new Date().toISOString().slice(0, 10),
    borrowerName: '', borrowerPhone: '', note: '',
  });

  const totalPending = records.filter(r => r.status !== 'completed')
    .reduce((s, r) => s + (r.totalAmount - r.paidAmount), 0);
  const overdueCount = records.filter(r => r.status === 'overdue').length;

  const getStatusBadge = (status: string) => {
    if (status === 'completed') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'overdue') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">EMI / কিস্তি Management</h2>
          <p className="text-slate-400">Track installment payments and schedules</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-primary text-white">
          <Plus className="h-4 w-4" /> New EMI Record
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: records.length, icon: CreditCard, color: 'blue' },
          { label: 'Pending Amount', value: formatCurrency(totalPending), icon: TrendingDown, color: 'amber' },
          { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: 'red' },
        ].map(s => (
          <Card key={s.label} className="bg-slate-900 border-slate-800">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                <p className={`text-2xl font-black mt-1 text-${s.color}-400`}>{s.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl bg-${s.color}-500/10 flex items-center justify-center`}>
                <s.icon className={`h-6 w-6 text-${s.color}-400`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Records Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-semibold">No EMI records yet</p>
              <p className="text-sm mt-1">Create your first installment record</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50">
                  <tr>
                    {['Title / Borrower', 'Total', 'Paid', 'Remaining', 'Progress', 'Next Due', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-slate-400 text-xs font-bold uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {records.map(r => {
                    const pct = Math.round((r.paidAmount / r.totalAmount) * 100);
                    return (
                      <tr key={r._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-white">{r.title}</p>
                          <p className="text-xs text-slate-400">{r.borrowerName} · {r.borrowerPhone}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-white">{formatCurrency(r.totalAmount)}</td>
                        <td className="px-4 py-3 text-emerald-400 font-bold">{formatCurrency(r.paidAmount)}</td>
                        <td className="px-4 py-3 text-red-400 font-bold">{formatCurrency(r.totalAmount - r.paidAmount)}</td>
                        <td className="px-4 py-3 w-32">
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{r.paidInstallments}/{r.totalInstallments} paid ({pct}%)</p>
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(r.nextDueDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase border', getStatusBadge(r.status))}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {r.status !== 'completed' && (
                              <Button size="sm" className="h-7 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                                onClick={() => setSelectedEMI(r)}>
                                Pay
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-400"
                              onClick={() => { if (confirm('Delete this EMI record?')) deleteMutation.mutate(r._id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">New EMI / কিস্তি Record</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setShowAddModal(false); resetForm(); }}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1"><label className="text-xs text-slate-400">Title *</label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Shop Equipment Loan" className="bg-slate-800 border-slate-700 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs text-slate-400">Total Amount *</label>
                  <Input type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
                <div className="space-y-1"><label className="text-xs text-slate-400">Per Installment *</label>
                  <Input type="number" value={form.installmentAmount} onChange={e => setForm({ ...form, installmentAmount: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs text-slate-400">Total Installments *</label>
                  <Input type="number" value={form.totalInstallments} onChange={e => setForm({ ...form, totalInstallments: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
                <div className="space-y-1"><label className="text-xs text-slate-400">Frequency *</label>
                  <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}
                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Start Date *</label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs text-slate-400">Borrower Name</label>
                  <Input value={form.borrowerName} onChange={e => setForm({ ...form, borrowerName: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
                <div className="space-y-1"><label className="text-xs text-slate-400">Phone</label>
                  <Input value={form.borrowerPhone} onChange={e => setForm({ ...form, borrowerPhone: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              </div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Note</label>
                <Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-slate-700" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</Button>
                <Button className="flex-1 bg-primary text-white" disabled={createMutation.isPending}
                  onClick={() => {
                    if (!form.title || !form.totalAmount || !form.installmentAmount || !form.totalInstallments)
                      return toast.error('Fill all required fields');
                    createMutation.mutate({
                      ...form,
                      totalAmount: Number(form.totalAmount),
                      installmentAmount: Number(form.installmentAmount),
                      totalInstallments: Number(form.totalInstallments),
                    });
                  }}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Create EMI
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pay Modal */}
      {selectedEMI && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-slate-900 border-slate-700 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-base">Record Payment</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedEMI(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-800 rounded-lg">
                <p className="text-white font-bold">{selectedEMI.title}</p>
                <p className="text-xs text-slate-400 mt-1">Installment: {formatCurrency(selectedEMI.installmentAmount)} · Remaining: {formatCurrency(selectedEMI.totalAmount - selectedEMI.paidAmount)}</p>
              </div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Payment Amount *</label>
                <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  placeholder={String(selectedEMI.installmentAmount)}
                  className="bg-slate-800 border-slate-700 text-white text-lg font-bold" /></div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-slate-700" onClick={() => setSelectedEMI(null)}>Cancel</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={payMutation.isPending}
                  onClick={() => {
                    const amt = Number(payAmount) || selectedEMI.installmentAmount;
                    payMutation.mutate({ id: selectedEMI._id, amount: amt });
                  }}>
                  {payMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Confirm Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
