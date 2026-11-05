import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Plus, Users, X, Trash2, DollarSign, Loader2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface DueRecord {
  _id: string;
  personName: string;
  personPhone: string;
  personType: 'customer' | 'supplier' | 'employee' | 'other';
  description: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  payments: Array<{ date: string; amount: number; note: string }>;
  createdAt: string;
}

export default function DuesPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DueRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    personName: '', personPhone: '', personType: 'customer', description: '',
    totalAmount: '', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['dues-records'],
    queryFn: () => api.get('/finance/dues').then(r => r.data.data),
  });
  const records: DueRecord[] = data || [];

  const filtered = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus);

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/finance/dues', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dues-records'] }); toast.success('Due record added'); setShowAdd(false); resetForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => api.post(`/finance/dues/${id}/pay`, { amount }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dues-records'] }); toast.success('Payment recorded'); setPayAmount(''); setSelectedRecord(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/dues/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['dues-records'] }); toast.success('Deleted'); },
  });

  const resetForm = () => setForm({
    personName: '', personPhone: '', personType: 'customer', description: '',
    totalAmount: '', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  const totalDue = records.filter(r => r.status !== 'paid').reduce((s, r) => s + (r.totalAmount - r.paidAmount), 0);
  const overdueCount = records.filter(r => r.status === 'overdue').length;

  const statusBadge = (s: string) => ({
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    partial: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  }[s] || 'bg-slate-500/10 text-slate-400 border-slate-500/20');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Remaining Dues / অবশিষ্ট বকেয়া</h2>
          <p className="text-slate-400">Track outstanding payments and collections</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-primary text-white">
          <Plus className="h-4 w-4" /> Add Due Record
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: records.length, icon: Users, color: 'blue' },
          { label: 'Total Outstanding', value: formatCurrency(totalDue), icon: DollarSign, color: 'amber' },
          { label: 'Overdue Items', value: overdueCount, icon: AlertTriangle, color: 'red' },
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

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'partial', 'overdue', 'paid'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn('px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors border',
              filterStatus === s ? 'bg-primary text-white border-primary' : 'border-slate-700 text-slate-400 hover:text-white')}>
            {s}
          </button>
        ))}
      </div>

      {/* Records */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-semibold">No due records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50">
                  <tr>
                    {['Person', 'Type', 'Total', 'Paid', 'Remaining', 'Due Date', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-slate-400 text-xs font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.map(r => (
                    <tr key={r._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white">{r.personName}</p>
                        <p className="text-xs text-slate-400">{r.personPhone}</p>
                        {r.description && <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{r.description}</p>}
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] capitalize">{r.personType}</span></td>
                      <td className="px-4 py-3 font-bold text-white">{formatCurrency(r.totalAmount)}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">{formatCurrency(r.paidAmount)}</td>
                      <td className="px-4 py-3 text-red-400 font-bold">{formatCurrency(r.totalAmount - r.paidAmount)}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">{new Date(r.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-1 rounded-full text-[10px] font-bold uppercase border', statusBadge(r.status))}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {r.status !== 'paid' && (
                            <Button size="sm" className="h-7 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                              onClick={() => setSelectedRecord(r)}>Pay</Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-400"
                            onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(r._id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Add Due Record</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => { setShowAdd(false); resetForm(); }}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs text-slate-400">Name *</label>
                  <Input value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
                <div className="space-y-1"><label className="text-xs text-slate-400">Phone</label>
                  <Input value={form.personPhone} onChange={e => setForm({ ...form, personPhone: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs text-slate-400">Type</label>
                  <select value={form.personType} onChange={e => setForm({ ...form, personType: e.target.value })}
                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white">
                    {['customer', 'supplier', 'employee', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1"><label className="text-xs text-slate-400">Amount *</label>
                  <Input type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              </div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Due Date</label>
                <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Description</label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-slate-700" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
                <Button className="flex-1 bg-primary text-white" disabled={createMutation.isPending}
                  onClick={() => {
                    if (!form.personName || !form.totalAmount) return toast.error('Name and Amount required');
                    createMutation.mutate({ ...form, totalAmount: Number(form.totalAmount) });
                  }}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pay Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-slate-900 border-slate-700 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-base">Record Payment</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedRecord(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-800 rounded-lg">
                <p className="font-bold text-white">{selectedRecord.personName}</p>
                <p className="text-xs text-slate-400">Remaining: {formatCurrency(selectedRecord.totalAmount - selectedRecord.paidAmount)}</p>
              </div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Amount to Pay *</label>
                <Input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  placeholder={String(selectedRecord.totalAmount - selectedRecord.paidAmount)}
                  className="bg-slate-800 border-slate-700 text-white text-lg font-bold" /></div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-slate-700" onClick={() => setSelectedRecord(null)}>Cancel</Button>
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={payMutation.isPending}
                  onClick={() => payMutation.mutate({ id: selectedRecord._id, amount: Number(payAmount) || (selectedRecord.totalAmount - selectedRecord.paidAmount) })}>
                  {payMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
