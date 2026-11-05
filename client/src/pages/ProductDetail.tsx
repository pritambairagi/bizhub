import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { productsApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Package, Edit, Trash2, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: { en: '', bn: '' },
    sku: '',
    barcode: '',
    description: { en: '', bn: '' },
    costPrice: 0,
    sellingPrice: 0,
    mrp: 0,
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
  });

  const product = data?.data?.data?.product;

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => productsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Product updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update product');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => productsApi.delete(id!),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      window.location.href = '/products';
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 skeleton rounded" />
        <div className="h-64 skeleton rounded-lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Product not found</p>
        <Link to="/products">
          <Button className="mt-4">Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-heading font-semibold">{(product.name as { en?: string })?.en}</h2>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this product?')) {
                    deleteMutation.mutate();
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name (English)</label>
              {isEditing ? (
                <Input
                  value={formData.name.en}
                  onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1">{(product.name as { en?: string })?.en}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name (Bangla)</label>
              {isEditing ? (
                <Input
                  value={formData.name.bn}
                  onChange={(e) => setFormData({ ...formData, name: { ...formData.name, bn: e.target.value } })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 font-bn">{(product.name as { bn?: string })?.bn || '-'}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">SKU</label>
                <p className="mt-1 font-mono">{product.sku}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Barcode</label>
                <p className="mt-1 font-mono">{product.barcode || '-'}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <p className="mt-1">{(product.category as { name?: string })?.name || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cost Price</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium">{formatCurrency((product.pricing as { costPrice?: number })?.costPrice || 0)}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Selling Price</label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 font-medium">{formatCurrency((product.pricing as { sellingPrice?: number })?.sellingPrice || 0)}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">MRP</label>
                <p className="mt-1">{formatCurrency((product.pricing as { mrp?: number })?.mrp || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Wholesale Price</label>
                <p className="mt-1">{formatCurrency((product.pricing as { wholeSalePrice?: number })?.wholeSalePrice || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">VAT Rate</label>
                <p className="mt-1">{((product.tax as { vatRate?: number })?.vatRate || 0)}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="mt-1 capitalize">{product.status as string}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}