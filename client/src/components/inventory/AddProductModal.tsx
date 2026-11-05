import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { productsApi, businessApi, suppliersApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Plus, Loader2, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const UNIT_TYPES = [
  '-- Select Unit --', 'পিস', 'পিয়ার', 'হালি', 'হাফ ডজন', 'ডজন', 'প্যাকেট', 'বক্স',
  'কার্টন', 'বান্ডেল', 'ইঞ্চি', 'ফুট', 'স্কয়ার ফুট', 'হাত', 'গজ', 'মিটার',
  'স্কয়ার মিটার', 'গ্রাম', 'কেজি', 'লিটার', 'মিলিলিটার', 'পাউন্ড', 'টন', 'অন্যান্য',
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Live' },
  { value: 'draft', label: 'Draft' },
  { value: 'damage', label: 'Damage' },
  { value: 'out_of_stock', label: 'Out of stock' },
];

interface Variant { name: string; priceOverride: string; stock: string; }

interface Props { 
  onClose: () => void; 
  product?: any;
}

export default function AddProductModal({ onClose, product }: Props) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nameEn: product?.name?.en || '',
    nameBn: product?.name?.bn || '',
    brand: product?.brand || '',
    sku: product?.sku || '',
    category: typeof product?.category === 'object' ? product?.category._id : product?.category || '',
    costPrice: product?.pricing?.costPrice !== undefined ? String(product.pricing.costPrice) : '',
    sellingPrice: product?.pricing?.sellingPrice !== undefined ? String(product.pricing.sellingPrice) : '',
    mrp: product?.pricing?.mrp !== undefined ? String(product.pricing.mrp) : '',
    branchId: product?.branchId || '',
    supplierId: product?.supplierId || '',
    stockQuantity: product?.stock?.quantity !== undefined ? String(product.stock.quantity) : '',
    unit: product?.unit || '',
    status: product?.status || 'active',
    description: product?.description?.en || '',
  });
  const [productImage, setProductImage] = useState<string>(product?.images?.[0] || '');
  const [imagePreview, setImagePreview] = useState<string>(product?.images?.[0] || '');
  const [isUploading, setIsUploading] = useState(false);

  const [variants, setVariants] = useState<Variant[]>(
    product?.variants?.map((v: any) => ({
      name: v.name || '',
      priceOverride: v.priceOverride !== undefined ? String(v.priceOverride) : '',
      stock: v.stock !== undefined ? String(v.stock) : '',
    })) || []
  );

  // Auto-suggestion Search States
  const [catSearch, setCatSearch] = useState('');
  const [showCatSuggestions, setShowCatSuggestions] = useState(false);
  const [supSearch, setSupSearch] = useState('');
  const [showSupSuggestions, setShowSupSuggestions] = useState(false);

  const catContainerRef = useRef<HTMLDivElement>(null);
  const supContainerRef = useRef<HTMLDivElement>(null);

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['all-categories'],
    queryFn: () => productsApi.getAllCategories(),
    retry: 1,
  });
  const categories = catData?.data?.data?.categories || [];

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => businessApi.getBranches(),
  });
  const rawBranches = branchesData?.data?.data || [];
  const branches = Array.isArray(rawBranches) 
    ? rawBranches 
    : (rawBranches.branches || []);

  const { data: supData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll()
  });
  const suppliers = supData?.data?.data || [];

  // Sync edits
  useEffect(() => {
    if (product) {
      if (product.category && categories.length > 0) {
        const targetId = typeof product.category === 'object' ? product.category._id : product.category;
        const cat = categories.find((c: any) => c._id === targetId);
        if (cat) setCatSearch(cat.name?.en || cat.name || '');
      }
      if (product.supplierId && suppliers.length > 0) {
        const sup = suppliers.find((s: any) => s._id === product.supplierId);
        if (sup) setSupSearch(sup.name || '');
      }
    }
  }, [product, categories, suppliers]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (catContainerRef.current && !catContainerRef.current.contains(e.target as Node)) {
        setShowCatSuggestions(false);
      }
      if (supContainerRef.current && !supContainerRef.current.contains(e.target as Node)) {
        setShowSupSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 500KB)
    if (file.size > 500 * 1024) {
      toast.error('Image size must be less than 500KB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to cloud (base64 for now, in production this would be uploaded to cloud storage)
    setIsUploading(true);
    try {
      // For demo: convert to base64 and use as URL
      // In production, you would upload to cloud storage (AWS S3, Cloudinary, etc.)
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
      });
      setProductImage(base64);
      toast.success('Image added (stored locally for demo)');
    } catch (error) {
      toast.error('Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => product ? productsApi.update(product._id, data) : productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || (product ? 'Failed to update product' : 'Failed to create product'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn || !formData.sku || !formData.category || !formData.costPrice || !formData.sellingPrice || !formData.unit) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // For creation, branch is required
    if (!product && !formData.branchId) {
      toast.error('Please select a branch to allocate initial stock');
      return;
    }

    createMutation.mutate({
      name: { en: formData.nameEn, bn: formData.nameBn },
      brand: formData.brand,
      sku: formData.sku,
      category: formData.category,
      pricing: {
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        mrp: Number(formData.mrp) || 0,
      },
      branchId: formData.branchId || undefined,
      supplierId: formData.supplierId || undefined,
      stockQuantity: variants.length > 0
        ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
        : Number(formData.stockQuantity) || 0,
      unit: formData.unit,
      status: formData.status,
      description: { en: formData.description },
      images: productImage ? [productImage] : [],
      variants: variants.filter(v => v.name).map(v => ({
        name: v.name,
        priceOverride: Number(v.priceOverride) || undefined,
        stock: Number(v.stock) || 0,
      })),
    });
  };

  const addVariant = () => setVariants([...variants, { name: '', priceOverride: '', stock: '' }]);
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));
  const updateVariant = (i: number, field: keyof Variant, val: string) => {
    const updated = [...variants];
    updated[i][field] = val;
    setVariants(updated);
  };

  // Auto suggestion filtering
  const filteredCats = categories.filter((c: any) => 
    (c.name?.en || c.name || '').toLowerCase().includes(catSearch.toLowerCase())
  );

  const filteredSups = suppliers.filter((s: any) => 
    (s.name || '').toLowerCase().includes(supSearch.toLowerCase()) || 
    (s.brand || s.companyName || '').toLowerCase().includes(supSearch.toLowerCase())
  );

  const selectClass = "w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-card z-10 border-b">
          <CardTitle className="font-bold text-slate-800">{product ? 'Edit Product Details' : 'Create New Product'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name (English) *</label>
                <Input required value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} placeholder="Product name" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Name (Bangla)</label>
                <Input value={formData.nameBn} onChange={e => setFormData({...formData, nameBn: e.target.value})} placeholder="পণ্যের নাম" />
              </div>
            </div>

            {/* Brand + SKU */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Brand</label>
                <Input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Brand name" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">SKU *</label>
                <Input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. RICE-MINI-5" />
              </div>
            </div>

            {/* Category + Branch + Supplier */}
            <div className="grid grid-cols-3 gap-4">
              {/* Category Search Auto-suggest */}
              <div className="space-y-1 relative" ref={catContainerRef}>
                <label className="text-sm font-medium">Category *</label>
                <Input 
                  required
                  placeholder="Type Category..." 
                  value={catSearch}
                  onFocus={() => setShowCatSuggestions(true)}
                  onChange={e => {
                    setCatSearch(e.target.value);
                    setShowCatSuggestions(true);
                    // Clear selected ID if typing manually, or find perfect match
                    const match = categories.find((c: any) => (c.name?.en || c.name || '').toLowerCase() === e.target.value.toLowerCase());
                    setFormData({...formData, category: match ? match._id : ''});
                  }}
                  className="bg-background text-sm"
                />
                {showCatSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto">
                    {catLoading ? (
                      <p className="p-3 text-xs text-slate-400">Loading categories...</p>
                    ) : filteredCats.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 italic flex items-center justify-between">
                        <span>New category?</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] text-primary" 
                          onClick={async () => {
                            try {
                              const res = await productsApi.createCategory({ name: { en: catSearch } });
                              const newCat = res.data.data.category;
                              queryClient.invalidateQueries({ queryKey: ['all-categories'] });
                              setFormData({...formData, category: newCat._id});
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
                            setFormData({...formData, category: cat._id});
                            setCatSearch(cat.name?.en || cat.name);
                            setShowCatSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-between"
                        >
                          <span>{cat.name?.en || cat.name}</span>
                          {formData.category === cat._id && <Check className="h-3.5 w-3.5 text-primary" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Branch Select */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Select Branch *</label>
                <select 
                  required={!product}
                  disabled={!!product}
                  className={cn(selectClass, !!product && "opacity-60 bg-muted cursor-not-allowed")} 
                  value={formData.branchId} 
                  onChange={e => setFormData({...formData, branchId: e.target.value})}
                >
                  <option value="">Select Branch</option>
                  {branches.map((b: any) => (
                    <option key={b._id} value={b._id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              {/* Supplier Search Auto-suggest */}
              <div className="space-y-1 relative" ref={supContainerRef}>
                <label className="text-sm font-medium">Supplier</label>
                <Input 
                  placeholder="Type Supplier Name..." 
                  value={supSearch}
                  onFocus={() => setShowSupSuggestions(true)}
                  onChange={e => {
                    setSupSearch(e.target.value);
                    setShowSupSuggestions(true);
                    // Clear selected ID if typing manually, or find perfect match
                    const match = suppliers.find((s: any) => s.name.toLowerCase() === e.target.value.toLowerCase());
                    setFormData({...formData, supplierId: match ? match._id : ''});
                  }}
                  className="bg-background text-sm"
                />
                {showSupSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto">
                    {filteredSups.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 italic flex items-center justify-between">
                        <span>New supplier?</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] text-primary" 
                          onClick={async () => {
                            try {
                              const res = await suppliersApi.create({ name: supSearch, phone: '01000000000' });
                              const newSup = res.data.data;
                              queryClient.invalidateQueries({ queryKey: ['suppliers'] });
                              setFormData({...formData, supplierId: newSup._id});
                              setSupSearch(newSup.name);
                              setShowSupSuggestions(false);
                              toast.success('Supplier created dynamically with default phone');
                            } catch (err) {
                              toast.error('Failed to create supplier');
                            }
                          }}
                        >
                          + Create "{supSearch}"
                        </Button>
                      </div>
                    ) : (
                      filteredSups.map((sup: any) => (
                        <button
                          key={sup._id}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, supplierId: sup._id});
                            setSupSearch(sup.name);
                            setShowSupSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold">{sup.name}</p>
                            <p className="text-[10px] text-slate-400">{sup.companyName || sup.brand || 'No Company'}</p>
                          </div>
                          {formData.supplierId === sup._id && <Check className="h-3.5 w-3.5 text-primary" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Cost(Purchase) Price *</label>
                <Input required type="number" min="0" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Selling Price *</label>
                <Input required type="number" min="0" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">MRP</label>
                <Input type="number" min="0" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} />
              </div>
            </div>

            {/* Stock + Unit + Status */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {variants.length > 0 ? 'Total Stock (Auto-calculated)' : 'Stock Quantity *'}
                </label>
                <Input
                  required
                  disabled={!!product || variants.length > 0}
                  className={cn(!!product || variants.length > 0 ? "opacity-60 bg-muted cursor-not-allowed" : "", variants.length > 0 && "border-primary")}
                  type="number"
                  min="0"
                  value={variants.length > 0
                    ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
                    : formData.stockQuantity
                  }
                  onChange={e => setFormData({...formData, stockQuantity: e.target.value})}
                />
                {variants.length > 0 && (
                  <p className="text-[10px] text-primary">
                    {variants.length} variant(s) × Stock = Total: {variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)} units
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Unit Type *</label>
                <select required className={selectClass} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                  {UNIT_TYPES.map(u => (
                    <option key={u} value={u === '-- Select Unit --' ? '' : u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status *</label>
                <select required className={selectClass} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {product && (
              <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded border border-border/60">
                💡 Initial stock and Branch allocation cannot be modified directly after product creation. To adjust stock levels, please use <strong>Stock Adjustments</strong>, <strong>Purchases</strong> or the <strong>POS</strong> modules.
              </p>
            )}

            {/* Variants */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Product Variants/Sizes (Optional)</label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="h-3 w-3 mr-1" /> Add Variant
                </Button>
              </div>
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <Input placeholder="Variant Name (e.g. XL, Red)" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} />
                  <Input type="number" placeholder="Price Override" value={v.priceOverride} onChange={e => updateVariant(i, 'priceOverride', e.target.value)} />
                  <Input type="number" placeholder="Stock" value={v.stock} onChange={e => updateVariant(i, 'stock', e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(i)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>

            {/* Product Image (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Image (Optional)</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Product" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400 text-center p-2">No Image</span>
                    )}
                  </div>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => { setImagePreview(''); setProductImage(''); }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-sm"
                    disabled={isUploading}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Optional. Max size: 500KB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Note (Description)</label>
              <textarea className={`${selectClass} min-h-[80px] resize-y`} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Product description..." />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary text-white hover:bg-primary/95" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {product ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
