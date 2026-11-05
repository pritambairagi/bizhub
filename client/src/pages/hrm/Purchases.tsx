import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { purchasesApi, productsApi, businessApi, suppliersApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  History, 
  ShoppingCart, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  User,
  Package,
  ArrowRight,
  Truck,
  Edit,
  Check
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

export default function Purchases() {
  const [activeTab, setActiveTab] = useState('new');
  const [search, setSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  const [items, setItems] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [purchaseNumber, setPurchaseNumber] = useState(`PUR-${Date.now().toString().slice(-6)}`);
  const [paidAmount, setPaidAmount] = useState(0);
  const [warehouseId, setWarehouseId] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', sku: '', costPrice: 0, qty: 1 });

  const queryClient = useQueryClient();

  const [manualCategory, setManualCategory] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);
  const catContainerRef = useRef<HTMLDivElement>(null);
  const [manualUnit, setManualUnit] = useState('পিস');
  const [invoiceType, setInvoiceType] = useState('Standard');

  const { data: productsData } = useQuery({
    queryKey: ['products', search],
    queryFn: () => productsApi.getAll({ search, limit: 10 }),
    enabled: search.length > 1
  });

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll()
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => businessApi.getWarehouses()
  });

  const { data: allProductsData } = useQuery({
    queryKey: ['all-products-list'],
    queryFn: () => productsApi.getAll({ limit: 1000 })
  });
  const allProducts = allProductsData?.data?.data?.products || [];

  const { data: catData } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => productsApi.getAllCategories()
  });
  const categories = catData?.data?.data?.categories || [];
  const catSearchValue = catSearch ?? '';
  const filteredCats = categories.filter((c: any) =>
    (c.name?.en || c.name || '').toLowerCase().includes(catSearchValue.toLowerCase())
  );

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['purchases', page, limit, historySearch],
    queryFn: () => purchasesApi.getAll({ page, limit, search: historySearch }),
    enabled: activeTab === 'history'
  });

  const createPurchaseMutation = useMutation({
    mutationFn: (data: any) => purchasesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Purchase recorded successfully');
      setItems([]);
      setSupplierId('');
      setSupplierName('');
      setPaidAmount(0);
      setPurchaseNumber(`PUR-${Date.now().toString().slice(-6)}`);
      setActiveTab('history');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record purchase');
    }
  });

  const addItem = (product: any) => {
    const existing = items.find(i => i.productId === product._id);
    if (existing) {
      setItems(items.map(i => i.productId === product._id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItems([...items, {
        productId: product._id,
        name: product.name.en || product.name,
        sku: product.sku,
        qty: 1,
        costPrice: product.pricing?.costPrice || 0,
      }]);
    }
    setSearch('');
  };

  const createProductMutation = useMutation({
    mutationFn: (data: any) => productsApi.create(data),
    onSuccess: (res: any) => {
      const product = res.data?.data || res.data;
      setItems([...items, {
        productId: product._id,
        name: product.name?.en || product.name || manualItem.name,
        sku: product.sku,
        qty: manualItem.qty,
        costPrice: manualItem.costPrice,
      }]);
      setManualItem({ name: '', sku: '', costPrice: 0, qty: 1 });
      setManualCategory('');
      setCatSearch('');
      setIsManualEntry(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products-list'] });
      toast.success('Product added to inventory and purchase list');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create product in inventory');
    }
  });

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (catContainerRef.current && !catContainerRef.current.contains(e.target as Node)) {
        setShowCatSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const addManualItem = () => {
    if (!manualItem.name || !manualItem.qty) return toast.error('Name and Qty are required');
    if (!manualCategory) return toast.error('Category is required for new product');
    if (!warehouseId) return toast.error('Please select warehouse first to add product');

    createProductMutation.mutate({
      name: { en: manualItem.name },
      sku: manualItem.sku || `SKU-${Date.now()}`,
      category: manualCategory,
      pricing: { costPrice: manualItem.costPrice, sellingPrice: manualItem.costPrice * 1.2, mrp: 0 },
      unit: manualUnit,
      status: 'active',
      warehouseId,
      stockQuantity: 0 // Will be incremented by purchase
    });
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.productId !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(i => i.productId === id ? { ...i, [field]: value } : i));
  };

  const subtotal = items.reduce((sum, i) => sum + (i.qty * i.costPrice), 0);
  const total = subtotal;

  const handleComplete = () => {
    if (!supplierName) return toast.error('Supplier name is required');
    if (!warehouseId) return toast.error('Select a warehouse to receive stock');
    if (items.length === 0) return toast.error('Add at least one item');

    const purchaseData = {
      supplierId,
      supplierName,
      purchaseNumber,
      items: items.map(i => ({
        productId: i.productId,
        name: i.name,
        sku: i.sku,
        qty: i.qty,
        costPrice: i.costPrice
      })),
      paidAmount,
      warehouseId,
      purchaseDate: new Date(),
      note: `Invoice Type: ${invoiceType}`
    };

    createPurchaseMutation.mutate(purchaseData);
  };



  const purchases = historyData?.data?.data?.purchases || [];
  const pagination = historyData?.data?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  const warehouses = warehousesData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-white">Purchase & Procurement</h2>
          <p className="text-slate-400">Record stock acquisitions and manage supplier costs</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setActiveTab('new')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === 'new' ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-700/50"
            )}
          >
            <Plus className="h-4 w-4 inline-block mr-2" />
            New Purchase
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === 'history' ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-700/50"
            )}
          >
            <History className="h-4 w-4 inline-block mr-2" />
            Purchase History
          </button>
        </div>
      </div>

      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight">Purchase Invoice</h3>
                      <p className="text-xs text-slate-500 font-mono">{purchaseNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <select 
                      className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold uppercase rounded px-2 py-1"
                      value={invoiceType}
                      onChange={e => setInvoiceType(e.target.value)}
                    >
                      <option value="Standard">Standard Invoice</option>
                      <option value="Tax">Tax Invoice</option>
                      <option value="Proforma">Proforma</option>
                      <option value="Credit">Credit Note</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-lg">Product Selection</CardTitle>
                    <CardDescription>Search for products or enter manually</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsManualEntry(!isManualEntry)}
                    className="bg-slate-800 border-slate-700 text-slate-300"
                  >
                    {isManualEntry ? 'Search Product' : 'Manual Entry'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isManualEntry ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="text-xs font-medium text-slate-400 mb-1 block">Select Product from Inventory</label>
                      <select 
                        className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                        onChange={e => {
                          if(!e.target.value) return;
                          const p = allProducts.find((x: any) => x._id === e.target.value);
                          if(p) addItem(p);
                          e.target.value = '';
                        }}
                      >
                        <option value="">-- Choose a product --</option>
                        {allProducts.map((p: any, idx: number) => (
                          <option key={p._id} value={p._id}>
                            {idx + 1}. {p.name?.en || p.name} (SKU: {p.sku}) - Stock: {p.stock?.quantity || 0}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="relative flex items-center gap-2">
                      <div className="h-[1px] flex-1 bg-slate-800"></div>
                      <span className="text-xs text-slate-500 font-medium uppercase">OR SEARCH</span>
                      <div className="h-[1px] flex-1 bg-slate-800"></div>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input 
                        placeholder="Search by SKU, Name or Scan Barcode..."
                        className="pl-9 bg-slate-800 border-slate-700 text-white"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                      
                      {search.length > 1 && productsData?.data?.data?.products?.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                          {productsData?.data?.data?.products?.map((p: any) => (
                            <button
                              key={p._id}
                              className="w-full flex items-center justify-between p-3 hover:bg-slate-700 transition-colors text-left border-b border-slate-700 last:border-0"
                              onClick={() => addItem(p)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                                  <Package className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{p.name.en || p.name}</p>
                                  <p className="text-xs text-slate-500">SKU: {p.sku}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-emerald-400">{formatCurrency(p.pricing.costPrice)}</p>
                                <p className="text-[10px] text-slate-500">Stock: {p.stock?.quantity || 0}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-800/30 rounded-lg border border-slate-800">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-slate-400">Product Name</label>
                      <Input 
                        value={manualItem.name}
                        onChange={e => setManualItem({ ...manualItem, name: e.target.value })}
                        placeholder="Item name"
                        className="h-8 bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div className="relative" ref={catContainerRef}>
                      <label className="text-xs font-medium text-slate-400">Category *</label>
                      <Input 
                        placeholder="Type Category..." 
                        value={catSearch}
                        onFocus={() => setShowCatSuggestions(true)}
                        onChange={e => {
                          setCatSearch(e.target.value);
                          setShowCatSuggestions(true);
                          const match = categories.find((c: any) => (c.name?.en || c.name || '').toLowerCase() === e.target.value.toLowerCase());
                          setManualCategory(match ? match._id : '');
                        }}
                        className="h-8 bg-slate-800 border-slate-700 text-xs text-white"
                      />
                      {showCatSuggestions && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 text-white rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                          {filteredCats.length === 0 ? (
                            <div className="p-2 text-[10px] text-slate-500 italic flex items-center justify-between">
                              <span>New category?</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 text-[9px] text-primary hover:bg-slate-800" 
                                onClick={async () => {
                                  try {
                                    const res = await productsApi.createCategory({ name: { en: catSearch } });
                                    const newCat = res.data.data.category;
                                    queryClient.invalidateQueries({ queryKey: ['all-categories'] });
                                    setManualCategory(newCat._id);
                                    setCatSearch(newCat.name?.en || newCat.name);
                                    setShowCatSuggestions(false);
                                    toast.success('Category created dynamically');
                                  } catch (err) {
                                    toast.error('Failed to create category');
                                  }
                                }}
                              >
                                + Create "{catSearch}"
                              </Button>
                            </div>
                          ) : (
                            filteredCats.map((cat: any) => (
                              <button
                                key={cat._id}
                                type="button"
                                onClick={() => {
                                  setManualCategory(cat._id);
                                  setCatSearch(cat.name?.en || cat.name);
                                  setShowCatSuggestions(false);
                                }}
                                className="w-full text-left px-2 py-1.5 text-[11px] hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-between"
                              >
                                <span>{cat.name?.en || cat.name}</span>
                                {manualCategory === cat._id && <Check className="h-3 w-3 text-primary" />}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400">Unit *</label>
                      <select 
                        className="w-full h-8 rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-white"
                        value={manualUnit}
                        onChange={e => setManualUnit(e.target.value)}
                      >
                        <option value="পিস">পিস</option>
                        <option value="কেজি">কেজি</option>
                        <option value="লিটার">লিটার</option>
                        <option value="বক্স">বক্স</option>
                        <option value="প্যাকেট">প্যাকেট</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400">SKU (Optional)</label>
                      <Input 
                        value={manualItem.sku}
                        onChange={e => setManualItem({ ...manualItem, sku: e.target.value })}
                        placeholder="SKU"
                        className="h-8 bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400">Qty</label>
                      <Input 
                        type="number"
                        value={manualItem.qty}
                        onChange={e => setManualItem({ ...manualItem, qty: Number(e.target.value) })}
                        className="h-8 bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-400">Cost Price</label>
                      <Input 
                        type="number"
                        value={manualItem.costPrice}
                        onChange={e => setManualItem({ ...manualItem, costPrice: Number(e.target.value) })}
                        className="h-8 bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button size="sm" className="w-full h-8" onClick={addManualItem}>
                        <Plus className="h-3 w-3 mr-1" /> Add Item
                      </Button>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-400">Product</th>
                        <th className="px-4 py-3 text-left text-slate-400">Qty</th>
                        <th className="px-4 py-3 text-left text-slate-400">Cost Price</th>
                        <th className="px-4 py-3 text-right text-slate-400">Total</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {items.length === 0 ? (
                        <tr><td colSpan={5} className="p-12 text-center text-slate-500">No products added yet.</td></tr>
                      ) : items.map(item => (
                        <tr key={item.productId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{item.name}</p>
                            <p className="text-[10px] text-slate-500">{item.sku}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Input 
                              type="number" 
                              className="w-20 h-8 bg-slate-800 border-slate-700 text-white" 
                              value={item.qty}
                              onChange={e => updateItem(item.productId, 'qty', Number(e.target.value))}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input 
                              type="number" 
                              className="w-24 h-8 bg-slate-800 border-slate-700 text-white" 
                              value={item.costPrice}
                              onChange={e => updateItem(item.productId, 'costPrice', Number(e.target.value))}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-white">
                            {formatCurrency(item.qty * item.costPrice)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.productId)} className="text-slate-500 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Purchase Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Supplier Name *</label>
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                      value={supplierId}
                      onChange={e => {
                        const s = suppliersData?.data?.data?.find((x: any) => x._id === e.target.value);
                        setSupplierId(e.target.value);
                        setSupplierName(s?.name || '');
                      }}
                    >
                      <option value="">Select Supplier</option>
                      {suppliersData?.data?.data?.map((s: any) => (
                        <option key={s._id} value={s._id}>{s.name} ({s.brand})</option>
                      ))}
                    </select>
                    <Button variant="outline" size="icon" className="bg-slate-800 border-slate-700">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {!supplierId && (
                    <Input 
                      value={supplierName}
                      onChange={e => setSupplierName(e.target.value)}
                      placeholder="Or enter manual name"
                      className="bg-slate-800 border-slate-700 text-white mt-2"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Purchase Number</label>
                  <Input 
                    value={purchaseNumber}
                    onChange={e => setPurchaseNumber(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Warehouse *</label>
                  <select 
                    className="w-full h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                    value={warehouseId}
                    onChange={e => setWarehouseId(e.target.value)}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w: any) => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">Order Summary</CardTitle>
                <CardDescription>
                  {items.length > 0 ? (
                    <span>Purchasing <strong className="text-white">{items.reduce((acc, i) => acc + i.qty, 0)}</strong> items from <strong className="text-white">{supplierName || 'Unknown Supplier'}</strong></span>
                  ) : (
                    "Add items to see summary"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax</span>
                  <span className="text-white font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between">
                  <span className="text-lg font-bold text-white">Total</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
                </div>

                <div className="pt-4 space-y-2">
                  <label className="text-sm font-medium text-slate-400">Paid Amount (৳)</label>
                  <Input 
                    type="number"
                    value={paidAmount || ''}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    className="bg-slate-800 border-slate-700 text-white text-lg font-bold"
                  />
                </div>

                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-500">Due Amount</span>
                  <span className="text-red-400 font-bold">{formatCurrency(Math.max(0, total - paidAmount))}</span>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white mt-4 h-12 text-lg font-bold shadow-lg shadow-primary/20"
                  onClick={handleComplete}
                  disabled={createPurchaseMutation.isPending || items.length === 0}
                >
                  Complete Purchase
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search history..."
                className="pl-9 bg-slate-800 border-slate-700 text-white"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-400">Date</th>
                    <th className="px-4 py-3 text-left text-slate-400">Purchase #</th>
                    <th className="px-4 py-3 text-left text-slate-400">Supplier</th>
                    <th className="px-4 py-3 text-center text-slate-400">Items</th>
                    <th className="px-4 py-3 text-right text-slate-400">Total</th>
                    <th className="px-4 py-3 text-right text-slate-400">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {historyLoading ? (
                    <tr><td colSpan={7} className="p-8 text-center animate-pulse text-slate-500">Loading history...</td></tr>
                  ) : purchases.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-500">No purchase records found.</td></tr>
                  ) : purchases.map((p: any) => (
                    <tr key={p._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(p.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-white">{p.purchaseNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-slate-500" />
                          <span className="text-white">{p.supplierName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">
                        {p.items?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {formatCurrency(p.total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                      ? 'No purchases'
                      : `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, pagination.total)} of ${pagination.total} purchase${pagination.total !== 1 ? 's' : ''}`}
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
