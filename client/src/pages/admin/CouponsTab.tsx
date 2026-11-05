import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Tag, Calendar, Percent, DollarSign, ToggleLeft, ToggleRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMPTY_FORM = {
  code: '', description: '', type: 'percentage', value: 10,
  minOrderAmount: 0, maxDiscountAmount: '', usageLimit: 100,
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  isActive: true,
};

export default function CouponsTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/coupons').then(r => r.data.data),
  });
  const coupons = data || [];

  const saveMut = useMutation({
    mutationFn: (payload: any) =>
      editId ? api.put(`/coupons/${editId}`, payload) : api.post('/coupons', payload),
    onSuccess: () => {
      toast.success(editId ? 'Coupon updated!' : 'Coupon created!');
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save coupon'),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => { toast.success('Coupon deleted'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); },
    onError: () => toast.error('Failed to delete coupon'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/coupons/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const openEdit = (c: any) => {
    setEditId(c._id);
    setForm({
      code: c.code, description: c.description || '', type: c.type, value: c.value,
      minOrderAmount: c.minOrderAmount, maxDiscountAmount: c.maxDiscountAmount || '',
      usageLimit: c.usageLimit,
      validFrom: c.validFrom?.slice(0, 10),
      validUntil: c.validUntil?.slice(0, 10),
      isActive: c.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.code || !form.validUntil) { toast.error('Code and Valid Until are required'); return; }
    saveMut.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Coupon & Voucher Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Create and manage discount codes for POS and online orders</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); }}
          className="bg-primary text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> New Coupon
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 text-base">{editId ? 'Edit Coupon' : 'Create New Coupon'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Coupon Code *</label>
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. SAVE20" className="font-mono font-bold uppercase" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Description</label>
              <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. 20% off on all orders" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Discount Type</label>
              <div className="flex rounded-lg border overflow-hidden h-10">
                <button onClick={() => set('type', 'percentage')} className={cn("flex-1 flex items-center justify-center gap-2 text-sm font-bold transition-colors", form.type === 'percentage' ? "bg-primary text-white" : "bg-white text-slate-500")}>
                  <Percent className="h-4 w-4" /> Percentage
                </button>
                <button onClick={() => set('type', 'fixed')} className={cn("flex-1 flex items-center justify-center gap-2 text-sm font-bold transition-colors", form.type === 'fixed' ? "bg-primary text-white" : "bg-white text-slate-500")}>
                  <DollarSign className="h-4 w-4" /> Fixed (৳)
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Discount Value</label>
              <Input type="number" min={0} value={form.value} onChange={e => set('value', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Min Order Amount (৳)</label>
              <Input type="number" min={0} value={form.minOrderAmount} onChange={e => set('minOrderAmount', Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Max Discount Cap (৳, optional)</label>
              <Input type="number" min={0} value={form.maxDiscountAmount} onChange={e => set('maxDiscountAmount', e.target.value ? Number(e.target.value) : '')} placeholder="No cap" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Usage Limit</label>
              <Input type="number" min={1} value={form.usageLimit} onChange={e => set('usageLimit', Number(e.target.value))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
              <button onClick={() => set('isActive', !form.isActive)}
                className={cn("flex items-center gap-2 px-4 h-10 rounded-lg border font-bold text-sm transition-all", form.isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500")}>
                {form.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                {form.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Valid From</label>
              <Input type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Valid Until *</label>
              <Input type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</Button>
            <Button className="flex-1 bg-primary text-white font-bold" onClick={handleSubmit} disabled={saveMut.isPending}>
              {saveMut.isPending ? 'Saving...' : editId ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" /></div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Tag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">No coupons created yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first coupon to start offering discounts</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider border-b">
              <tr>
                <th className="px-5 py-4">Code</th>
                <th className="px-5 py-4">Type / Value</th>
                <th className="px-5 py-4">Usage</th>
                <th className="px-5 py-4">Min Order</th>
                <th className="px-5 py-4">Valid Until</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((c: any) => (
                <tr key={c._id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg text-xs">{c.code}</span>
                    {c.description && <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-700">
                    {c.type === 'percentage' ? `${c.value}%` : `৳${c.value}`}
                    {c.maxDiscountAmount ? <span className="text-[10px] text-slate-400 block">Max ৳{c.maxDiscountAmount}</span> : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-20">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min((c.usedCount / c.usageLimit) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{c.usedCount}/{c.usageLimit}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">৳{c.minOrderAmount || 0}</td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(c.validUntil).toLocaleDateString('en-GB')}</div>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleMut.mutate({ id: c._id, isActive: !c.isActive })}
                      className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors",
                        c.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      )}>
                      {c.isActive ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                      {c.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEdit(c)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200" variant="outline"
                        onClick={() => { if (confirm('Delete this coupon?')) delMut.mutate(c._id); }}>
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
    </div>
  );
}
