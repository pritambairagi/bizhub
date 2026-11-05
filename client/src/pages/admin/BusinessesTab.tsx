import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Building2, Eye, Edit, Trash2, RefreshCw, X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function BusinessesTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [viewTarget, setViewTarget] = useState<any | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-businesses', search, typeFilter, page],
    queryFn: () => adminApi.getBusinesses({ search: search || undefined, type: typeFilter || undefined, page, limit: 15 }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBusiness(id),
    onSuccess: () => { toast.success('Business deleted'); qc.invalidateQueries({ queryKey: ['admin-businesses'] }); setConfirmDelete(null); },
    onError: () => toast.error('Failed to delete business'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateBusiness(id, data),
    onSuccess: () => { toast.success('Business updated'); qc.invalidateQueries({ queryKey: ['admin-businesses'] }); setEditTarget(null); setViewTarget(null); },
    onError: () => toast.error('Failed to update business'),
  });

  const bizTypes = ['retail', 'wholesale', 'restaurant', 'pharmacy', 'franchise', 'marketplace'];
  const planColors: Record<string, string> = { free: 'bg-slate-100 text-slate-600', pro: 'bg-blue-100 text-blue-700', enterprise: 'bg-violet-100 text-violet-700' };
  const typeColors: Record<string, string> = { retail: 'bg-blue-50 text-blue-700', wholesale: 'bg-purple-50 text-purple-700', restaurant: 'bg-amber-50 text-amber-700', pharmacy: 'bg-emerald-50 text-emerald-700', franchise: 'bg-pink-50 text-pink-700', marketplace: 'bg-cyan-50 text-cyan-700' };
  const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', verified: 'bg-emerald-100 text-emerald-700', suspended: 'bg-red-100 text-red-700', rejected: 'bg-slate-100 text-slate-700' };

  return (
    <Card className="shadow-2xl border-none relative">
      <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2"><Building2 className="h-5 w-5" /> All Businesses</CardTitle>
            <CardDescription className="text-slate-400 mt-0.5">Total: {data?.total ?? '...'} registered businesses</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => refetch()} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Refresh</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Filters */}
        <div className="p-4 border-b bg-slate-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search businesses..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="h-10 px-3 rounded-md border border-input bg-white text-sm" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {bizTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        {/* View Modal */}
        {viewTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold">Business Details</h3>
                <Button variant="ghost" size="icon" onClick={() => setViewTarget(null)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                    {viewTarget.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{viewTarget.name}</h2>
                    <div className="flex gap-2 mt-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${statusColors[viewTarget.status ?? 'pending']}`}>{viewTarget.status ?? 'pending'}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${typeColors[viewTarget.type] ?? 'bg-slate-100 text-slate-600'}`}>{viewTarget.type}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Contact Info</p>
                    <p className="text-sm"><b>Email:</b> {viewTarget.contact?.email}</p>
                    <p className="text-sm"><b>Phone:</b> {viewTarget.contact?.phone}</p>
                    <p className="text-sm"><b>Address:</b> {viewTarget.contact?.address}, {viewTarget.contact?.thana}, {viewTarget.contact?.district}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Owner Info</p>
                    <p className="text-sm"><b>Name:</b> {viewTarget.owner?.profile?.firstName} {viewTarget.owner?.profile?.lastName}</p>
                    <p className="text-sm"><b>Email:</b> {viewTarget.owner?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Registration</p>
                    <p className="text-sm"><b>BIN:</b> {viewTarget.registration?.bin || 'N/A'}</p>
                    <p className="text-sm"><b>Trade License:</b> {viewTarget.registration?.tradeLicense || 'N/A'}</p>
                    <p className="text-sm"><b>Industry:</b> {viewTarget.industry || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Platform Details</p>
                    <p className="text-sm"><b>Plan:</b> <span className="uppercase font-bold">{viewTarget.subscription?.plan ?? 'free'}</span></p>
                    <p className="text-sm"><b>Joined:</b> {new Date(viewTarget.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {(viewTarget.status === 'pending' || !viewTarget.status) && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-bold text-amber-900">Verification Pending</p>
                        <p className="text-xs text-amber-700">This business cannot access the seller panel until verified.</p>
                      </div>
                    </div>
                    <Button onClick={() => updateMutation.mutate({ id: viewTarget._id, data: { status: 'verified' } })} disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold">Edit Business</h3>
                <Button variant="ghost" size="icon" onClick={() => setEditTarget(null)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Business Name</label>
                  <Input value={editTarget.name} onChange={e => setEditTarget({...editTarget, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Type</label>
                    <select className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm" value={editTarget.type} onChange={e => setEditTarget({...editTarget, type: e.target.value})}>
                      {bizTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Plan</label>
                    <select className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm uppercase" value={editTarget.subscription?.plan ?? 'free'} onChange={e => setEditTarget({...editTarget, subscriptionPlan: e.target.value})}>
                      <option value="free">FREE</option>
                      <option value="pro">PRO</option>
                      <option value="enterprise">ENTERPRISE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Verification Status</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm font-bold uppercase" value={editTarget.status ?? 'pending'} onChange={e => setEditTarget({...editTarget, status: e.target.value})}>
                    <option value="pending">PENDING</option>
                    <option value="verified">VERIFIED</option>
                    <option value="suspended">SUSPENDED</option>
                    <option value="rejected">REJECTED</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                  <Button onClick={() => updateMutation.mutate({ id: editTarget._id, data: { name: editTarget.name, type: editTarget.type, status: editTarget.status, subscriptionPlan: editTarget.subscriptionPlan } })} disabled={updateMutation.isPending}>Save Changes</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                {['Business', 'Status', 'Type', 'Contact', 'Owner', 'Plan', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">Loading businesses...</td></tr>
              )}
              {!isLoading && (data?.data as any[] || []).map((biz: any) => (
                <tr key={biz._id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {biz.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{biz.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{biz._id?.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${statusColors[biz.status ?? 'pending']}`}>{biz.status ?? 'pending'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${typeColors[biz.type] ?? 'bg-slate-100 text-slate-600'}`}>{biz.type}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-slate-700 font-medium">{biz.contact?.email}</p>
                    <p className="text-xs text-slate-400">{biz.contact?.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {(biz.owner as any)?.profile?.firstName} {(biz.owner as any)?.profile?.lastName}
                    <p className="text-xs text-slate-400">{(biz.owner as any)?.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${planColors[biz.subscription?.plan ?? 'free']}`}>{biz.subscription?.plan ?? 'free'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {confirmDelete === biz._id ? (
                        <>
                          <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(biz._id)} disabled={deleteMutation.isPending} className="text-[11px] h-7 px-2">Confirm</Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)} className="text-[11px] h-7 px-2">Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600" onClick={() => setViewTarget(biz)} title="View Details"><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-600" onClick={() => setEditTarget({...biz, subscriptionPlan: biz.subscription?.plan})} title="Edit Business"><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => setConfirmDelete(biz._id)} title="Delete Business"><Trash2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.data as any[] || []).length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No businesses found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.total ?? 0) > 15 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-slate-500">Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, data?.total)} of {data?.total}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page * 15 >= (data?.total ?? 0)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
