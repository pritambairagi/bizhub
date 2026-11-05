import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ordersApi } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  Download, 
  ChevronRight,
  ChevronLeft,
  Clock,
  User,
  ShoppingBag,
  Info,
  X,
  Printer
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

export default function SalesHistory() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filter, setFilter] = useState('all'); // 'all', 'daily', 'weekly', 'monthly', 'yearly'
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders-history', page, limit, search, dateRange, filter],
    queryFn: () => ordersApi.getAll({ 
      page,
      limit,
      search, 
      startDate: dateRange.start, 
      endDate: dateRange.end,
      period: filter !== 'all' ? filter : undefined
    }),
  });

  const orders = ordersData?.data?.data?.orders || [];
  const pagination = ordersData?.data?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const exportToPDF = () => {
    if (orders.length === 0) { alert('No orders to export.'); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = orders.map((o: any, i: number) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd;font-weight:bold">${o.orderNumber}</td>
        <td style="padding:8px;border:1px solid #ddd">${o.customer?.name || 'Walk-in'}<br/><small>${o.customer?.phone || ''}</small></td>
        <td style="padding:8px;border:1px solid #ddd">${o.createdBy?.profile ? `${o.createdBy.profile.firstName} ${o.createdBy.profile.lastName || ''}` : 'Owner/System'}<br/><small style="color:#666;text-transform:uppercase">${o.createdBy?.role || ''}</small></td>
        <td style="padding:8px;border:1px solid #ddd">${new Date(o.createdAt).toLocaleString()}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">৳${o.total?.toLocaleString()}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center"><span style="background:${o.status==='delivered'?'#d1fae5':'#fee2e2'};color:${o.status==='delivered'?'#065f46':'#991b1b'};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;text-transform:uppercase">${o.status}</span></td>
      </tr>
    `).join('');
    const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const dateLabel = dateRange.start && dateRange.end
      ? `${dateRange.start} to ${dateRange.end}`
      : filter !== 'all' ? filter.charAt(0).toUpperCase() + filter.slice(1) : 'All Time';
    printWindow.document.write(`<html><head><title>Sales Report</title><style>body{font-family:sans-serif;padding:20px;color:#111}h1{text-align:center}p.sub{text-align:center;color:#666;font-size:13px;margin-bottom:20px}.summary{display:flex;gap:20px;margin-bottom:20px;justify-content:center}.summary div{background:#f3f4f6;border-radius:8px;padding:10px 20px;text-align:center}.summary div strong{display:block;font-size:22px}.summary div span{font-size:12px;color:#666}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f3f4f6;padding:10px 8px;border:1px solid #ddd;text-align:left;font-weight:bold}</style></head><body><h1>BizHub ERP — Sales History Report</h1><p class="sub">Period: ${dateLabel} | Generated: ${new Date().toLocaleString()}</p><div class="summary"><div><strong>${orders.length}</strong><span>Total Orders</span></div><div><strong>৳${totalRevenue.toLocaleString()}</strong><span>Total Revenue</span></div></div><table><thead><tr><th>#</th><th>Order ID</th><th>Customer</th><th>Sold By</th><th>Date & Time</th><th>Total</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);};</script></body></html>`);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-white">Sales History & Reports</h2>
          <p className="text-slate-400">Track every transaction with detailed insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { id: 'all', label: 'All Time' },
          { id: 'daily', label: 'Today' },
          { id: 'weekly', label: 'This Week' },
          { id: 'monthly', label: 'This Month' },
          { id: 'yearly', label: 'This Year' },
        ].map(p => (
          <Button 
            key={p.id}
            variant={filter === p.id ? 'default' : 'outline'}
            className={cn(
              "h-10 border-slate-700",
              filter === p.id ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-800"
            )}
            onClick={() => setFilter(p.id)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search by customer, phone, SKU, or Order ID..."
                className="pl-9 bg-slate-800 border-slate-700 text-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Input 
                  type="date" 
                  className="bg-slate-800 border-slate-700 text-white h-9 text-xs" 
                  value={dateRange.start}
                  onChange={e => setDateRange({...dateRange, start: e.target.value})}
                />
                <span className="text-slate-500">-</span>
                <Input 
                  type="date" 
                  className="bg-slate-800 border-slate-700 text-white h-9 text-xs"
                  value={dateRange.end}
                  onChange={e => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
              <Button size="icon" variant="outline" className="h-9 w-9 border-slate-700 text-slate-400">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium"># Order ID</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Customer Info</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Sold By</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Date & Time</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-medium">Total Taka</th>
                  <th className="px-4 py-3 text-center text-slate-400 font-medium">Payment</th>
                  <th className="px-4 py-3 text-right text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center animate-pulse text-slate-500">Loading sales records...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No sales found for the selected period.</td></tr>
                ) : orders.map((order: any) => (
                  <tr key={order._id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-primary">#{order.orderNumber || order._id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{order.customer?.name || 'Walk-in Customer'}</span>
                        <span className="text-[10px] text-slate-500">{order.customer?.phone || 'No phone'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-white font-semibold">
                          {order.createdBy?.profile 
                            ? `${order.createdBy.profile.firstName} ${order.createdBy.profile.lastName || ''}`
                            : 'System / Owner'}
                        </span>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                          {order.createdBy?.role || 'Owner'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        order.status === 'delivered' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {order.payments?.[0]?.method || 'cash'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-white"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-4 py-4 border-t flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <span>Items per page:</span>
                <select 
                  className="bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-white bg-slate-900 rounded p-1 border-slate-700"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 25, 50, 100].map(v => (
                    <option key={v} value={v} className="bg-slate-900">{v}</option>
                  ))}
                </select>
              </div>
              <span>
                {pagination.total === 0
                  ? 'No sales records'
                  : `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, pagination.total)} of ${pagination.total} order${pagination.total !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon-sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="border-slate-700 text-slate-300"
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
                      className={`w-8 h-8 ${page === pageNum ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'}`}
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
                className="border-slate-700 text-slate-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl bg-slate-900 border-slate-700 shadow-2xl">
            <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Order Details</CardTitle>
                <CardDescription className="text-slate-400">#{selectedOrder.orderNumber || selectedOrder._id}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)} className="text-slate-400">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 max-h-[80vh] overflow-y-auto">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-800">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Customer Information</h4>
                    <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{selectedOrder.customer?.name}</p>
                        <p className="text-sm text-slate-400">{selectedOrder.customer?.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Order Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-emerald-500 font-bold uppercase">{selectedOrder.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date:</span>
                        <span className="text-white">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800 pt-1.5 mt-1.5">
                        <span className="text-slate-400">Add By:</span>
                        <span className="text-white font-medium">
                          {selectedOrder.createdBy?.profile 
                            ? `${selectedOrder.createdBy.profile.firstName} ${selectedOrder.createdBy.profile.lastName || ''}`
                            : 'System / Owner'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sold By:</span>
                        <span className="text-white font-medium">
                          {selectedOrder.createdBy?.profile 
                            ? `${selectedOrder.createdBy.profile.firstName} ${selectedOrder.createdBy.profile.lastName || ''}`
                            : 'System / Owner'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Purchased Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-4 rounded-xl border border-slate-800 group hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                          <ShoppingBag className="h-6 w-6 text-slate-500 group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{item.name}</p>
                          <div className="flex gap-3 text-xs text-slate-400 mt-1">
                            <span>SKU: <span className="text-slate-300">{item.sku}</span></span>
                            <span>Qty: <span className="text-slate-300">{item.qty}</span></span>
                            <span>Unit: <span className="text-slate-300">{formatCurrency(item.unitPrice)}</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-slate-950/50 border-t border-slate-800">
                <div className="max-w-xs ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Discount ({selectedOrder.discount?.type})</span>
                    <span className="text-red-400">-{formatCurrency(selectedOrder.discount?.amount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">VAT (5%)</span>
                    <span className="text-white">{formatCurrency(selectedOrder.vat || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-800">
                    <span className="text-white">Grand Total</span>
                    <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardHeader className="border-t border-slate-800 pt-4 flex flex-row gap-3">
              <Button variant="outline" className="flex-1 border-slate-700 text-slate-300" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" /> Print Receipt
              </Button>
              <Button className="flex-1 bg-primary text-white" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}

