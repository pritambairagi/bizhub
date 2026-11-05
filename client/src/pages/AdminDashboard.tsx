import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Globe, Activity, Building2, Users, Shield, Settings2, LayoutDashboard, ChevronRight, CreditCard, Tag } from 'lucide-react';
import OverviewTab from './admin/OverviewTab';
import BusinessesTab from './admin/BusinessesTab';
import UsersTab from './admin/UsersTab';
import RolesTab from './admin/RolesTab';
import PlatformSettingsTab from './admin/PlatformSettingsTab';
import BillingRequestsTab from './admin/BillingRequestsTab';
import CouponsTab from './admin/CouponsTab';
import PlansTab from './admin/PlansTab';

type Tab = 'overview' | 'businesses' | 'users' | 'roles' | 'billing' | 'plans' | 'coupons' | 'settings';

const TABS: { id: Tab; label: string; icon: any; desc: string }[] = [
  { id: 'overview',    label: 'Overview',         icon: LayoutDashboard, desc: 'Global stats & health' },
  { id: 'businesses',  label: 'Businesses',        icon: Building2,       desc: 'Manage all businesses' },
  { id: 'users',       label: 'Users',             icon: Users,           desc: 'Manage all users' },
  { id: 'roles',       label: 'Roles & Perms',     icon: Shield,          desc: 'Role permission matrix' },
  { id: 'billing',     label: 'Billing Requests',  icon: CreditCard,      desc: 'Approve & track upgrades' },
  { id: 'plans',       label: 'Plans & Limits',    icon: Settings2,       desc: 'Configure pricing & limits' },
  { id: 'coupons',     label: 'Coupons',           icon: Tag,             desc: 'Manage discount coupons' },
  { id: 'settings',    label: 'Platform Settings', icon: Settings2,       desc: 'Global configuration' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: health } = useQuery({
    queryKey: ['admin-health-badge'],
    queryFn: () => adminApi.getSystemHealth().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats-badge'],
    queryFn: () => adminApi.getStats().then(r => r.data.data),
  });

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-5 mb-6 -mx-6 -mt-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">BizHub ERP</span>
                  <ChevronRight className="h-3 w-3 text-slate-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-primary">Super Admin</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Global Control Center</h1>
                <p className="text-slate-400 text-sm mt-0.5">Full system visibility and control across all businesses</p>
              </div>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-slate-400">Businesses</p>
                <p className="text-xl font-black text-white">{stats?.totalBusinesses ?? '—'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                <p className="text-[10px] uppercase font-bold text-slate-400">Users</p>
                <p className="text-xl font-black text-white">{stats?.totalUsers ?? '—'}</p>
              </div>
              <div className={`backdrop-blur-sm rounded-xl px-4 py-2.5 border ${health?.status === 'healthy' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                <p className="text-[10px] uppercase font-bold text-slate-400">System</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`h-2 w-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <p className="text-sm font-bold text-white capitalize">{health?.status ?? 'Checking...'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Nav */}
          <nav className="flex gap-1 mt-6 overflow-x-auto pb-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 text-sm text-slate-500">
        <Globe className="h-4 w-4 text-slate-400" />
        <span>Admin</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-slate-800">{currentTab.label}</span>
        <span className="text-slate-400">—</span>
        <span className="text-xs text-slate-400">{currentTab.desc}</span>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview'   && <OverviewTab />}
        {activeTab === 'businesses' && <BusinessesTab />}
        {activeTab === 'users'      && <UsersTab />}
        {activeTab === 'roles'      && <RolesTab />}
        {activeTab === 'billing'    && <BillingRequestsTab />}
        {activeTab === 'plans'      && <PlansTab />}
        {activeTab === 'coupons'    && <CouponsTab />}
        {activeTab === 'settings'   && <PlatformSettingsTab />}
      </div>
    </div>
  );
}