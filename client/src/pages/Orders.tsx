import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ordersApi } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Package, Eye, Download, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function Orders() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter],
    queryFn: () => ordersApi.getAll({ page, limit: 20, search, status: statusFilter }),
    staleTime: 5 * 60 * 1000,
  });

  const orders = data?.data?.data?.orders || [];
  const pagination = data?.data?.data?.pagination || { page: 1, total: 0, totalPages: 1 };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    ready: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold">Orders</h2>
          <p className="text-muted-foreground">Manage your sales orders</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-lg" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th className="text-right">Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order: Record<string, unknown>) => (
                      <tr key={order._id as string}>
                        <td className="font-mono text-sm">{order.orderNumber as string}</td>
                        <td>
                          <div>
                            <p className="font-medium">{(order.customer as Record<string, string>)?.name || 'Walk-in'}</p>
                            <p className="text-xs text-muted-foreground">
                              {(order.customer as Record<string, string>)?.phone || '-'}
                            </p>
                          </div>
                        </td>
                        <td>{(order.items as unknown[])?.length || 0} items</td>
                        <td className="text-right font-medium">
                          {formatCurrency(order.total as number)}
                        </td>
                        <td>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status as string] || 'bg-gray-100'}`}>
                            {order.status as string}
                          </span>
                        </td>
                        <td className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt as string)}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/orders/${order._id}`}>
                              <Button variant="ghost" size="icon-sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon-sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {orders.length} of {pagination.total} orders
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}