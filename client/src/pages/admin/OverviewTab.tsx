import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { Store, Users, Package, DollarSign, ShoppingCart, TrendingUp, Activity, ArrowUpRight, Server, Cpu, Database, Wifi } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function OverviewTab() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminApi.getStats().then(r => r.data.data) });
  const { data: health } = useQuery({ queryKey: ['admin-health'], queryFn: () => adminApi.getSystemHealth().then(r => r.data.data), refetchInterval: 30000 });
  const { data: activity } = useQuery({ queryKey: ['admin-activity'], queryFn: () => adminApi.getRecentActivity(10).then(r => r.data.data) });
  const { data: revenue } = useQuery({ queryKey: ['admin-revenue'], queryFn: () => adminApi.getRevenueAnalytics(30).then(r => r.data.data) });

  const statCards = [
    { label: 'Total Businesses', value: stats?.totalBusinesses ?? 0, icon: Store, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Total Products', value: stats?.totalProducts ?? 0, icon: Package, color: 'from-orange-500 to-amber-600', bg: 'bg-orange-50', text: 'text-orange-600' },
    { label: 'Global Revenue', value: formatCurrency(stats?.totalRevenue ?? 0), icon: DollarSign, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600' },
    { label: "Today's Orders", value: stats?.todayOrders ?? 0, icon: ShoppingCart, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50', text: 'text-pink-600' },
    { label: "Today's Revenue", value: formatCurrency(stats?.todayRevenue ?? 0), icon: TrendingUp, color: 'from-cyan-500 to-sky-600', bg: 'bg-cyan-50', text: 'text-cyan-600' },
    { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: Activity, color: 'from-lime-500 to-green-600', bg: 'bg-lime-50', text: 'text-lime-600' },
    { label: 'Suspended Users', value: stats?.suspendedUsers ?? 0, icon: Users, color: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-600' },
  ];

  const services = [
    { name: 'API Server', icon: Server, status: health?.services?.api },
    { name: 'Database', icon: Database, status: health?.services?.database },
    { name: 'Auth Service', icon: Cpu, status: health?.services?.auth },
    { name: 'Network', icon: Wifi, status: health?.services?.storage },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 overflow-hidden">
            <CardContent className="p-0">
              <div className={`h-1 w-full bg-gradient-to-r ${s.color}`} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${s.bg}`}>
                    <s.icon className={`h-5 w-5 ${s.text}`} />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                    <ArrowUpRight className="h-3 w-3" />Live
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wide">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart + System Health */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-xl border-none">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-bold">Global Revenue (Last 30 Days)</CardTitle>
            <CardDescription>Daily revenue across all businesses</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue?.dailyRevenue || []}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-none">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              System Health
            </CardTitle>
            <CardDescription>
              Uptime: <span className="font-semibold text-slate-700">{health?.server?.uptimeFormatted ?? '...'}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {services.map(svc => (
              <div key={svc.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <svc.icon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">{svc.name}</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${svc.status === 'operational' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {svc.status ?? 'checking...'}
                </span>
              </div>
            ))}
            {health && (
              <div className="mt-3 p-3 rounded-xl bg-violet-50 border border-violet-100">
                <p className="text-xs font-semibold text-violet-700 mb-1.5">Memory Usage</p>
                <div className="h-2 w-full bg-violet-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (health.server.memoryUsed / health.server.memoryTotal) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-violet-600 mt-1">{health.server.memoryUsed}MB / {health.server.memoryTotal}MB</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Businesses + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-xl border-none">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-bold">Top Businesses by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(revenue?.topBusinesses || []).map((b: any) => ({ name: b.business?.name ?? 'Unknown', revenue: b.revenue }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="revenue" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-none">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            <CardDescription>Live platform events</CardDescription>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {(activity || []).length === 0 && <p className="text-sm text-slate-400 text-center py-6">No recent activity</p>}
            {(activity || []).map((act: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${act.severity === 'warning' ? 'bg-amber-400' : act.severity === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{act.message}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(act.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
