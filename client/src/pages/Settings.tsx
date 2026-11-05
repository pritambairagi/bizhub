import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { businessApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Save, User, Building, Bell, CreditCard, Shield, Globe, Palette,
  Check, Sun, Moon, Monitor, Eye, EyeOff, Lock, Loader2, Smartphone,
  Mail, Volume2, VolumeX, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';

const TABS = [
  { id:'business',      label:'Business',     icon:Building },
  { id:'profile',       label:'Profile',      icon:User },
  { id:'notifications', label:'Notifications',icon:Bell },
  { id:'billing',       label:'Billing',      icon:CreditCard },
  { id:'security',      label:'Security',     icon:Shield },
  { id:'localization',  label:'Localization', icon:Globe },
  { id:'appearance',    label:'Appearance',   icon:Palette },
];

const NOTIF_SETTINGS = [
  { id:'orderAlerts',     label:'New Order Alerts',       desc:'Get notified when a new order is placed', Icon:Bell },
  { id:'lowStock',        label:'Low Stock Alerts',       desc:'Alert when products are running low',     Icon:AlertTriangle },
  { id:'emailReports',    label:'Daily Email Reports',    desc:'Receive a daily business summary email',  Icon:Mail },
  { id:'smsAlerts',       label:'SMS Alerts',             desc:'Critical alerts via SMS',                 Icon:Smartphone },
  { id:'paymentAlerts',   label:'Payment Notifications',  desc:'Get notified on every payment received',  Icon:CreditCard },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('business');
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const { data: businessData } = useQuery({ queryKey:['business'], queryFn:()=>businessApi.get(), staleTime:5*60*1000 });
  const business = businessData?.data?.data;

  const [formData, setFormData] = useState({
    name:'', type:'retail', email:'', phone:'', address:'', district:'',
    currency:'BDT', timezone:'Asia/Dhaka', taxNumber:'', invoicePrefix:'INV',
  });

  const [notifications, setNotifications] = useState({
    orderAlerts:true, lowStock:true, emailReports:false, smsAlerts:false, paymentAlerts:true,
  });

  const [security, setSecurity] = useState({
    currentPassword:'', newPassword:'', confirmPassword:'',
    twoFactor:false, sessionTimeout:'30',
  });
  const [showPwd, setShowPwd] = useState({ current:false, new:false, confirm:false });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState('standard');
  const [payMethod, setPayMethod] = useState('bkash');
  const [txnId, setTxnId] = useState('');
  const [upgradeNotes, setUpgradeNotes] = useState('');

  const { data: billingRequestsData, refetch: refetchRequests } = useQuery({
    queryKey: ['business-billing-requests'],
    queryFn: () => businessApi.getBillingRequests().then(res => res.data.data),
    enabled: activeTab === 'billing' && !!business,
  });
  const billingRequests = billingRequestsData || [];

  const submitUpgrade = useMutation({
    mutationFn: (payload: any) => businessApi.upgradePlan(payload),
    onSuccess: () => {
      toast.success('Upgrade request submitted successfully!');
      setShowUpgradeModal(false);
      setTxnId('');
      setUpgradeNotes('');
      refetchRequests();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  });

  useEffect(() => {
    if (business) setFormData({
      name:       business.name||'',
      type:       business.type||'retail',
      email:      business.contact?.email||'',
      phone:      business.contact?.phone||'',
      address:    business.contact?.address||'',
      district:   business.contact?.district||'',
      currency:   business.settings?.currency||'BDT',
      timezone:   business.settings?.timezone||'Asia/Dhaka',
      taxNumber:  business.settings?.taxNumber||'',
      invoicePrefix:business.settings?.invoicePrefix||'INV',
    });
  }, [business]);

  const updateMutation = useMutation({
    mutationFn: (data:any) => businessApi.update({
      name:data.name, type:data.type,
      contact:{ email:data.email, phone:data.phone, address:data.address, district:data.district },
      settings:{ currency:data.currency, timezone:data.timezone, taxNumber:data.taxNumber, invoicePrefix:data.invoicePrefix },
    }),
    onSuccess: async(res)=>{
      const u=res.data.data;
      if(u) setFormData({ name:u.name||'', type:u.type||'retail', email:u.contact?.email||'', phone:u.contact?.phone||'', address:u.contact?.address||'', district:u.contact?.district||'', currency:u.settings?.currency||'BDT', timezone:u.settings?.timezone||'Asia/Dhaka', taxNumber:u.settings?.taxNumber||'', invoicePrefix:u.settings?.invoicePrefix||'INV' });
      await qc.invalidateQueries({queryKey:['business']});
      toast.success('Settings updated successfully');
    },
    onError:(e:any)=>toast.error(e.response?.data?.message||'Update failed'),
  });

  function handlePwdChange() {
    if (!security.currentPassword || !security.newPassword) { toast.error('Fill all password fields'); return; }
    if (security.newPassword !== security.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (security.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    toast.success('Password changed successfully');
    setSecurity(prev=>({...prev, currentPassword:'', newPassword:'', confirmPassword:''}));
  }

  const SectionCard = ({ title, desc, children }: { title:string; desc?:string; children:React.ReactNode }) => (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {desc && <CardDescription>{desc}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account, business &amp; preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-56 flex-shrink-0">
          <Card>
            <CardContent className="p-2">
              <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 scrollbar-hide">
                {TABS.map(tab=>(
                  <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                    className={cn('flex-shrink-0 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left',
                      activeTab===tab.id?'bg-primary text-white shadow-sm shadow-primary/30':'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}>
                    <tab.icon className="h-4 w-4 flex-shrink-0"/>
                    <span className="hidden lg:inline sm:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">

          {/* ── BUSINESS ── */}
          {activeTab==='business' && (
            <SectionCard title="Business Information" desc="Your core business details">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Business Name</label>
                    <Input value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Business Type</label>
                    <select className="w-full" value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})}>
                      {['retail','wholesale','restaurant','pharmacy','franchise','marketplace'].map(t=><option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email</label>
                    <Input type="email" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Phone</label>
                    <Input value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1 block">Address</label>
                    <Input value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">District</label>
                    <Input value={formData.district} onChange={e=>setFormData({...formData,district:e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">BIN / Tax Number</label>
                    <Input value={formData.taxNumber} onChange={e=>setFormData({...formData,taxNumber:e.target.value})} placeholder="Business Identification Number" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={()=>updateMutation.mutate(formData)} disabled={updateMutation.isPending} className="shadow-lg shadow-primary/20">
                    {updateMutation.isPending?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Saving…</>:<><Save className="h-4 w-4 mr-2"/>Save Changes</>}
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── PROFILE ── */}
          {activeTab==='profile' && (
            <SectionCard title="Profile Settings" desc="Manage your personal information">
              <div className="space-y-4">
                <div className="flex items-center gap-5">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl flex-shrink-0">
                    {user?.profile?.firstName?.[0]||user?.email?.[0]||'U'}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">Change Photo</Button>
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG. Max 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">First Name</label>
                    <Input defaultValue={user?.profile?.firstName||''} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Last Name</label>
                    <Input defaultValue={user?.profile?.lastName||''} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1 block">Email</label>
                    <Input defaultValue={user?.email||''} disabled className="opacity-60" />
                    <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button className="shadow-lg shadow-primary/20" onClick={()=>toast.success('Profile updated')}>
                    <Save className="h-4 w-4 mr-2"/>Save Profile
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab==='notifications' && (
            <SectionCard title="Notification Preferences" desc="Control how and when you receive alerts">
              <div className="space-y-3">
                {NOTIF_SETTINGS.map(n=>(
                  <div key={n.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <n.Icon className="h-5 w-5 text-primary"/>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{n.label}</p>
                        <p className="text-xs text-muted-foreground">{n.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={()=>setNotifications(prev=>({...prev,[n.id]:!prev[n.id as keyof typeof prev]}))}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none flex-shrink-0',
                        notifications[n.id as keyof typeof notifications] ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                    >
                      <span className={cn(
                        'inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform',
                        notifications[n.id as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                      )}/>
                    </button>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button className="shadow-lg shadow-primary/20" onClick={()=>toast.success('Notification preferences saved')}>
                    <Save className="h-4 w-4 mr-2"/>Save Preferences
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── BILLING ── */}
          {activeTab==='billing' && (
            <div className="space-y-6">
              <SectionCard title="Current Subscription Plan" desc="Your business package details">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <CreditCard className="h-7 w-7 text-primary"/>
                    </div>
                    <div>
                      <p className="font-extrabold text-xl text-white capitalize">{business?.subscription?.plan || 'Free Plan'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Expires: {business?.subscription?.endDate ? new Date(business.subscription.endDate).toLocaleDateString('en-GB') : 'Never'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right sm:text-right text-left">
                    <p className="text-2xl font-black text-white">
                      {business?.subscription?.plan === 'professional' ? '৳2,499/mo' : business?.subscription?.plan === 'standard' ? '৳999/mo' : '৳0/mo'}
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" /> Active
                    </span>
                  </div>
                </div>
              </SectionCard>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Plan Quotas */}
                <SectionCard title="Plan Quotas" desc="Limits based on current package">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        <span>Products Inventory</span>
                        <span>
                          {business?.subscription?.plan === 'professional' ? 'Unlimited' : business?.subscription?.plan === 'standard' ? 'Max 1000' : 'Max 100'}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: business?.subscription?.plan === 'professional' ? '100%' : business?.subscription?.plan === 'standard' ? '38%' : '80%'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        <span>Employees Accounts</span>
                        <span>
                          {business?.subscription?.plan === 'professional' ? 'Unlimited' : business?.subscription?.plan === 'standard' ? 'Max 15' : 'Max 3'}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700/50">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{
                            width: business?.subscription?.plan === 'professional' ? '100%' : business?.subscription?.plan === 'standard' ? '25%' : '67%'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Upgrade Package */}
                <SectionCard title="Upgrade Subscription" desc="Submit payment to request package upgrade">
                  <div className="flex flex-col h-full justify-between pb-2">
                    <p className="text-sm text-slate-300">
                      Need higher capacity, more employees or advanced inventory? Upgrade to Standard or Professional plan to unlock limits.
                    </p>
                    <Button onClick={() => setShowUpgradeModal(true)} className="mt-4 w-full bg-primary hover:bg-primary/95 text-white font-bold py-2.5">
                      Upgrade Subscription Plan
                    </Button>
                  </div>
                </SectionCard>
              </div>

              {/* Billing Requests History */}
              <SectionCard title="Upgrade Request Status Tracker" desc="Verify and track submitted payments">
                {billingRequests.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-4">No subscription requests submitted yet.</p>
                ) : (
                  <div className="rounded-xl border border-slate-850 overflow-hidden bg-slate-900/40">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-800/60 uppercase font-black text-slate-400 tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Requested Plan</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Method / Txn ID</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Requested At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {billingRequests.map((r: any) => (
                          <tr key={r._id} className="hover:bg-slate-800/20">
                            <td className="px-4 py-3 font-bold text-white capitalize">{r.requestedPlan} Plan</td>
                            <td className="px-4 py-3 text-slate-300">৳{r.amount}</td>
                            <td className="px-4 py-3 font-mono">
                              <span className="text-slate-400 font-bold uppercase">{r.paymentMethod}</span> — {r.transactionId}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                r.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                r.status === 'rejected' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              )}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-400">
                              {new Date(r.createdAt).toLocaleDateString('en-GB')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>

              {/* Upgrade Request Modal */}
              {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-lg bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-800 pb-4">
                      <CardTitle className="text-xl font-bold text-white">Upgrade Subscription Plan</CardTitle>
                      <CardDescription className="text-slate-400">Follow payment instructions and input credentials below</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6 max-h-[75vh] overflow-y-auto">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Plan</label>
                        <select
                          className="mt-1.5 w-full bg-slate-800 border-slate-700 text-white rounded-lg p-2.5"
                          value={upgradePlan}
                          onChange={(e) => setUpgradePlan(e.target.value)}
                        >
                          <option value="standard">Standard Plan (Max 1000 Products, 15 Employees) — ৳999/mo</option>
                          <option value="professional">Professional Plan (Unlimited Products &amp; Employees) — ৳2,499/mo</option>
                        </select>
                      </div>

                      {/* Payment Instructions Card */}
                      <div className="p-4 rounded-xl bg-slate-850 border border-slate-700/50 space-y-2 text-sm">
                        <p className="font-bold text-slate-200">How to pay:</p>
                        <div className="space-y-1 text-xs text-slate-300">
                          <p>● <span className="font-bold text-white">bKash (Personal):</span> Send Money to <span className="text-primary font-mono font-bold">01700000000</span> (Reference: <span className="italic">{business?.name}</span>)</p>
                          <p>● <span className="font-bold text-white">Nagad (Personal):</span> Send Money to <span className="text-amber-500 font-mono font-bold">01800000000</span> (Reference: <span className="italic">{business?.name}</span>)</p>
                          <p>● <span className="font-bold text-white">Bank Transfer:</span> DBBL A/C <span className="text-white font-mono">123-4567-890</span> (BizHub ERP Ltd.)</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Method</label>
                          <select
                            className="mt-1.5 w-full bg-slate-800 border-slate-700 text-white rounded-lg p-2.5"
                            value={payMethod}
                            onChange={(e) => setPayMethod(e.target.value)}
                          >
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                            <option value="bank">Bank Transfer</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Transaction ID *</label>
                          <Input
                            placeholder="e.g. A1B2C3D4"
                            className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                            value={txnId}
                            onChange={(e) => setTxnId(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Notes / Remarks</label>
                        <Input
                          placeholder="Any specific note..."
                          className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                          value={upgradeNotes}
                          onChange={(e) => setUpgradeNotes(e.target.value)}
                        />
                      </div>

                      <div className="flex gap-3 pt-6 border-t border-slate-800">
                        <Button variant="outline" className="flex-1 border-slate-800 bg-slate-900 text-slate-300" onClick={() => setShowUpgradeModal(false)}>
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-primary hover:bg-primary/95 text-white"
                          disabled={submitUpgrade.isPending}
                          onClick={() => {
                            if (!txnId) { toast.error('Transaction ID is required'); return; }
                            const amount = upgradePlan === 'professional' ? 2499 : 999;
                            submitUpgrade.mutate({
                              requestedPlan: upgradePlan,
                              amount,
                              paymentMethod: payMethod,
                              transactionId: txnId,
                              notes: upgradeNotes
                            });
                          }}
                        >
                          Submit Payment Info
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab==='security' && (
            <div className="space-y-4">
              <SectionCard title="Change Password" desc="Use a strong password to keep your account secure">
                <div className="space-y-4">
                  {([
                    {key:'currentPassword',label:'Current Password'},
                    {key:'newPassword',    label:'New Password'},
                    {key:'confirmPassword',label:'Confirm New Password'},
                  ] as const).map(f=>(
                    <div key={f.key}>
                      <label className="text-sm font-medium mb-1 block">{f.label}</label>
                      <div className="relative">
                        <Input
                          type={showPwd[f.key as keyof typeof showPwd]?'text':'password'}
                          value={security[f.key]}
                          onChange={e=>setSecurity({...security,[f.key]:e.target.value})}
                          placeholder="••••••••"
                          className="pr-10"
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={()=>setShowPwd(prev=>({...prev,[f.key]:!prev[f.key as keyof typeof prev]}))}>
                          {showPwd[f.key as keyof typeof showPwd]?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button onClick={handlePwdChange} className="shadow-lg shadow-primary/20">
                      <Lock className="h-4 w-4 mr-2"/>Change Password
                    </Button>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="Two-Factor Authentication" desc="Add an extra layer of security to your account">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Authenticator App</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Use Google Authenticator or similar</p>
                  </div>
                  <button
                    onClick={()=>{ setSecurity(prev=>({...prev,twoFactor:!prev.twoFactor})); toast.success(security.twoFactor?'2FA disabled':'2FA enabled'); }}
                    className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', security.twoFactor?'bg-primary':'bg-muted-foreground/30')}>
                    <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform', security.twoFactor?'translate-x-6':'translate-x-1')}/>
                  </button>
                </div>
              </SectionCard>
              <SectionCard title="Session &amp; Access">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Auto-Logout (minutes)</label>
                    <select className="w-full sm:w-48" value={security.sessionTimeout} onChange={e=>setSecurity({...security,sessionTimeout:e.target.value})}>
                      {['15','30','60','120','never'].map(v=><option key={v} value={v}>{v==='never'?'Never':v+' min'}</option>)}
                    </select>
                  </div>
                  <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={()=>toast.success('All other sessions revoked')}>
                    <RefreshCw className="h-4 w-4 mr-2"/>Revoke All Other Sessions
                  </Button>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── LOCALIZATION ── */}
          {activeTab==='localization' && (
            <SectionCard title="Localization" desc="Regional, language and format settings">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Currency</label>
                    <select className="w-full" value={formData.currency} onChange={e=>setFormData({...formData,currency:e.target.value})}>
                      <option value="BDT">BDT — Bangladeshi Taka (৳)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                      <option value="INR">INR — Indian Rupee (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Timezone</label>
                    <select className="w-full" value={formData.timezone} onChange={e=>setFormData({...formData,timezone:e.target.value})}>
                      <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                      <option value="UTC">UTC (GMT+0)</option>
                      <option value="America/New_York">America/New_York (GMT-5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Invoice Prefix</label>
                    <Input value={formData.invoicePrefix} onChange={e=>setFormData({...formData,invoicePrefix:e.target.value})} placeholder="INV" className="font-mono" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={()=>updateMutation.mutate(formData)} disabled={updateMutation.isPending} className="shadow-lg shadow-primary/20">
                    {updateMutation.isPending?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Saving…</>:<><Save className="h-4 w-4 mr-2"/>Save Localization</>}
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ── APPEARANCE ── */}
          {activeTab==='appearance' && (
            <div className="space-y-4">
              <SectionCard title="Theme Mode" desc="Customize how the dashboard looks">
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id:'light',  label:'Light',  Icon:Sun },
                    { id:'dark',   label:'Dark',   Icon:Moon },
                    { id:'system', label:'System', Icon:Monitor },
                  ] as const).map(opt=>(
                    <button key={opt.id} onClick={()=>{ setTheme(opt.id); toast.success(`${opt.label} theme enabled`); }}
                      className={cn('flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all',
                        theme===opt.id?'border-primary bg-primary/5':'border-border hover:border-primary/40'
                      )}>
                      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', theme===opt.id?'bg-primary text-white':'bg-muted text-muted-foreground')}>
                        <opt.Icon className="h-5 w-5"/>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-sm font-semibold', theme===opt.id?'text-primary':'')}>{opt.label}</span>
                        {theme===opt.id&&<Check className="h-3.5 w-3.5 text-primary"/>}
                      </div>
                    </button>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Accent Color" desc="Choose your primary brand color">
                <div className="flex flex-wrap gap-4">
                  {[
                    { color:'#0a7569', label:'Teal (Default)' },
                    { color:'#7c3aed', label:'Violet' },
                    { color:'#2563eb', label:'Blue' },
                    { color:'#dc2626', label:'Red' },
                    { color:'#ea580c', label:'Orange' },
                    { color:'#059669', label:'Green' },
                  ].map(c=>(
                    <button key={c.color} title={c.label} className="group flex flex-col items-center gap-2">
                      <div className="h-11 w-11 rounded-full border-4 border-background shadow-md ring-2 ring-transparent group-hover:ring-muted-foreground/30 transition-all" style={{backgroundColor:c.color}}/>
                      <span className="text-[10px] text-muted-foreground">{c.label}</span>
                    </button>
                  ))}
                </div>
              </SectionCard>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}