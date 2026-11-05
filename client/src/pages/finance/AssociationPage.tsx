import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Plus, Users2, X, Trash2, DollarSign, Loader2, ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';

interface Association {
  _id: string;
  name: string;
  description: string;
  memberCount: number;
  totalFund: number;
  monthlyContribution: number;
  members: Array<{ name: string; phone: string; shareAmount: number; paidAmount: number; joinDate: string }>;
  transactions: Array<{ date: string; type: 'credit' | 'debit'; amount: number; description: string; member?: string }>;
  createdAt: string;
}

export default function AssociationPage() {
  const qc = useQueryClient();
  const [selectedAssoc, setSelectedAssoc] = useState<Association | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', monthlyContribution: '' });
  const [memberForm, setMemberForm] = useState({ name: '', phone: '', shareAmount: '' });
  const [txForm, setTxForm] = useState({ type: 'credit', amount: '', description: '', member: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['associations'],
    queryFn: () => api.get('/finance/association').then(r => r.data.data),
  });
  const associations: Association[] = data || [];

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/finance/association', d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['associations'] });
      toast.success('Association created');
      setShowAdd(false);
      setForm({ name: '', description: '', monthlyContribution: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ id, member }: { id: string; member: any }) => api.post(`/finance/association/${id}/member`, member),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['associations'] });
      qc.invalidateQueries({ queryKey: ['association-detail'] });
      toast.success('Member added');
      setShowAddMember(false);
      setMemberForm({ name: '', phone: '', shareAmount: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const addTransactionMutation = useMutation({
    mutationFn: ({ id, tx }: { id: string; tx: any }) => api.post(`/finance/association/${id}/transaction`, tx),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['associations'] });
      toast.success('Transaction recorded');
      setShowTransaction(false);
      setTxForm({ type: 'credit', amount: '', description: '', member: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/association/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['associations'] }); setSelectedAssoc(null); toast.success('Deleted'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Association / সমিতি</h2>
          <p className="text-slate-400">Manage cooperative groups and fund collections</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 bg-primary text-white">
          <Plus className="h-4 w-4" /> New Association
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Associations List */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">All Associations</h3>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : associations.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="py-12 text-center text-slate-500">
                <Users2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No associations yet</p>
              </CardContent>
            </Card>
          ) : (
            associations.map(a => (
              <button key={a._id} onClick={() => setSelectedAssoc(a)}
                className={cn('w-full text-left p-4 rounded-xl border transition-all',
                  selectedAssoc?._id === a._id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700')}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">{a.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{a.memberCount} members</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-400">{formatCurrency(a.totalFund)}</p>
                    <p className="text-[10px] text-slate-500">total fund</p>
                  </div>
                </div>
                {a.description && <p className="text-xs text-slate-500 mt-2 truncate">{a.description}</p>}
              </button>
            ))
          )}
        </div>

        {/* Association Details */}
        <div className="lg:col-span-2">
          {!selectedAssoc ? (
            <Card className="h-full bg-slate-900/50 border-slate-800 border-dashed flex items-center justify-center text-slate-600">
              <CardContent className="text-center py-16">
                <Users2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Select an association to view details</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-white">{selectedAssoc.name}</CardTitle>
                    {selectedAssoc.description && <p className="text-xs text-slate-400 mt-1">{selectedAssoc.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                      onClick={() => setShowAddMember(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Member
                    </Button>
                    <Button size="sm" className="h-8 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      onClick={() => setShowTransaction(true)}>
                      <DollarSign className="h-3.5 w-3.5 mr-1" /> Transaction
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400"
                      onClick={() => { if (confirm('Delete association?')) deleteMutation.mutate(selectedAssoc._id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'Total Fund', value: formatCurrency(selectedAssoc.totalFund), color: 'emerald' },
                      { label: 'Members', value: selectedAssoc.memberCount, color: 'blue' },
                      { label: 'Monthly', value: formatCurrency(selectedAssoc.monthlyContribution), color: 'purple' },
                    ].map(s => (
                      <div key={s.label} className={`p-3 rounded-lg bg-${s.color}-500/10 border border-${s.color}-500/20`}>
                        <p className="text-[10px] text-slate-400">{s.label}</p>
                        <p className={`font-black text-${s.color}-400 text-lg`}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Members Table */}
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Members</h4>
                  {selectedAssoc.members?.length > 0 ? (
                    <div className="rounded-lg border border-slate-800 overflow-hidden mb-4">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-800/50">
                          <tr>
                            {['Name', 'Phone', 'Share', 'Paid', 'Balance'].map(h => (
                              <th key={h} className="px-3 py-2 text-left text-slate-400 font-bold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {selectedAssoc.members.map((m, i) => (
                            <tr key={i} className="hover:bg-slate-800/30">
                              <td className="px-3 py-2 font-medium text-white">{m.name}</td>
                              <td className="px-3 py-2 text-slate-400">{m.phone}</td>
                              <td className="px-3 py-2 text-blue-400 font-bold">{formatCurrency(m.shareAmount)}</td>
                              <td className="px-3 py-2 text-emerald-400 font-bold">{formatCurrency(m.paidAmount)}</td>
                              <td className="px-3 py-2 font-bold" style={{ color: m.shareAmount - m.paidAmount > 0 ? '#f87171' : '#34d399' }}>
                                {formatCurrency(m.shareAmount - m.paidAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs py-4 text-center">No members yet</p>
                  )}

                  {/* Recent Transactions */}
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Recent Transactions</h4>
                  {selectedAssoc.transactions?.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedAssoc.transactions.slice(-10).reverse().map((tx, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                          <div className="flex items-center gap-2">
                            {tx.type === 'credit'
                              ? <ArrowDownCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                              : <ArrowUpCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
                            <div>
                              <p className="text-xs text-white">{tx.description}</p>
                              {tx.member && <p className="text-[10px] text-slate-500">{tx.member}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn('text-sm font-black', tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400')}>
                              {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </p>
                            <p className="text-[10px] text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs py-4 text-center">No transactions yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Add Association Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">New Association / সমিতি</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><label className="text-xs text-slate-400">Name *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. বাজার সমিতি" className="bg-slate-800 border-slate-700 text-white" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Monthly Contribution (৳)</label>
                <Input type="number" value={form.monthlyContribution} onChange={e => setForm({ ...form, monthlyContribution: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Description</label>
                <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-slate-700" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button className="flex-1 bg-primary text-white" disabled={createMutation.isPending}
                  onClick={() => {
                    if (!form.name) return toast.error('Name required');
                    createMutation.mutate({ ...form, monthlyContribution: Number(form.monthlyContribution) || 0 });
                  }}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && selectedAssoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-base">Add Member</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddMember(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-xs text-slate-400">Name *</label>
                  <Input value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
                <div className="space-y-1"><label className="text-xs text-slate-400">Phone</label>
                  <Input value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              </div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Share Amount (৳)</label>
                <Input type="number" value={memberForm.shareAmount} onChange={e => setMemberForm({ ...memberForm, shareAmount: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-slate-700" onClick={() => setShowAddMember(false)}>Cancel</Button>
                <Button className="flex-1 bg-primary text-white" disabled={addMemberMutation.isPending}
                  onClick={() => {
                    if (!memberForm.name) return toast.error('Name required');
                    addMemberMutation.mutate({ id: selectedAssoc._id, member: { ...memberForm, shareAmount: Number(memberForm.shareAmount) || 0 } });
                  }}>
                  {addMemberMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Add Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransaction && selectedAssoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-base">Record Transaction</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowTransaction(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                {['credit', 'debit'].map(t => (
                  <button key={t} onClick={() => setTxForm({ ...txForm, type: t })}
                    className={cn('flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-colors border',
                      txForm.type === t
                        ? t === 'credit' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-600 text-white border-red-600'
                        : 'border-slate-700 text-slate-400')}>
                    {t === 'credit' ? '+ Deposit' : '- Withdrawal'}
                  </button>
                ))}
              </div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Amount (৳) *</label>
                <Input type="number" value={txForm.amount} onChange={e => setTxForm({ ...txForm, amount: e.target.value })} className="bg-slate-800 border-slate-700 text-white text-lg font-bold" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Description *</label>
                <Input value={txForm.description} onChange={e => setTxForm({ ...txForm, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400">Member (optional)</label>
                <select value={txForm.member} onChange={e => setTxForm({ ...txForm, member: e.target.value })}
                  className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white">
                  <option value="">All Members</option>
                  {selectedAssoc.members?.map((m, i) => <option key={i} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 border-slate-700" onClick={() => setShowTransaction(false)}>Cancel</Button>
                <Button className="flex-1 bg-primary text-white" disabled={addTransactionMutation.isPending}
                  onClick={() => {
                    if (!txForm.amount || !txForm.description) return toast.error('Amount and description required');
                    addTransactionMutation.mutate({ id: selectedAssoc._id, tx: { ...txForm, amount: Number(txForm.amount), date: new Date() } });
                  }}>
                  {addTransactionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Confirm
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
