import { useQuery } from '@tanstack/react-query';
import { api, ordersApi } from '@/services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, cn } from '@/lib/utils';
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Clock,
  ChevronRight,
  LayoutGrid,
  Plus
} from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // If someone manually types /dashboard but doesn't have access, take them home
  const canSeeDashboard = 
    user?.role === 'owner' || 
    user?.role === 'super_admin' || 
    user?.role === 'manager' || 
    user?.permissions?.includes('manage_dashboard');

  if (user && !canSeeDashboard) {
    return <Navigate to="/" replace />;
  }

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => api.get('/analytics/dashboard-stats').then(res => res.data.data),
    enabled: !!user?.businessId || user?.role === 'super_admin',
  });

  const { data: trends, isLoading: trendsLoading, isError: trendsError } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => api.get('/analytics/sales-trends').then(res => res.data.data),
    enabled: !!user?.businessId || user?.role === 'super_admin',
  });

  const { data: recentOrdersData, isLoading: ordersLoading, isError: ordersError } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => ordersApi.getAll({ limit: 8 }),
    enabled: !!user?.businessId || user?.role === 'super_admin',
  });

  const recentOrders = recentOrdersData?.data?.data?.orders || [];

  if (statsError || trendsError || ordersError) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Activity className="h-10 w-10 text-red-500" />
        <p className="text-slate-500 font-medium text-center">
          Failed to load dashboard data.<br/>
          <span className="text-xs">This might be because the business setup is incomplete or there's a connection issue.</span>
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
          Try Refreshing
        </Button>
      </div>
    );
  }

  if (statsLoading || trendsLoading || ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <Activity className="h-10 w-10 text-primary animate-pulse" />
        <p className="text-slate-500 animate-pulse font-medium">Crunching your business data...</p>
      </div>
    );
  }

  const quickStats = [
    {
      title: "Today's Revenue",
      value: formatCurrency(stats?.todaySales || 0),
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10'
    },
    {
      title: 'Active Orders',
      value: stats?.todayOrders || 0,
      change: '+4',
      trend: 'up',
      icon: ShoppingCart,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Inventory Items',
      value: stats?.totalProducts || 0,
      change: '8 Low',
      trend: 'down',
      icon: Package,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10'
    },
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      change: '+18 new',
      trend: 'up',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
  ];

  const salesData = (trends || []).map((t: any) => ({
    name: t._id,
    sales: t.sales || 0,
    orders: t.orders || 0
  }));

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-black text-white tracking-tight">
            {user?.role === 'super_admin' ? 'Platform Overview' : 'Business Overview'}
          </h2>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Showing {user?.role === 'super_admin' ? 'platform-wide' : 'business'} data for {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800">
            <Clock className="h-4 w-4 mr-2" /> Real-time
          </Button>
          {user?.role !== 'super_admin' && (
            <Link to="/pos">
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" /> New Transaction
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.title} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-full border border-slate-700/50">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-amber-500" />
                  )}
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", stat.trend === 'up' ? 'text-emerald-500' : 'text-amber-500')}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className="mt-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.title}</p>
                <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <stat.icon className="h-24 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800 overflow-hidden">
          <CardHeader className="border-b border-slate-800/50 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Revenue Performance</CardTitle>
                <CardDescription className="text-slate-500">Net sales over the last 7 days</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `৳${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                    itemStyle={{ color: '#0f766e' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#0f766e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    activeDot={{ r: 6, fill: '#0f766e', stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders List */}
        <Card className="bg-slate-900 border-slate-800 flex flex-col">
          <CardHeader className="border-b border-slate-800/50 bg-slate-900/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Orders</CardTitle>
              <CardDescription className="text-slate-500">Live transaction feed</CardDescription>
            </div>
            <Link to="/sales-history">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="divide-y divide-slate-800/50 overflow-y-auto max-h-[400px] custom-scrollbar">
              {recentOrders.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>Waiting for first sale...</p>
                </div>
              ) : (
                recentOrders.map((order: any) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-primary/50 group-hover:text-primary transition-colors">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">#{order.orderNumber?.slice(-6)}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase">{order.customer?.name || 'Walk-in'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-white text-sm">{formatCurrency(order.total)}</p>
                      <p className="text-[10px] text-slate-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 mt-auto">
             <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Today's Avg Order</span>
                <span className="text-white font-bold">{formatCurrency((stats?.todaySales || 0) / (stats?.todayOrders || 1))}</span>
             </div>
          </div>
        </Card>
      </div>

      {/* Analytics Summary */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                     <LayoutGrid className="h-6 w-6" />
                  </div>
                  <div>
                     <p className="text-xs text-slate-500 font-bold uppercase">System Status</p>
                     <p className="text-sm text-emerald-500 font-bold">Online & Synchronized</p>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto text-slate-700" />
               </div>
            </CardContent>
         </Card>
         <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400">
                     <Package className="h-6 w-6" />
                  </div>
                  <div>
                     <p className="text-xs text-slate-500 font-bold uppercase">Inventory Health</p>
                     <p className="text-sm text-white font-bold">{stats?.totalProducts || 0} Products Managed</p>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto text-slate-700" />
               </div>
            </CardContent>
         </Card>
         <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-400/10 flex items-center justify-center text-blue-400">
                     <Users className="h-6 w-6" />
                  </div>
                  <div>
                     <p className="text-xs text-slate-500 font-bold uppercase">Customer Base</p>
                     <p className="text-sm text-white font-bold">{stats?.totalCustomers || 0} Total Customers</p>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto text-slate-700" />
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}