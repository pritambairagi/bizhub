import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { shopApi } from '@/services/api';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShoppingCart, ArrowLeft, CreditCard, Banknote, Phone, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function Checkout() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isComplete, setIsComplete] = useState(false);

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => shopApi.getCart(),
    staleTime: 0,
  });

  const checkoutMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => shopApi.checkout(data),
    onSuccess: () => {
      setIsComplete(true);
      toast.success('Order placed successfully!');
    },
    onError: () => {
      toast.error('Failed to place order');
    },
  });

  const cartItems = cartData?.data?.data?.items || [];
  const subtotal = cartItems.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.total as number) || 0), 0);
  const shipping = subtotal > 500 ? 0 : 60;
  const vat = subtotal * 0.05;
  const total = subtotal + shipping + vat;

  const paymentMethods = [
    { id: 'cash', label: 'Cash on Delivery', icon: Banknote },
    { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
    { id: 'bkash', label: 'bKash', icon: Phone },
    { id: 'nagad', label: 'Nagad', icon: Phone },
  ];

  const handleCheckout = () => {
    checkoutMutation.mutate({
      customer: formData,
      items: cartItems,
      paymentMethod,
      shipping,
      vat,
      total,
    });
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-2">Order Placed!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your order. You will receive a confirmation shortly.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Order ID: #ORD-{Date.now().toString().slice(-8)}
            </p>
            <div className="space-y-2">
              <Link to="/">
                <Button className="w-full">Continue Shopping</Button>
              </Link>
              <Link to="/orders">
                <Button variant="outline" className="w-full">View Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/cart">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-heading font-semibold">Checkout</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {cartItems.length === 0 && !isComplete ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Link to="/shop">
              <Button className="mt-4">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Full Name *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone *</label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1"
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address *</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1"
                      placeholder="Delivery address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">City</label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="mt-1"
                        placeholder=" Dhaka"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">District</label>
                      <Input
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="mt-1"
                        placeholder="District"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                          paymentMethod === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50'
                        }`}
                      >
                        <method.icon className="h-5 w-5" />
                        <span className="font-medium">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cartItems.map((item: Record<string, unknown>) => (
                      <div key={item._id as string} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {(item.product as { name?: { en?: string } })?.name?.en} × {(item.qty as number) || 1}
                        </span>
                        <span className="font-medium">{formatCurrency(item.total as number)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT (5%)</span>
                      <span>{formatCurrency(vat)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={checkoutMutation.isPending || !formData.name || !formData.phone || !formData.address}
                  >
                    {checkoutMutation.isPending ? 'Processing...' : `Pay ${formatCurrency(total)}`}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}