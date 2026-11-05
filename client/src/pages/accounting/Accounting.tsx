import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { accountingApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, Banknote, Plus, ArrowUpRight,
  ArrowDownLeft, Filter, X, Loader2, Eye, BookOpen, Calculator,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Accounting() {
  const [activeTab, setActiveTab]       = useState<'cashbox' | 'journal'>('cashbox');
  const [dateRange, setDateRange]       = useState({ start: '', end: '' });
  const [showModal, setShowModal]       = useState(false);
  const [viewTxn, setViewTxn]           = useState<any>(null);
  const [page, setPage]                 = useState(1);
  const [limit, setLimit]               = useState(10);
  const [formData, setFormData]         = useState({
    type: 'debit', amount: 0, accountId: '', contraAccountId: '', description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const qc = useQueryClient();

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountingApi.getAccounts(),
  });
  const { data: txnData, isLoading: txnLoading } = useQuery({
    queryKey: ['transactions', page, limit, dateRange],
    queryFn: () => accountingApi.getTransactions({ page, limit, startDate: dateRange.start, endDate: dateRange.end }),
  });

  const accounts     = accountsData?.data?.data?.accounts || [];
  const transactions = txnData?.data?.data?.transactions || [];
  const pagination   = txnData?.data?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const cashIn  = transactions.filter((t:any)=>t.type==='debit').reduce((s:number,t:any)=>s+t.amount,0);
  const cashOut = transactions.filter((t:any)=>t.type==='credit').reduce((s:number,t:any)=>s+t.amount,0);
  const balance = cashIn - cashOut;

  const chartData = [...transactions].reverse().map((t:any)=>({
    date: new Date(t.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),
    amount: t.type==='debit' ? t.amount : -t.amount,
  }));

  const createMutation = useMutation({
    mutationFn: (d:any) => accountingApi.createTransaction(d),
    onSuccess: () => {
      qc.invalidateQueries({queryKey:['transactions']});
      toast.success('Transaction recorded inside Jabeda');
      setShowModal(false);
      setFormData({type:'debit',amount:0,accountId:'',contraAccountId:'',description:'',date:new Date().toISOString().split('T')[0]});
    },
    onError: (e:any) => toast.error(e.response?.data?.message||'Failed'),
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cash Box &amp; Accounting (ক্যাশ বক্স এবং হিসাবরক্ষণ)</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Monitor your cash flow and financial health with professional double entry ledger</p>
        </div>
        <Button onClick={()=>setShowModal(true)} className="gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
          <Plus className="h-4 w-4"/>Add Transaction
        </Button>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-md">
        <button
          onClick={() => setActiveTab('cashbox')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
            activeTab === 'cashbox'
              ? "bg-white text-slate-800 shadow"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Calculator className="h-4 w-4" />
          Cash Box (ক্যাশ বক্স)
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
            activeTab === 'journal'
              ? "bg-white text-slate-800 shadow"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <BookOpen className="h-4 w-4" />
          General Journal (জাবেদা খতিয়ান)
        </button>
      </div>

      {activeTab === 'cashbox' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label:'Total Cash In (মোট জমা)',  value:formatCurrency(cashIn),  Icon:ArrowDownLeft, color:'text-emerald-600', bg:'bg-emerald-500/10' },
              { label:'Total Cash Out (মোট খরচ)', value:formatCurrency(cashOut), Icon:ArrowUpRight,  color:'text-red-500',    bg:'bg-red-500/10' },
              { label:'Net Balance (অবশিষ্ট ক্যাশ)',    value:formatCurrency(balance), Icon:Banknote,      color:balance>=0?'text-primary':'text-red-500', bg:'bg-primary/10' },
            ].map(s=>(
              <Card key={s.label} className="stat-card">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className={cn('text-2xl font-bold mt-1',s.color)}>{s.value}</p>
                  </div>
                  <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0',s.bg)}>
                    <s.Icon className={cn('h-6 w-6',s.color)}/>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader><CardTitle className="text-base">Transaction Flow</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0a7569" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#0a7569" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false}/>
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}/>
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v=>`৳${v}`}/>
                    <Tooltip contentStyle={{backgroundColor:'hsl(var(--card))',borderColor:'hsl(var(--border))',color:'hsl(var(--foreground))',borderRadius:8}} itemStyle={{color:'#0a7569'}}/>
                    <Area type="monotone" dataKey="amount" stroke="#0a7569" strokeWidth={2} fillOpacity={1} fill="url(#colorAmt)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Input type="date" className="h-9 text-xs w-36" value={dateRange.start} onChange={e=>setDateRange({...dateRange,start:e.target.value})}/>
                <span className="text-muted-foreground text-xs">to</span>
                <Input type="date" className="h-9 text-xs w-36" value={dateRange.end}   onChange={e=>setDateRange({...dateRange,end:e.target.value})}/>
                {(dateRange.start||dateRange.end)&&(
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={()=>setDateRange({start:'',end:''})}>
                    <X className="h-4 w-4"/>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Type</th><th>Description</th>
                      <th>Account</th><th className="text-right">Amount</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txnLoading ? (
                      [...Array(4)].map((_,i)=>(
                        <tr key={i}><td colSpan={6}><div className="h-11 skeleton my-1 rounded"/></td></tr>
                      ))
                    ) : transactions.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-14 text-muted-foreground">No transactions found</td></tr>
                    ) : transactions.map((t:any)=>(
                      <tr key={t._id}>
                        <td className="text-muted-foreground text-[10px] whitespace-nowrap">
                          <div className="font-bold text-slate-800">
                            {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div>
                            {new Date(t.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <span className={cn('badge text-[10px] font-bold uppercase', t.type==='debit'?'badge-success':'badge-danger')}>
                            {t.type==='debit'?'Cash In':'Cash Out'}
                          </span>
                        </td>
                        <td className="font-medium max-w-[200px] truncate">{t.description}</td>
                        <td className="text-muted-foreground text-sm">{t.accountId?.name||'Main Cash'}</td>
                        <td className={cn('text-right font-bold', t.type==='debit'?'text-emerald-600':'text-red-500')}>
                          {t.type==='debit'?'+':'-'}{formatCurrency(t.amount)}
                        </td>
                        <td className="text-right">
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary"
                            onClick={()=>setViewTxn(t)}
                          >
                            <Eye className="h-3.5 w-3.5"/>View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="px-4 py-4 border-t flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Items per page:</span>
                    <select 
                      className="bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-foreground bg-background rounded p-1 border"
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[10, 25, 50, 100].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <span>
                    {pagination.total === 0
                      ? 'No transactions'
                      : `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, pagination.total)} of ${pagination.total} transaction${pagination.total !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="icon-sm" 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'ghost'}
                          size="icon-sm"
                          className="w-8 h-8"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon-sm" 
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Journal Ledger Registry View */
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">General Journal (সাধারণ জাবেদা খতিয়ান)</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Classic double entry book-keeping ledger register</p>
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" className="h-9 text-xs w-36" value={dateRange.start} onChange={e=>setDateRange({...dateRange,start:e.target.value})}/>
              <span className="text-slate-400 text-xs">to</span>
              <Input type="date" className="h-9 text-xs w-36" value={dateRange.end} onChange={e=>setDateRange({...dateRange,end:e.target.value})}/>
              {(dateRange.start||dateRange.end)&& (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={()=>setDateRange({start:'',end:''})}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b text-[13px]">
                    <th className="p-3 text-left w-32 border-r border-slate-200">Date (তারিখ)</th>
                    <th className="p-3 text-left w-32 border-r border-slate-200">Voucher (ভাউচার)</th>
                    <th className="p-3 text-left border-r border-slate-200">Particulars (বিবরণ)</th>
                    <th className="p-3 text-center w-20 border-r border-slate-200">Ref</th>
                    <th className="p-3 text-right w-36 border-r border-slate-200">Debit (ডেবিট ৳)</th>
                    <th className="p-3 text-right w-36">Credit (ক্রেডিট ৳)</th>
                  </tr>
                </thead>
                <tbody>
                  {txnLoading ? (
                    [...Array(4)].map((_,i)=>(
                      <tr key={i}><td colSpan={6} className="p-4"><div className="h-10 skeleton rounded"/></td></tr>
                    ))
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-slate-400">
                        No general journal records found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t: any) => {
                      const debitAccName = t.type === 'debit' ? t.accountId?.name : t.contraAccountId?.name;
                      const creditAccName = t.type === 'credit' ? t.accountId?.name : t.contraAccountId?.name;
                      return (
                        <tr key={t._id} className="border-b hover:bg-slate-50/50 transition-colors align-top">
                          {/* Date */}
                          <td className="p-3 border-r border-slate-200 font-semibold text-slate-600 text-xs">
                            {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                              {new Date(t.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          {/* Voucher */}
                          <td className="p-3 border-r border-slate-200 font-mono font-bold text-xs text-slate-500">
                            {t.voucherNumber || `VCH-${t._id.slice(-6).toUpperCase()}`}
                          </td>
                          {/* Particulars */}
                          <td className="p-3 border-r border-slate-200 space-y-1.5">
                            {/* Debit Row */}
                            <div className="flex justify-between font-bold text-slate-800 text-[13.5px]">
                              <span>{debitAccName || 'Main Cash Account'}</span>
                              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Dr</span>
                            </div>
                            {/* Credit Row */}
                            <div className="flex justify-between font-medium text-slate-500 pl-6 text-[13.5px]">
                              <span>To {creditAccName || 'Sales/Revenue Account'}</span>
                              <span className="text-[11px] text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Cr</span>
                            </div>
                            {/* Narration */}
                            <div className="text-xs text-slate-400 italic pt-1 pl-2 border-l-2 border-slate-200">
                              (Being {t.description || 'amount transferred/adjusted'})
                            </div>
                          </td>
                          {/* L.F. / Ref */}
                          <td className="p-3 border-r border-slate-200 text-center text-xs font-mono text-slate-400">
                            Gen-L
                          </td>
                          {/* Debit Amount */}
                          <td className="p-3 border-r border-slate-200 text-right font-black text-slate-700 text-sm">
                            ৳{t.amount.toLocaleString()}
                          </td>
                          {/* Credit Amount */}
                          <td className="p-3 text-right font-black text-slate-500 text-sm">
                            ৳{t.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-4 py-4 border-t flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Items per page:</span>
                  <select 
                    className="bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-foreground bg-background rounded p-1 border"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[10, 25, 50, 100].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <span>
                  {pagination.total === 0
                    ? 'No journal entries'
                    : `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, pagination.total)} of ${pagination.total} transaction${pagination.total !== 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="icon-sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'ghost'}
                        size="icon-sm"
                        className="w-8 h-8"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button 
                  variant="outline" 
                  size="icon-sm" 
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full bg-card border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">New Transaction</h3>
              <Button variant="ghost" size="icon" onClick={()=>setShowModal(false)}><X className="h-4 w-4"/></Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex gap-2 p-1 bg-muted rounded-xl">
                {(['debit','credit'] as const).map(type=>(
                  <button key={type}
                    className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
                      formData.type===type
                        ? type==='debit'?'bg-emerald-600 text-white shadow':'bg-red-600 text-white shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={()=>setFormData({...formData,type})}>
                    {type==='debit'?'💰 Cash In':'💸 Cash Out'}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Amount (৳) <span className="text-destructive">*</span></label>
                <Input type="number" value={formData.amount||''} onChange={e=>setFormData({...formData,amount:Number(e.target.value)})} placeholder="0.00" className="text-lg font-bold"/>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Primary Account (ডেবিট হিসাব) <span className="text-destructive">*</span></label>
                <select className="w-full" value={formData.accountId} onChange={e=>setFormData({...formData,accountId:e.target.value})}>
                  <option value="">Select account</option>
                  {accounts.map((a:any)=><option key={a._id} value={a._id}>{a.name} ({a.type})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Contra Account (ক্রেডিট / বিপরীত হিসাব)</label>
                <select className="w-full" value={formData.contraAccountId} onChange={e=>setFormData({...formData,contraAccountId:e.target.value})}>
                  <option value="">Select contra account</option>
                  {accounts.map((a:any)=><option key={a._id} value={a._id}>{a.name} ({a.type})</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description <span className="text-destructive">*</span></label>
                <Input value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} placeholder="What is this for?"/>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <Input type="date" value={formData.date} onChange={e=>setFormData({...formData,date:e.target.value})}/>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={()=>setShowModal(false)}>Cancel</Button>
              <Button
                className={cn('flex-1 text-white shadow-lg',formData.type==='debit'?'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20':'bg-red-600 hover:bg-red-700 shadow-red-600/20')}
                onClick={()=>createMutation.mutate(formData)}
                disabled={!formData.amount||!formData.accountId||!formData.description||createMutation.isPending}
              >
                {createMutation.isPending?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Saving…</>:'Confirm Transaction'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Transaction Modal */}
      {viewTxn && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm w-full bg-card border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">Transaction Details</h3>
              <Button variant="ghost" size="icon" onClick={()=>setViewTxn(null)}><X className="h-4 w-4"/></Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex justify-center mb-2">
                <div className={cn('h-16 w-16 rounded-2xl flex items-center justify-center', viewTxn.type==='debit'?'bg-emerald-500/10':'bg-red-500/10')}>
                  {viewTxn.type==='debit'
                    ? <ArrowDownLeft className="h-8 w-8 text-emerald-600"/>
                    : <ArrowUpRight className="h-8 w-8 text-red-500"/>}
                </div>
              </div>
              <div className="text-center">
                <p className={cn('text-3xl font-black', viewTxn.type==='debit'?'text-emerald-600':'text-red-500')}>
                  {viewTxn.type==='debit'?'+':'-'}{formatCurrency(viewTxn.amount)}
                </p>
                <p className="text-muted-foreground text-sm mt-1">{viewTxn.type==='debit'?'Cash In':'Cash Out'}</p>
              </div>
              {[
                { label: 'Debit Account', value: (viewTxn.type === 'debit' ? viewTxn.accountId?.name : viewTxn.contraAccountId?.name) || 'Main Cash' },
                { label: 'Credit Account', value: (viewTxn.type === 'credit' ? viewTxn.accountId?.name : viewTxn.contraAccountId?.name) || 'Sales/Revenue' },
                {
                  label: 'Date & Time',
                  value: `${new Date(viewTxn.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} ${new Date(viewTxn.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                },
                { label: 'Voucher #', value: viewTxn.voucherNumber || `VCH-${viewTxn._id.slice(-6).toUpperCase()}` },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{r.label}</span>
                  <span className="text-sm font-semibold">{r.value}</span>
                </div>
              ))}
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <div className="p-3 bg-muted rounded-lg text-sm leading-relaxed italic text-foreground whitespace-pre-wrap">
                  {viewTxn.description || 'No description provided'}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t">
              <Button className="w-full" variant="outline" onClick={()=>setViewTxn(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}