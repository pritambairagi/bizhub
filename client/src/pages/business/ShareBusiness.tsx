import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { businessApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Plus, Users, Edit, Trash2, PieChart, DollarSign,
  X, Loader2, TrendingUp, User, Mail, Phone
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const PARTNER_ROLES = ['Managing Partner','Silent Partner','Investor','Co-founder','Shareholder','Director','Advisor'];

const EMPTY_FORM = {
  partnerName: '', email: '', phone: '',
  sharePercentage: 0, investmentAmount: 0,
  role: 'Partner', status: 'active', notes: '',
};

export default function ShareBusiness() {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [formData, setFormData]   = useState(EMPTY_FORM);
  const [errors, setErrors]       = useState<Record<string,string>>({});
  const qc = useQueryClient();

  const { data: sharesData, isLoading } = useQuery({
    queryKey: ['business-shares'],
    queryFn: () => businessApi.getShares(),
    staleTime: 60000,
  });

  const shares: any[] = sharesData?.data?.data || [];
  const totalShares    = shares.reduce((a,s)=>a+(s.sharePercentage||0),0);
  const totalCapital   = shares.reduce((a,s)=>a+(s.investmentAmount||0),0);
  const remaining      = 100 - totalShares;

  const saveMutation = useMutation({
    mutationFn: (data: any) => editingId ? businessApi.updateShare(editingId,data) : businessApi.createShare(data),
    onSuccess: () => { qc.invalidateQueries({queryKey:['business-shares']}); toast.success(editingId?'Partner updated':'Partner registered'); closeModal(); },
    onError: (e:any) => toast.error(e.response?.data?.message||'Failed'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id:string) => businessApi.deleteShare(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['business-shares']}); toast.success('Partner removed'); },
    onError: (e:any) => toast.error(e.response?.data?.message||'Failed'),
  });

  function validate() {
    const err: Record<string,string> = {};
    if (!formData.partnerName.trim()) err.partnerName = 'Name is required';
    if (!formData.phone.trim())       err.phone       = 'Phone is required';
    if (formData.sharePercentage<=0)  err.share       = 'Share % must be > 0';
    const allowable = remaining + (editingId ? (shares.find(s=>s._id===editingId)?.sharePercentage||0) : 0);
    if (formData.sharePercentage > allowable) err.share = `Only ${allowable.toFixed(1)}% remaining`;
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  function openAdd()  { setEditingId(null); setFormData(EMPTY_FORM); setErrors({}); setShowModal(true); }
  function openEdit(s:any) {
    setEditingId(s._id);
    setFormData({ partnerName:s.partnerName, email:s.email||'', phone:s.phone||'', sharePercentage:s.sharePercentage||0, investmentAmount:s.investmentAmount||0, role:s.role||'Partner', status:s.status||'active', notes:s.notes||'' });
    setErrors({});
    setShowModal(true);
  }
  function closeModal() { setShowModal(false); setEditingId(null); }
  function handleSubmit() { if(validate()) saveMutation.mutate(formData); }

  // Equity ring segments
  const ringSize = 120;
  const strokeW  = 14;
  const r        = (ringSize - strokeW) / 2;
  const circ     = 2 * Math.PI * r;
  let offset     = 0;
  const colors   = ['#0a7569','#7c3aed','#f59e0b','#ef4444','#3b82f6','#ec4899'];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Business Sharing</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Manage partners, equity distribution &amp; capital</p>
        </div>
        <Button onClick={openAdd} className="gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto" disabled={remaining<=0&&!editingId}>
          <Plus className="h-4 w-4"/>Add Partner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label:'Equity Distributed', value:`${totalShares.toFixed(1)}%`,      Icon:PieChart,    color:'bg-primary/10 text-primary' },
          { label:'Total Capital',       value:formatCurrency(totalCapital),       Icon:DollarSign,  color:'bg-emerald-500/10 text-emerald-600' },
          { label:'Active Partners',     value:shares.filter(s=>s.status!=='inactive').length, Icon:Users, color:'bg-blue-500/10 text-blue-600' },
        ].map(s=>(
          <Card key={s.label} className="stat-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0',s.color)}>
                <s.Icon className="h-6 w-6"/>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Ring */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Equity Distribution</CardTitle>
            <CardDescription>{remaining.toFixed(1)}% available</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {shares.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <PieChart className="h-16 w-16 opacity-20"/>
              </div>
            ) : (
              <svg width={ringSize} height={ringSize} className="-rotate-90">
                <circle cx={ringSize/2} cy={ringSize/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeW}/>
                {shares.map((s,i)=>{
                  const pct = (s.sharePercentage/100)*circ;
                  const el = (
                    <circle key={s._id} cx={ringSize/2} cy={ringSize/2} r={r} fill="none"
                      stroke={colors[i%colors.length]} strokeWidth={strokeW}
                      strokeDasharray={`${pct} ${circ}`} strokeDashoffset={-offset}
                      strokeLinecap="round"/>
                  );
                  offset += pct;
                  return el;
                })}
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="rotate-90" style={{fill:'hsl(var(--foreground))',fontSize:18,fontWeight:700,transform:`rotate(90deg) translateY(${-ringSize/2}px) translateX(${ringSize/2}px)`}}>
                </text>
              </svg>
            )}
            <div className="w-full space-y-2">
              {shares.map((s,i)=>(
                <div key={s._id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{backgroundColor:colors[i%colors.length]}}/>
                    <span className="truncate max-w-[130px] font-medium">{s.partnerName}</span>
                  </div>
                  <span className="font-bold text-primary">{s.sharePercentage}%</span>
                </div>
              ))}
              {remaining > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-muted flex-shrink-0"/>
                    <span>Unallocated</span>
                  </div>
                  <span>{remaining.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Partners Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Shareholders &amp; Partners</CardTitle>
            <CardDescription>All individuals holding equity in this business</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-16 skeleton rounded-xl"/>)}</div>
            ) : shares.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <Users className="h-12 w-12 text-muted-foreground opacity-20"/>
                <p className="text-muted-foreground">No partners registered yet</p>
                <Button onClick={openAdd} className="gap-2"><Plus className="h-4 w-4"/>Add Partner</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Partner</th><th>Role</th>
                      <th className="text-right">Share</th>
                      <th className="text-right">Investment</th>
                      <th>Status</th><th>Joined</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shares.map((s:any, i:number)=>(
                      <tr key={s._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{backgroundColor:colors[i%colors.length]}}>
                              {s.partnerName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{s.partnerName}</p>
                              <p className="text-xs text-muted-foreground">{s.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-info text-[10px]">{s.role}</span></td>
                        <td className="text-right">
                          <span className="font-bold text-primary text-base">{s.sharePercentage}%</span>
                        </td>
                        <td className="text-right font-semibold">{formatCurrency(s.investmentAmount||0)}</td>
                        <td>
                          <span className={cn('badge text-[10px] font-bold uppercase', s.status==='inactive'?'badge-danger':'badge-success')}>
                            {s.status||'active'}
                          </span>
                        </td>
                        <td className="text-muted-foreground text-xs">{s.joinedDate?formatDate(s.joinedDate):'-'}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={()=>openEdit(s)}><Edit className="h-3.5 w-3.5"/></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={()=>{if(confirm('Remove this partner?'))deleteMutation.mutate(s._id)}}><Trash2 className="h-3.5 w-3.5"/></Button>
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full bg-card border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">{editingId?'Edit Partner':'Register Partner'}</h3>
              <Button variant="ghost" size="icon" onClick={closeModal}><X className="h-4 w-4"/></Button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
              <div>
                <label className="text-sm font-medium mb-1 block">Partner Full Name <span className="text-destructive">*</span></label>
                <Input value={formData.partnerName} onChange={e=>setFormData({...formData,partnerName:e.target.value})} placeholder="Full name" className={errors.partnerName?'border-destructive':''} />
                {errors.partnerName&&<p className="text-xs text-destructive mt-1">{errors.partnerName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone <span className="text-destructive">*</span></label>
                  <Input value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} placeholder="01XXXXXXXXX" className={errors.phone?'border-destructive':''} />
                  {errors.phone&&<p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input type="email" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Share % <span className="text-destructive">*</span></label>
                  <Input type="number" min="0" max="100" value={formData.sharePercentage||''} onChange={e=>setFormData({...formData,sharePercentage:Number(e.target.value)})} className={errors.share?'border-destructive':''} />
                  {errors.share&&<p className="text-xs text-destructive mt-1">{errors.share}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Available: {remaining.toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Investment (৳)</label>
                  <Input type="number" min="0" value={formData.investmentAmount||''} onChange={e=>setFormData({...formData,investmentAmount:Number(e.target.value)})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Role / Responsibility</label>
                  <select className="w-full" value={formData.role} onChange={e=>setFormData({...formData,role:e.target.value})}>
                    {PARTNER_ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <select className="w-full" value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
                <Input value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})} placeholder="Agreement details, remarks…" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1 shadow-lg shadow-primary/20" onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Saving…</>:editingId?'Update Partner':'Register Partner'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
