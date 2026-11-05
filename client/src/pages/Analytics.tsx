import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, ShoppingBag, Users, DollarSign, Package,
  AlertCircle, Activity, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

const COLORS = ['#0a7569','#7c3aed','#f59e0b','#ef4444','#64748b'];

function getRatingIcon(pct: number) {
  if (pct >= 80) return <CheckCircle2 className="h-4 w-4 text-emerald-500"/>;
  if (pct >= 50) return <AlertTriangle className="h-4 w-4 text-amber-500"/>;
  return <XCircle className="h-4 w-4 text-red-500"/>;
}
function getRatingBadge(pct: number) {
  if (pct >= 80) return 'badge-success';
  if (pct >= 50) return 'badge-warning';
  return 'badge-danger';
}
function getRatingLabel(pct: number) {
  if (pct >= 90) return 'Excellent';
  if (pct >= 80) return 'Good';
  if (pct >= 60) return 'Average';
  if (pct >= 40) return 'Poor';
  return 'Critical';
}

const PERFORMANCE_METRICS = [
  { metric:'Order Fulfillment Rate',    value:92,  target:90, category:'Sales' },
  { metric:'Inventory Accuracy',        value:87,  target:95, category:'Inventory' },
  { metric:'Customer Satisfaction',     value:78,  target:85, category:'CRM' },
  { metric:'On-Time Delivery',          value:65,  target:90, category:'Logistics' },
  { metric:'Return Rate',               value:12,  target:5,  category:'Sales',   inverted:true },
  { metric:'Employee Attendance',       value:94,  target:95, category:'HRM' },
  { metric:'Payment Collection Rate',   value:88,  target:90, category:'Finance' },
  { metric:'Stock Turnover',            value:43,  target:60, category:'Inventory' },
];

const BUSINESS_STATUS = [
  { label:'POS Terminal',    status:'online',  icon:'🟢', detail:'Last sale 2 min ago' },
  { label:'Inventory Sync',  status:'online',  icon:'🟢', detail:'Updated 5 min ago' },
  { label:'E-commerce Store',status:'online',  icon:'🟢', detail:'34 visitors today' },
  { label:'Payroll',         status:'pending', icon:'🟡', detail:'Due in 3 days' },
  { label:'Tax Filing',      status:'warning', icon:'🟡', detail:'Q2 due in 2 weeks' },
  { label:'Server Health',   status:'online',  icon:'🟢', detail:'99.9% uptime' },
];

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => api.get('/analytics/dashboard-stats').then(r=>r.data.data),
  });
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => api.get('/analytics/sales-trends').then(r=>r.data.data),
  });
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['analytics-top-products'],
    queryFn: () => api.get('/analytics/top-products').then(r=>r.data.data),
  });

  const isLoading = statsLoading || trendsLoading || productsLoading;

  const statCards = [
    { title:"Today's Sales",    value:formatCurrency(stats?.todaySales||0), icon:DollarSign, color:'text-emerald-600', bg:'bg-emerald-500/10', change:'+12%' },
    { title:"Today's Orders",   value:stats?.todayOrders||0,               icon:ShoppingBag, color:'text-blue-600',   bg:'bg-blue-500/10',   change:'+8%' },
    { title:'Total Customers',  value:stats?.totalCustomers||0,             icon:Users,       color:'text-purple-600', bg:'bg-purple-500/10', change:'+24' },
    { title:'Low Stock Items',  value:stats?.lowStockCount||0,              icon:Package,     color:'text-amber-600', bg:'bg-amber-500/10',  change:'Alert' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Analytics</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Real-time insights &amp; performance overview</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse"/>
          Live data
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(s=>(
          <Card key={s.title} className="stat-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center',s.bg)}>
                  <s.icon className={cn('h-5 w-5',s.color)}/>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {s.change}
                </span>
              </div>
              {isLoading
                ? <div className="h-8 skeleton rounded w-3/4"/>
                : <p className="text-2xl font-black">{s.value}</p>}
              <p className="text-sm text-muted-foreground mt-1">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Trend</CardTitle>
            <CardDescription>Last 7 days revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends||[]}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0a7569" stopOpacity={0.15}/>
                      <stop offset="100%" stopColor="#0a7569" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/>
                  <XAxis dataKey="_id" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))"/>
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={v=>`৳${v}`}/>
                  <Tooltip contentStyle={{backgroundColor:'hsl(var(--card))',borderColor:'hsl(var(--border))',borderRadius:8}} formatter={(v:any)=>[formatCurrency(v),'Sales']}/>
                  <Line type="monotone" dataKey="sales" stroke="#0a7569" strokeWidth={2.5} dot={{r:4,fill:'#0a7569',strokeWidth:0}} activeDot={{r:6}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders Volume</CardTitle>
            <CardDescription>Orders per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends||[]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/>
                  <XAxis dataKey="_id" fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))"/>
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))"/>
                  <Tooltip contentStyle={{backgroundColor:'hsl(var(--card))',borderColor:'hsl(var(--border))',borderRadius:8}}/>
                  <Bar dataKey="orders" fill="#0a7569" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products + Pie */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Selling Products</CardTitle>
            <CardDescription>Highest quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(!topProducts||topProducts.length===0) ? (
                <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                  <AlertCircle className="h-8 w-8 opacity-30"/>
                  <p className="text-sm">No sales data yet</p>
                </div>
              ) : topProducts.map((p:any,i:number)=>(
                <div key={p._id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {i+1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.totalQty} units sold</p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(p.totalRevenue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Split</CardTitle>
            <CardDescription>By top products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topProducts||[]} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="totalRevenue">
                    {(topProducts||[]).map((_:any,i:number)=>(
                      <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                    ))}
                  </Pie>
                  <Tooltip formatter={(v:any)=>formatCurrency(v)} contentStyle={{backgroundColor:'hsl(var(--card))',borderColor:'hsl(var(--border))',borderRadius:8}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {(topProducts||[]).map((p:any,i:number)=>{
                const total = (topProducts||[]).reduce((a:number,x:any)=>a+x.totalRevenue,0);
                return (
                  <div key={p._id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{backgroundColor:COLORS[i%COLORS.length]}}/>
                      <span className="truncate max-w-[100px]">{p.name}</span>
                    </div>
                    <span className="font-semibold">{total?Math.round((p.totalRevenue/total)*100):0}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── BUSINESS STATUS ── */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary"/>Business Status
            </CardTitle>
            <CardDescription>Live system and operational status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {BUSINESS_STATUS.map(s=>(
                <div key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{s.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.detail}</p>
                    </div>
                  </div>
                  <span className={cn('badge text-[10px] font-bold uppercase',
                    s.status==='online'?'badge-success':s.status==='warning'?'badge-warning':'badge-info'
                  )}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── PERFORMANCE TABLE ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary"/>Performance Table
            </CardTitle>
            <CardDescription>
              KPI ratings — <span className="text-emerald-500">✅ ≥80%</span>&nbsp;
              <span className="text-amber-500">⚠️ 50–79%</span>&nbsp;
              <span className="text-red-500">❌ &lt;50%</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Category</th>
                    <th className="text-right">Rating</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PERFORMANCE_METRICS.map(m=>{
                    const pct = m.inverted ? Math.max(0,100-m.value*2) : m.value;
                    return (
                      <tr key={m.metric}>
                        <td>
                          <div>
                            <p className="font-medium text-sm">{m.metric}</p>
                            <div className="h-1.5 w-full bg-muted rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full rounded-full transition-all"
                                style={{width:`${pct}%`, background:pct>=80?'#10b981':pct>=50?'#f59e0b':'#ef4444'}}/>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info text-[10px]">{m.category}</span>
                        </td>
                        <td className="text-right">
                          <span className={cn('badge text-[10px] font-bold', getRatingBadge(pct))}>
                            {m.value}{m.inverted?'%':''}{!m.inverted&&'%'} · {getRatingLabel(pct)}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="flex justify-center">
                            {getRatingIcon(pct)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
