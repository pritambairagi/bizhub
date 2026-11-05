import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { productsApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Warehouse,
  ArrowLeftRight,
  Download,
  Upload,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Package,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AddProductModal from '@/components/inventory/AddProductModal';
import ProductDetailsModal from '@/components/inventory/ProductDetailsModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

export default function Inventory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'add');
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<any | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterData, setFilterData] = useState({ brand: '', status: '', minStock: '', maxStock: '' });
  const [isImporting, setIsImporting] = useState(false);
  
  // URL sync
  useEffect(() => {
    if (searchParams.get('action') === 'add' && !showAddModal) {
      setShowAddModal(true);
    }
  }, [searchParams]);

  // Queries
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: () => productsApi.getInventoryStats().then(res => res.data.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories().then(res => res.data.data),
  });
  const categoriesList = categoriesData?.categories || [];

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', page, limit, search, selectedCategory],
    queryFn: () => productsApi.getAll({ page, limit, search, category: selectedCategory || undefined }).then(res => res.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast.success('Product deleted successfully');
    },
  });

  const products = productsData?.products || [];
  const pagination = productsData?.pagination || { total: 0, totalPages: 1 };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const rows = text.split('\n').map(row => row.split(','));
          const headers = rows[0].map(h => h.trim().toLowerCase().replace(/"/g, ''));
          const productsToImport = [];

          for (let i = 1; i < rows.length; i++) {
            if (rows[i].length < 3) continue;
            const row = rows[i].map(cell => cell.replace(/"/g, '').trim());
            const productData: any = {
              name: { en: row[0] || 'Unnamed Product' },
              brand: row[1] || '',
              sku: row[3] || `SKU-${Date.now()}-${i}`,
              pricing: {
                costPrice: Number(row[6]) || 0,
                sellingPrice: Number(row[7]) || 0,
                mrp: Number(row[8]) || 0,
              },
              stockQuantity: Number(row[4]) || 0,
              unit: row[5] || 'পিস',
              status: 'active',
            };

            const categoryName = row[2];
            if (categoryName) {
              const cat = categoriesList.find((c: any) =>
                (c.name?.en || c.name || '').toLowerCase() === categoryName.toLowerCase()
              );
              if (cat) {
                productData.category = cat._id;
              }
            }

            productsToImport.push(productData);
          }

          for (const product of productsToImport) {
            try {
              await productsApi.create(product);
            } catch (err) {
              console.warn('Failed to import product:', product.name, err);
            }
          }

          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
          toast.success(`Imported ${productsToImport.length} products successfully`);
        } catch (error) {
          toast.error('Failed to parse Excel file');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error('Failed to read file');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const applyFilters = () => {
    setSearchParams(prev => {
      if (filterData.brand) prev.set('brand', filterData.brand);
      if (filterData.status) prev.set('status', filterData.status);
      if (filterData.minStock) prev.set('minStock', filterData.minStock);
      if (filterData.maxStock) prev.set('maxStock', filterData.maxStock);
      return prev;
    });
    setShowFilterModal(false);
    setPage(1);
    toast.success('Filters applied');
  };

  const clearFilters = () => {
    setFilterData({ brand: '', status: '', minStock: '', maxStock: '' });
    setSearchParams({});
    setShowFilterModal(false);
    setPage(1);
    toast.success('Filters cleared');
  };

  const exportToCSV = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }
    const headers = ['Product Name', 'Brand', 'Category', 'SKU', 'Stock', 'Unit', 'Cost Price', 'Selling Price', 'MRP'];
    const rows = products.map((p: any) => [
      p.name?.en || p.name || '',
      p.brand || '',
      p.category?.name?.en || 'Uncategorized',
      p.sku || '',
      p.stock?.quantity || 0,
      p.unit || '',
      p.pricing?.costPrice || 0,
      p.pricing?.sellingPrice || 0,
      p.pricing?.mrp || '',
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map((e: (string | number)[]) => e.map((val: string | number) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory report exported as CSV/Excel');
  };

  const exportToPDF = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export PDF');
      return;
    }
    const tableRows = products.map((p: any, idx: number) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;"><b>${p.name?.en || p.name || ''}</b><br/><small>${p.brand || 'No Brand'}</small></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${p.category?.name?.en || 'Uncategorized'}<br/><small>${p.sku}</small></td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${p.stock?.quantity || 0} ${p.unit || 'pcs'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">৳${p.pricing?.costPrice?.toLocaleString() || 0}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">৳${p.pricing?.sellingPrice?.toLocaleString() || 0}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Inventory Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; color: #111; margin-bottom: 5px; }
            p { text-align: center; color: #666; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background-color: #f2f2f2; padding: 10px; border: 1px solid #ddd; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>BizHub ERP - Inventory Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product / Brand</th>
                <th>Category / SKU</th>
                <th>Stock</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const stats = statsData || {
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    stockValue: { investment: 0, profit: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold">Inventory Management</h2>
          <p className="text-muted-foreground">Manage your products and stock levels</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast.info('Warehouse management opening soon')}>
            <Warehouse className="h-4 w-4" />
            Warehouse/Shop
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => toast.info('Stock transfer modal opening soon')}>
            <ArrowLeftRight className="h-4 w-4" />
            Transfer Stock
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalProducts}</h3>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="text-emerald-500 font-medium">{stats.inStock} In Stock</span>
                  <span className="text-amber-500 font-medium">{stats.lowStock} Low</span>
                  <span className="text-destructive font-medium">{stats.outOfStock} Out</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Value</p>
                <h3 className="text-2xl font-bold mt-1">৳{stats.stockValue.investment.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-2">Total Investment</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Potential Profit</p>
                <h3 className="text-2xl font-bold mt-1">৳{stats.stockValue.profit.toLocaleString()}</h3>
                <p className="text-xs text-muted-foreground mt-2">Expected Revenue</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Alerts</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-500">{stats.lowStock}</h3>
                <p className="text-xs text-muted-foreground mt-2">Requires Attention</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search name, SKU, category..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          
          <select 
            className="h-10 px-3 rounded-md border border-input bg-background text-sm max-w-xs focus:ring-1 focus:ring-primary focus:outline-none"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories (সকল ক্যাটাগরি)</option>
            {categoriesList.map((c: any) => (
              <option key={c._id} value={c._id}>
                {c.name?.en || c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="gap-2" onClick={() => setShowFilterModal(true)}>
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <div className="h-8 w-[1px] bg-border hidden md:block mx-2" />
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcel} className="hidden" id="import-excel" />
          <label htmlFor="import-excel">
            <Button variant="outline" size="icon" title="Import Excel" className="cursor-pointer">
              <Upload className="h-4 w-4" />
            </Button>
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" title="Export">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2" onClick={exportToCSV}>
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={exportToPDF}>
                <FileText className="h-4 w-4 text-rose-600" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Product / Brand</th>
                <th>Category / SKU</th>
                <th>Stock / Unit</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>MRP</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="p-4"><div className="h-8 skeleton" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product: any, i: number) => (
                  <tr key={product._id}>
                    <td className="text-center text-muted-foreground">
                      {(page - 1) * limit + i + 1}
                    </td>
                    <td>
                      <div>
                        <p className="font-medium">{product.name.en}</p>
                        <p className="text-xs text-muted-foreground">{product.brand || 'No Brand'}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm">{product.category?.name?.en || 'Uncategorized'}</p>
                        <p className="text-xs font-mono text-muted-foreground">{product.sku}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          product.stock?.quantity <= (product.inventory?.lowStockAlert || 10) 
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                        )}>
                          {product.stock?.quantity || 0} {product.unit}
                        </span>
                      </div>
                    </td>
                    <td className="font-medium">৳{product.pricing.costPrice.toLocaleString()}</td>
                    <td className="font-medium">৳{product.pricing.sellingPrice.toLocaleString()}</td>
                    <td className="font-medium text-muted-foreground">৳{product.pricing.mrp?.toLocaleString() || '-'}</td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => setSelectedProductForDetails(product)}>
                            <Eye className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => setSelectedProductForEdit(product)}>
                            <Edit className="h-4 w-4" /> Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this product?')) {
                                deleteMutation.mutate(product._id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-4 border-t flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select 
                className="bg-transparent border-none focus:ring-0 cursor-pointer font-medium"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 25, 50, 100].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <span>
              {pagination.total === 0
                ? 'No products'
                : `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, pagination.total)} of ${pagination.total} product${pagination.total !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon-sm" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
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
                    className="w-8 h-8"
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
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {showAddModal && <AddProductModal onClose={() => {
        setShowAddModal(false);
        setSearchParams(prev => {
          prev.delete('action');
          return prev;
        });
      }} />}

      {selectedProductForEdit && (
        <AddProductModal 
          product={selectedProductForEdit} 
          onClose={() => setSelectedProductForEdit(null)} 
        />
      )}

      {selectedProductForDetails && (
        <ProductDetailsModal
          product={selectedProductForDetails}
          onClose={() => setSelectedProductForDetails(null)}
        />
      )}

      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Advanced Filters</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowFilterModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Input
                  placeholder="Filter by brand..."
                  value={filterData.brand}
                  onChange={e => setFilterData({...filterData, brand: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filterData.status}
                  onChange={e => setFilterData({...filterData, status: e.target.value})}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="damage">Damage</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Stock</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filterData.minStock}
                    onChange={e => setFilterData({...filterData, minStock: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Stock</label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={filterData.maxStock}
                    onChange={e => setFilterData({...filterData, maxStock: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>Clear All</Button>
                <Button className="flex-1" onClick={applyFilters}>Apply Filters</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}