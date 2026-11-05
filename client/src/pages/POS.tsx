import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, cn } from '@/lib/utils';
import { productsApi, ordersApi, customersApi, api } from '@/services/api';
import { toast } from 'sonner';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Wallet,
  Banknote, Phone, Printer, X, Loader2, Tag, CheckCircle2, Percent,
} from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

export default function POS() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [variantSelectProduct, setVariantSelectProduct] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // ── Platform VAT settings ────────────────────────────────────────────────
  const { data: platformSettingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.get('/public/settings').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const vatEnabled: boolean = platformSettingsData?.taxEnabled ?? true;
  const vatRate: number = platformSettingsData?.defaultTaxRate ?? 5;

  const { data: customersData } = useQuery({
    queryKey: ['customers-pos'],
    queryFn: () => customersApi.getAll({ limit: 100 }),
  });
  const customersList = customersData?.data?.data?.customers || [];
  const selectedCustomer = customersList.find((c: any) => c._id === selectedCustomerId);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  });
  const categoriesList = categoriesData?.data?.data?.categories || [];
  const categories = ['All', ...categoriesList.map((c: any) => typeof c.name === 'string' ? c.name : c.name.en)];

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-pos', search, selectedCategory],
    queryFn: () => productsApi.getAll({
      search,
      category: selectedCategory === 'All' ? undefined : categoriesList.find((c: any) =>
        (typeof c.name === 'string' ? c.name : c.name.en) === selectedCategory)?._id,
      limit: 100,
    }),
  });
  const products = productsData?.data?.data?.products || [];

  const checkoutMutation = useMutation({
    mutationFn: (orderData: any) => ordersApi.create(orderData),
    onSuccess: () => {
      toast.success('Order created successfully');
      setCart([]);
      setDiscount(0);
      setAppliedCoupon(null);
      setCouponCode('');
      setSelectedCustomerId('');
      setManualCustomerName('');
      setManualCustomerPhone('');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customers-pos'] });
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to create order'),
  });

  const addToCart = (product: any) => {
    if (product.variants && product.variants.length > 0) {
      setVariantSelectProduct(product);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) return prev.map(item => item.productId === product._id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, {
        id: product._id,
        productId: product._id,
        name: typeof product.name === 'string' ? product.name : (product.name?.en || 'Unnamed Product'),
        sku: product.sku,
        price: product.pricing.sellingPrice,
        qty: 1,
      }];
    });
  };

  const addToCartVariant = (product: any, variant: any) => {
    const itemId = `${product._id}-${variant._id}`;
    const variantPrice = variant.priceOverride !== undefined && variant.priceOverride !== null
      ? variant.priceOverride
      : product.pricing.sellingPrice;
    setCart(prev => {
      const existing = prev.find(item => item.id === itemId);
      if (existing) return prev.map(item => item.id === itemId ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, {
        id: itemId,
        productId: product._id,
        variantId: variant._id,
        name: `${typeof product.name === 'string' ? product.name : (product.name?.en || 'Unnamed Product')} (${variant.name})`,
        sku: `${product.sku}-${variant.name.toUpperCase()}`,
        price: variantPrice,
        qty: 1,
      }];
    });
    setVariantSelectProduct(null);
    toast.success(`Added ${variant.name} variant to cart`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const afterDiscount = subtotal - discountAmount - couponDiscount;
  const vat = vatEnabled ? (afterDiscount * vatRate) / 100 : 0;
  const grandTotal = afterDiscount + vat;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/apply', { code: couponCode.trim(), orderTotal: subtotal - discountAmount });
      setAppliedCoupon(res.data.data);
      toast.success(`Coupon applied! Saving ${formatCurrency(res.data.data.discountAmount)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'bkash', label: 'bKash', icon: Phone },
    { id: 'nagad', label: 'Nagad', icon: Phone },
  ];

  const handleCheckout = (method: string) => {
    if (cart.length === 0) return;
    const orderData = {
      customerId: selectedCustomerId || undefined,
      customer: {
        name: selectedCustomer ? selectedCustomer.name : (manualCustomerName || 'Walk-in Customer'),
        phone: selectedCustomer ? selectedCustomer.phone : (manualCustomerPhone || ''),
      },
      items: cart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        sku: item.sku,
        qty: item.qty,
        unitPrice: item.price,
        total: item.price * item.qty,
      })),
      subtotal,
      discount: { type: discountType, value: discount, amount: discountAmount },
      coupon: appliedCoupon ? { code: appliedCoupon.code, discountAmount: couponDiscount } : undefined,
      vat,
      vatRate,
      total: grandTotal,
      payments: [{ method, amount: grandTotal }],
      status: 'delivered',
    };
    checkoutMutation.mutate(orderData);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm"
              onClick={() => setSelectedCategory(cat)} className="flex-shrink-0">{cat}</Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {productsLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <X className="h-12 w-12 mb-4 opacity-20" /><p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((product: any) => (
                <button key={product._id} onClick={() => addToCart(product)}
                  disabled={product.stock?.quantity <= 0}
                  className={cn("p-4 rounded-xl border bg-card hover:border-primary transition-all text-left group relative overflow-hidden flex flex-col justify-between h-44 shadow-sm",
                    product.stock?.quantity <= 0 ? "opacity-50 grayscale cursor-not-allowed" : "hover:shadow-md hover:shadow-primary/5"
                  )}>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider border">
                        {product.category?.name?.en || 'General'}
                      </span>
                      {product.stock?.quantity <= (product.inventory?.lowStockAlert || 10) && (
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {typeof product.name === 'string' ? product.name : product.name?.en}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">{product.sku}</p>
                  </div>
                  <div className="mt-auto">
                    <p className="text-xl font-black text-primary">{formatCurrency(product.pricing.sellingPrice)}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={cn("text-[10px] font-medium", product.stock?.quantity <= 5 ? "text-red-400" : "text-emerald-500")}>
                        {product.stock?.quantity || 0} {product.unit} left
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <Card className="w-[400px] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Cart ({cart.length})
          </CardTitle>
        </CardHeader>

        {/* Customer Info */}
        <div className="px-6 pb-4 space-y-2">
          <select className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
            <option value="">Walk-in Customer</option>
            {customersList.map((c: any) => (
              <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
            ))}
          </select>
          {!selectedCustomerId && (
            <div className="flex gap-2">
              <Input placeholder="Name (Optional)" className="h-9 text-sm" value={manualCustomerName} onChange={(e) => setManualCustomerName(e.target.value)} />
              <Input placeholder="Phone (Optional)" className="h-9 text-sm" value={manualCustomerPhone} onChange={(e) => setManualCustomerPhone(e.target.value)} />
            </div>
          )}
          {selectedCustomer && (
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-md border text-xs">
              <div><span className="text-muted-foreground">Type:</span> <span className="font-bold uppercase text-primary">{selectedCustomer.customerType}</span></div>
              <div><span className="text-muted-foreground">Spent:</span> <span className="font-bold text-emerald-600">{formatCurrency(selectedCustomer.loyalty?.lifetimeValue || 0)}</span></div>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4" /><p>Cart is empty</p><p className="text-sm">Click products to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <p className="font-medium text-sm leading-tight">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.id, -1)} className="h-7 w-7 flex items-center justify-center rounded-md border hover:bg-muted">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="h-7 w-7 flex items-center justify-center rounded-md border hover:bg-muted">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="w-20 text-right font-semibold text-sm">{formatCurrency(item.price * item.qty)}</span>
                    <button onClick={() => removeItem(item.id)} className="h-7 w-7 flex items-center justify-center text-destructive hover:bg-destructive/10 rounded-md">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="flex-shrink-0 border-t p-5 space-y-3 bg-muted/20">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Subtotal</span>
            <span className="font-bold">{formatCurrency(subtotal)}</span>
          </div>

          {/* Discount */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">Discount</span>
              <Input type="number" className="pl-16 h-9" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} />
            </div>
            <div className="flex border rounded-lg overflow-hidden h-9">
              <button className={cn("px-3 text-xs font-bold transition-colors", discountType === 'fixed' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}
                onClick={() => setDiscountType('fixed')}>৳</button>
              <button className={cn("px-3 text-xs font-bold transition-colors", discountType === 'percentage' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}
                onClick={() => setDiscountType('percentage')}>%</button>
            </div>
          </div>

          {/* Coupon */}
          <div className="flex gap-2">
            {appliedCoupon ? (
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-600">{appliedCoupon.code} applied!</p>
                  <p className="text-[10px] text-emerald-500">−{formatCurrency(couponDiscount)}</p>
                </div>
                <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-slate-400 hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input className="pl-9 h-9 text-sm uppercase font-mono" placeholder="Coupon code..."
                    value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon()} />
                </div>
                <Button variant="outline" size="sm" className="h-9 px-3 font-bold" onClick={applyCoupon} disabled={!couponCode || couponLoading}>
                  {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                </Button>
              </>
            )}
          </div>

          {/* VAT */}
          {vatEnabled && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Percent className="h-3.5 w-3.5" /> VAT ({vatRate}%)
              </span>
              <span className="font-bold">{formatCurrency(vat)}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="flex justify-between text-2xl font-black border-t pt-3 text-primary">
            <span>Total</span><span>{formatCurrency(grandTotal)}</span>
          </div>

          <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase">
            <span>Seller: {user?.profile?.firstName}</span>
            <span>Branch: {user?.branchId?.slice(-4) || 'Main'}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="flex-shrink-0 p-5 pt-0 bg-muted/20">
          <div className="grid grid-cols-4 gap-2">
            {paymentMethods.map(method => (
              <Button key={method.id} variant="outline"
                className="flex flex-col h-auto py-3 hover:bg-primary/10 hover:border-primary transition-all group"
                onClick={() => handleCheckout(method.id)}
                disabled={cart.length === 0 || checkoutMutation.isPending}>
                {checkoutMutation.isPending
                  ? <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  : <method.icon className={cn("h-6 w-6 mb-1 text-muted-foreground group-hover:text-primary")} />
                }
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary uppercase">{method.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {variantSelectProduct && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div>
                <h3 className="font-black text-lg text-white">Select Product Variant</h3>
                <p className="text-xs text-slate-400 mt-0.5">{variantSelectProduct.name?.en || variantSelectProduct.name}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => setVariantSelectProduct(null)}>✕</Button>
            </div>
            
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {variantSelectProduct.variants.map((v: any) => {
                const price = v.priceOverride !== undefined && v.priceOverride !== null
                  ? v.priceOverride
                  : variantSelectProduct.pricing.sellingPrice;
                return (
                  <button
                    key={v._id}
                    onClick={() => addToCartVariant(variantSelectProduct, v)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-primary/10 hover:border-primary transition-all text-left group"
                  >
                    <div>
                      <p className="font-bold text-white group-hover:text-primary transition-colors">{v.name}</p>
                      <p className="text-xs text-slate-400 mt-1">Stock: <span className={v.stock > 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>{v.stock} units</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-white">৳{price}</p>
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Select Variant</p>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
              <Button variant="outline" className="border-slate-800 text-slate-400 hover:text-white" onClick={() => setVariantSelectProduct(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}