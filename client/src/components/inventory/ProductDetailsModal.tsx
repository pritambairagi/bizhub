import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, Tag, Package, DollarSign, Layers, Calendar, User, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  product: any;
  onClose: () => void;
}

export default function ProductDetailsModal({ product, onClose }: Props) {
  const profit = product.pricing?.sellingPrice - product.pricing?.costPrice;
  const margin = product.pricing?.sellingPrice > 0 
    ? ((profit / product.pricing?.sellingPrice) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <Card className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 px-6 sticky top-0 bg-card z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary/10 text-primary rounded-full">
              Product Overview
            </span>
            <CardTitle className="text-xl font-bold mt-1">
              {product.name?.en || product.name}
            </CardTitle>
            {product.name?.bn && (
              <p className="text-sm text-muted-foreground font-medium">{product.name.bn}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {/* Main Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <Tag className="h-3.5 w-3.5 text-primary" /> Core Information
              </span>
              <div className="space-y-1 text-sm pt-1">
                <p><span className="text-muted-foreground">SKU:</span> <span className="font-semibold font-mono text-xs">{product.sku}</span></p>
                <p><span className="text-muted-foreground">Brand:</span> <span className="font-semibold">{product.brand || 'No Brand'}</span></p>
                <p><span className="text-muted-foreground">Category:</span> <span className="font-semibold">{product.category?.name?.en || product.category?.name || 'Uncategorized'}</span></p>
                <p><span className="text-muted-foreground">Unit:</span> <span className="font-semibold">{product.unit || 'পিস'}</span></p>
                {product.createdBy && (
                  <p>
                    <span className="text-muted-foreground">Added By:</span>{' '}
                    <span className="font-semibold text-primary">
                      {product.createdBy.profile?.firstName ? `${product.createdBy.profile.firstName} ${product.createdBy.profile.lastName || ''}` : product.createdBy.email || 'System'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-1.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                <Package className="h-3.5 w-3.5 text-primary" /> Stock Status
              </span>
              <div className="space-y-1 text-sm pt-1">
                <p>
                  <span className="text-muted-foreground">Total Stock:</span>{' '}
                  <span className="font-bold text-primary">
                    {product.stock?.quantity || 0} {product.unit || 'পিস'}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Available Stock:</span>{' '}
                  <span className="font-semibold text-emerald-600">
                    {product.stock?.available || 0} {product.unit || 'পিস'}
                  </span>
                </p>
                <p><span className="text-muted-foreground">Alert Threshold:</span> <span className="font-semibold text-amber-600">{product.inventory?.lowStockAlert || 10} {product.unit || 'পিস'}</span></p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <span className="badge badge-success text-[10px] font-bold uppercase py-0.5">
                    {product.status || 'Active'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="p-5 bg-gradient-to-br from-primary/5 to-muted/20 rounded-2xl border border-primary/10">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold mb-4">
              <DollarSign className="h-4 w-4 text-primary" /> Financial Metrics
            </span>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-card rounded-xl border">
                <p className="text-xs text-muted-foreground font-medium">Purchase Price</p>
                <p className="text-lg font-bold mt-1 text-foreground">{formatCurrency(product.pricing?.costPrice || 0)}</p>
              </div>
              <div className="p-3 bg-card rounded-xl border">
                <p className="text-xs text-muted-foreground font-medium">Selling Price</p>
                <p className="text-lg font-bold mt-1 text-primary">{formatCurrency(product.pricing?.sellingPrice || 0)}</p>
              </div>
              <div className="p-3 bg-card rounded-xl border">
                <p className="text-xs text-muted-foreground font-medium">Profit Margin</p>
                <p className="text-lg font-bold mt-1 text-emerald-600">
                  {formatCurrency(profit)} <span className="text-[10px] font-medium text-muted-foreground">({margin}%)</span>
                </p>
              </div>
            </div>
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold">
                <Layers className="h-4 w-4 text-primary" /> Product Variants
              </span>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase border-b">
                    <tr>
                      <th className="px-4 py-2">Variant</th>
                      <th className="px-4 py-2 text-right">Price Override</th>
                      <th className="px-4 py-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {product.variants.map((v: any, idx: number) => (
                      <tr key={idx} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-medium">{v.name}</td>
                        <td className="px-4 py-2.5 text-right font-semibold">
                          {v.priceOverride ? formatCurrency(v.priceOverride) : 'Default'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-muted-foreground">{v.stock} {product.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Description & Metadata */}
          <div className="space-y-4 pt-2 border-t">
            {product.description?.en && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold">
                  <FileText className="h-3.5 w-3.5 text-primary" /> Notes / Details
                </span>
                <p className="text-sm text-muted-foreground bg-muted/20 p-3.5 rounded-xl border border-border/50 leading-relaxed">
                  {product.description.en}
                </p>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Created: {new Date(product.createdAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Updated: {new Date(product.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>

        <div className="px-6 py-4 border-t bg-muted/20 flex justify-end">
          <Button onClick={onClose} className="px-6 shadow-md">
            Close Overview
          </Button>
        </div>
      </Card>
    </div>
  );
}
