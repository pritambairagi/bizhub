import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ordersApi } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Printer, Download, RefreshCw, Package } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [isReturning, setIsReturning] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id!),
    enabled: !!id,
  });

  const order = data?.data?.data?.order;

  const handlePrint = () => {
    window.print();
  };

  const handleProcessPayment = async () => {
    if (!order) return;
    try {
      await ordersApi.processPayment(order._id, [{ method: 'cash', amount: order.total }]);
      toast.success('Payment processed successfully');
    } catch {
      toast.error('Failed to process payment');
    }
  };

  const handleReturn = async () => {
    if (!order) return;
    try {
      await ordersApi.createReturn(order._id, { items: order.items, reason: 'Customer request' });
      toast.success('Return processed successfully');
      setIsReturning(false);
    } catch {
      toast.error('Failed to process return');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 skeleton rounded" />
        <div className="h-64 skeleton rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Order not found</p>
        <Link to="/orders">
          <Button className="mt-4">Back to Orders</Button>
        </Link>
      </div>
    );
  }

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
        <div className="flex items-center gap-4">
          <Link to="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-heading font-semibold">Order #{order.orderNumber}</h2>
            <p className="text-muted-foreground">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Invoice
          </Button>
          {order.status === 'pending' && (
            <Button onClick={handleProcessPayment}>
              <RefreshCw className="h-4 w-4" />
              Process Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
              {order.status}
            </span>
            <p className="text-sm text-muted-foreground mt-2">
              Created: {formatDate(order.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{(order.customer as { name?: string })?.name || 'Walk-in Customer'}</p>
            <p className="text-sm text-muted-foreground">{(order.customer as { phone?: string })?.phone || '-'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{formatCurrency(order.paid as number)} paid</p>
            <p className="text-sm text-muted-foreground">
              Due: {formatCurrency(order.due as number)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items as { name: string; qty: number; unitPrice: number; total: number }[])?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td className="text-right">{item.qty}</td>
                    <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-sm ml-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal as number)}</span>
            </div>
            {((order.discount as { amount?: number })?.amount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-{formatCurrency((order.discount as { amount?: number }).amount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT</span>
              <span>{formatCurrency(order.vat as number)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(order.total as number)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.status === 'delivered' && !isReturning && (
        <Button variant="outline" onClick={() => setIsReturning(true)}>
          <RefreshCw className="h-4 w-4" />
          Process Return
        </Button>
      )}

      {isReturning && (
        <Card>
          <CardHeader>
            <CardTitle>Process Return</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This will create a return order for all items. Continue?
            </p>
            <div className="flex gap-2">
              <Button onClick={handleReturn}>Confirm Return</Button>
              <Button variant="outline" onClick={() => setIsReturning(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}