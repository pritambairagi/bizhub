import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { productsApi, uploadApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, Package, Edit, Trash2, Eye, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';

export default function Products() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: { en: '', bn: '' },
    sku: '',
    barcode: '',
    category: '',
    description: { en: '', bn: '' },
    pricing: {
      costPrice: 0,
      sellingPrice: 0,
      mrp: 0,
    },
    images: [] as string[],
    status: 'active',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const tId = toast.loading('Uploading product image...');
    try {
      const res = await uploadApi.upload(file);
      const url = res.data.data.url;
      setFormData(prev => ({ ...prev, images: [url] }));
      toast.success('Product image uploaded successfully', { id: tId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: tId });
    } finally {
      setUploadingImage(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productsApi.getAll({ page, limit: 20, search }),
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.data?.data?.products || [];
  const pagination = data?.data?.data?.pagination || { page: 1, total: 0, totalPages: 1 };

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  });

  const categories = categoriesData?.data?.data?.categories || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
      setShowAddModal(false);
      setFormData({
        name: { en: '', bn: '' },
        sku: '',
        barcode: '',
        category: '',
        description: { en: '', bn: '' },
        pricing: {
          costPrice: 0,
          sellingPrice: 0,
          mrp: 0,
        },
        images: [],
        status: 'active',
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold">Products</h2>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            {/* Product Image Upload Panel */}
            <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden border bg-muted flex items-center justify-center">
                {formData.images && formData.images[0] ? (
                  <img src={formData.images[0]} alt="Product" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-background/85 flex items-center justify-center animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Product Display Image</p>
                <p className="text-[10px] text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
                <div className="flex items-center gap-2 mt-1">
                  <label className={cn(
                    "inline-flex items-center justify-center rounded-md text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-2.5 cursor-pointer",
                    uploadingImage && "opacity-50 pointer-events-none"
                  )}>
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                  {formData.images && formData.images[0] && (
                    <Button type="button" variant="ghost" className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 px-2" onClick={() => setFormData({...formData, images: []})}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name (English) *</label>
                <Input
                  required
                  value={formData.name.en}
                  onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                  placeholder="e.g. Miniket Rice 5kg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Name (Bangla)</label>
                <Input
                  value={formData.name.bn}
                  onChange={(e) => setFormData({ ...formData, name: { ...formData.name, bn: e.target.value } })}
                  placeholder="e.g. মিনিকেট চাল ৫ কেজি"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU *</label>
                <Input
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. RICE-MINI-5"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <select
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name?.en || cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost Price *</label>
                <Input
                  required
                  type="number"
                  value={formData.pricing.costPrice}
                  onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, costPrice: Number(e.target.value) } })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Selling Price *</label>
                <Input
                  required
                  type="number"
                  value={formData.pricing.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, sellingPrice: Number(e.target.value) } })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">MRP</label>
                <Input
                  type="number"
                  value={formData.pricing.mrp}
                  onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, mrp: Number(e.target.value) } })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 skeleton rounded-lg" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4" />
                Add your first product
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Stock</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product: Record<string, unknown>) => (
                      <tr key={product._id as string}>
                        <td>
                          <div className="flex items-center gap-3">
                            {Array.isArray(product.images) && product.images[0] ? (
                              <img src={product.images[0]} alt={(product.name as any)?.en} className="h-10 w-10 rounded-lg object-cover border border-muted/50 flex-shrink-0" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{(product.name as Record<string, string>)?.en}</p>
                              <p className="text-xs text-muted-foreground">
                                {(product.name as Record<string, string>)?.bn}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-sm">{product.sku as string}</td>
                        <td>{((product.category as any)?.name as any)?.en || '-'}</td>
                        <td className="text-right font-medium">
                          {formatCurrency((product.pricing as Record<string, number>)?.sellingPrice || 0)}
                        </td>
                        <td className="text-right">
                          <span className="text-muted-foreground">-</span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
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
                  Showing {products.length} of {pagination.total} products
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