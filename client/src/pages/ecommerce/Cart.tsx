import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { shopApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Tag, Gift } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: { en: string; bn: string };
    pricing: { sellingPrice: number; mrp: number };
    images: string[];
  };
  qty: number;
  price: number;
  total: number;
}

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => shopApi.getCart(),
    staleTime: 0,
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => shopApi.removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    },
    onError: () => {
      toast.error('Failed to remove item');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: string; qty: number }) => shopApi.updateCartItem(itemId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      toast.error('Failed to update quantity');
    },
  });

  const cartItems: CartItem[] = data?.data?.data?.items || [];
  const subtotal = cartItems.reduce((sum: number, item: CartItem) => sum + (item.total || 0), 0);
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0;
  const shipping = subtotal > 500 ? 0 : 60;
  const vat = (subtotal - discount) * 0.05;
  const total = subtotal - discount + shipping + vat;

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'save10') {
      setAppliedCoupon({ code: couponCode, discount: 10 });
      toast.success('Coupon applied: 10% off');
    } else if (couponCode.toLowerCase() === 'first50') {
      setAppliedCoupon({ code: couponCode, discount: 50 });
      toast.success('Coupon applied: ৳50 off');
    } else {
      toast.error('Invalid coupon code');
    }
    setCouponCode('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/shop">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/" className="text-2xl font-heading font-bold text-primary">
              BizHub Shop
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-heading font-semibold mb-6">Shopping Cart</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 skeleton rounded-lg" />
            ))}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Link to="/shop">
              <Button className="mt-4">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item: CartItem) => (
                <Card key={item._id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-24 w-24 rounded-lg bg-muted flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product?.name?.en}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price || 0)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => updateMutation.mutate({ itemId: item._id, qty: (item.qty || 1) - 1 })}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.qty || 1}</span>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => updateMutation.mutate({ itemId: item._id, qty: (item.qty || 1) + 1 })}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-bold">
                              {formatCurrency(item.total || (item.price || 0) * (item.qty || 1))}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive"
                              onClick={() => removeMutation.mutate(item._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? 'Free' : formatCurrency(shipping)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VAT (5%)</span>
                    <span>{formatCurrency(vat)}</span>
                  </div>

                  <div className="flex justify-between font-bold text-lg border-t pt-4">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>

                  {/* Coupon */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Apply Coupon</p>
                    {appliedCoupon ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                        <Tag className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">{appliedCoupon.code}</span>
                        <Button variant="ghost" size="icon-sm" className="ml-auto h-6 w-6" onClick={handleRemoveCoupon}>
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <Button variant="outline" onClick={handleApplyCoupon}>Apply</Button>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full mt-4"
                    size="lg"
                    onClick={() => navigate('/checkout')}
                  >
                    Proceed to Checkout
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
                    <Gift className="h-4 w-4" />
                    <span>Free shipping on orders over ৳500</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}