import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Save, Settings2, Globe, Lock, Mail, Bell, Store, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function PlatformSettingsTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-platform-settings'],
    queryFn: () => adminApi.getPlatformSettings().then(r => r.data.data),
  });

  const [form, setForm] = useState<any>(null);
  if (data && !form) setForm({ ...data });

  const mut = useMutation({
    mutationFn: (d: any) => adminApi.updatePlatformSettings(d),
    onSuccess: () => { toast.success('Platform settings saved'); refetch(); },
    onError: () => toast.error('Failed to save settings'),
  });

  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  if (isLoading || !form) {
    return <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading platform settings...</div>;
  }

  const SectionCard = ({ title, desc, icon: Icon, children }: { title: string; desc: string; icon: any; children: React.ReactNode }) => (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl"><Icon className="h-5 w-5 text-primary" /></div>
          <div><CardTitle className="text-base font-bold">{title}</CardTitle><CardDescription className="text-xs mt-0.5">{desc}</CardDescription></div>
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-4">{children}</CardContent>
    </Card>
  );

  const Toggle = ({ label, desc, field }: { label: string; desc: string; field: string }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <button
        onClick={() => set(field, !form[field])}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${form[field] ? 'bg-primary' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-5 w-5 mt-0.5 ml-0.5 transform rounded-full bg-white shadow transition-transform duration-200 ${form[field] ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Maintenance Banner */}
      {form.maintenance && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm font-medium">⚠️ Maintenance mode is <strong>ON</strong> — the platform is inaccessible to users.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <SectionCard title="General Settings" desc="Core platform configuration" icon={Settings2}>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Support Email</label>
            <Input value={form.supportEmail} onChange={e => set('supportEmail', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Support Phone</label>
            <Input value={form.supportPhone} onChange={e => set('supportPhone', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Platform Version</label>
            <Input value={form.platformVersion} onChange={e => set('platformVersion', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Default Subscription Plan</label>
            <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.defaultSubscriptionPlan} onChange={e => set('defaultSubscriptionPlan', e.target.value)}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </SectionCard>

        {/* Access Control */}
        <SectionCard title="Access & Registration" desc="Control who can register and access the platform" icon={Lock}>
          <Toggle label="Maintenance Mode" desc="Puts platform in read-only maintenance state" field="maintenance" />
          <Toggle label="Open Registration" desc="Allow new businesses to self-register" field="registrationOpen" />
          <Toggle label="Email Verification Required" desc="Users must verify email to access" field="emailVerificationRequired" />
          <div className="pt-2">
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Max Businesses Per User</label>
            <Input type="number" min={1} max={100} value={form.maxBusinessesPerUser} onChange={e => set('maxBusinessesPerUser', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Minimum Password Length</label>
            <Input type="number" min={6} max={32} value={form.minPasswordLength} onChange={e => set('minPasswordLength', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Session Timeout (minutes)</label>
            <Input type="number" min={15} max={10080} value={form.sessionTimeoutMinutes} onChange={e => set('sessionTimeoutMinutes', parseInt(e.target.value))} />
          </div>
        </SectionCard>

        {/* Legal & Versioning */}
        <SectionCard title="Legal & Compliance" desc="Terms, privacy and documentation versions" icon={Globe}>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Terms of Service Version</label>
            <Input value={form.termsVersion} onChange={e => set('termsVersion', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Privacy Policy Version</label>
            <Input value={form.privacyVersion} onChange={e => set('privacyVersion', e.target.value)} />
          </div>
          <Toggle label="Number Verification Required" desc="Users must verify phone number to access" field="numberVerificationRequired" />
        </SectionCard>

        {/* Developer & Platform Aesthetics */}
        <SectionCard title="Developer & Customization" desc="Marquee, notices and contact info" icon={Store}>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Marquee Message</label>
            <Input value={form.marqueeMessage} onChange={e => set('marqueeMessage', e.target.value)} placeholder="e.g. Welcome to BizHub Platform!" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Developer Notice / Bulletin</label>
            <Input value={form.developerNotice} onChange={e => set('developerNotice', e.target.value)} placeholder="Important admin announcements..." />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Location Text</label>
            <Input value={form.locationText} onChange={e => set('locationText', e.target.value)} placeholder="Dhaka, Bangladesh" />
          </div>
        </SectionCard>

        {/* Financial Settings */}
        <SectionCard title="Global Financial Settings" desc="Service charges, tax and delivery" icon={Settings2}>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Service Charge (%)</label>
            <Input type="number" min={0} value={form.serviceCharge} onChange={e => set('serviceCharge', parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Delivery Charge (Fixed)</label>
            <Input type="number" min={0} value={form.deliveryCharge} onChange={e => set('deliveryCharge', parseFloat(e.target.value))} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase mb-1.5 block">Default Tax/VAT Rate (%)</label>
            <Input type="number" min={0} value={form.defaultTaxRate} onChange={e => set('defaultTaxRate', parseFloat(e.target.value))} />
          </div>
          <Toggle label="Global Tax Enabled" desc="Apply default tax to all transactions" field="taxEnabled" />
        </SectionCard>

        {/* Business Types */}
        <SectionCard title="Allowed Business Types" desc="Types of businesses that can register" icon={Store}>
          <div className="grid grid-cols-2 gap-2">
            {['retail','wholesale','restaurant','pharmacy','franchise','marketplace'].map(t => (
              <label key={t} className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={(form.allowedBusinessTypes as string[] || []).includes(t)}
                  onChange={e => {
                    const cur = form.allowedBusinessTypes as string[] || [];
                    set('allowedBusinessTypes', e.target.checked ? [...cur, t] : cur.filter((x: string) => x !== t));
                  }}
                  className="h-4 w-4 rounded accent-primary"
                />
                <span className="text-sm font-medium capitalize">{t}</span>
              </label>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={() => mut.mutate(form)} disabled={mut.isPending} className="gap-2 px-8 h-11 text-base">
          <Save className="h-4 w-4" />
          {mut.isPending ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
