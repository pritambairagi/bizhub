import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { productsApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Folder,
  Edit,
  Trash2,
  ChevronRight,
  Package,
  LayoutGrid,
  Layers,
  ArrowRight,
  Check
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export default function Categories() {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: { en: '', bn: '' },
    slug: '',
    parentId: '',
  });

  // Auto-suggestion states
  const [catSearch, setCatSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const catContainerRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // Fetch Categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getAllCategories(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Products for selected category
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['category-products', selectedCategoryId],
    queryFn: () => productsApi.getAll({ category: selectedCategoryId, limit: 100 }),
    enabled: !!selectedCategoryId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => productsApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category added successfully');
      setShowAddModal(false);
      setFormData({ name: { en: '', bn: '' }, slug: '', parentId: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add category');
    },
  });

  const categories = categoriesData?.data?.data?.categories || [];
  const products = productsData?.data?.data?.products || [];
  const selectedCategory = categories.find((c: any) => c._id === selectedCategoryId);

  // Filter categories for auto-suggest
  const filteredCats = categories.filter((c: any) =>
    (c.name?.en || c.name || '').toLowerCase().includes(catSearch.toLowerCase())
  );

  // Click outside to close suggestions
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (catContainerRef.current && !catContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleAddCategory = () => {
    if (!formData.name.en) return toast.error('Name is required');
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-white">Product Categories</h2>
          <p className="text-slate-400">Organize and manage your inventory hierarchy</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search categories..."
              className="pl-9 bg-slate-900 border-slate-800 text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
            {categoriesLoading ? (
              [...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-800/50 animate-pulse rounded-xl" />)
            ) : categories.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
                <Folder className="h-12 w-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No categories found</p>
              </div>
            ) : (
              categories.map((cat: any) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategoryId(cat._id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                    selectedCategoryId === cat._id 
                      ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" 
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                      selectedCategoryId === cat._id ? "bg-primary text-white" : "bg-slate-800 text-slate-500 group-hover:text-slate-300"
                    )}>
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={cn("font-semibold", selectedCategoryId === cat._id ? "text-white" : "text-slate-300")}>
                        {cat.name.en}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{cat.slug}</p>
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    selectedCategoryId === cat._id ? "text-primary translate-x-1" : "text-slate-700"
                  )} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Category Items View */}
        <div className="lg:col-span-8">
          {!selectedCategoryId ? (
            <Card className="h-full bg-slate-950 border-slate-900 flex flex-col items-center justify-center text-center p-12 border-dashed">
              <div className="h-20 w-20 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                <LayoutGrid className="h-10 w-10 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-300 mb-2">Select a category</h3>
              <p className="text-slate-500 max-w-xs">Click on a category from the left to view and manage all products assigned to it.</p>
            </Card>
          ) : (
            <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
              <CardHeader className="border-b border-slate-800 bg-slate-900/50 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white text-xl">{selectedCategory?.name.en}</CardTitle>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20">
                      {products.length} Items
                    </span>
                  </div>
                  <CardDescription className="text-slate-500">List of all products in this category</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto">
                {productsLoading ? (
                  <div className="p-8 space-y-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-slate-800/50 animate-pulse rounded-lg" />)}
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package className="h-12 w-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-600">No products assigned to this category yet.</p>
                    <Button variant="link" className="text-primary mt-2">Add a product now</Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {products.map((p: any) => (
                      <div key={p._id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-6 w-6 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-primary transition-colors">{p.name.en}</p>
                            <div className="flex gap-3 text-xs text-slate-500 mt-1">
                              <span>SKU: <span className="text-slate-300 font-mono">{p.sku}</span></span>
                              <span>Price: <span className="text-emerald-400 font-bold">{formatCurrency(p.pricing.sellingPrice)}</span></span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white">
                          Details <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-700 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Create New Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative" ref={catContainerRef}>
                <label className="text-sm font-medium text-slate-400">Category Name (English) *</label>
                <Input
                  value={catSearch || formData.name.en}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setCatSearch(e.target.value);
                    setShowSuggestions(true);
                    setFormData({ ...formData, name: { ...formData.name, en: e.target.value }, slug: e.target.value.toLowerCase().replace(/ /g, '-') });
                  }}
                  className="mt-1 bg-slate-800 border-slate-700 text-white"
                  placeholder="Type to search or create new..."
                />
                {showSuggestions && catSearch && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 text-white rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                    {filteredCats.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 italic flex items-center justify-between">
                        <span>New category?</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] text-primary"
                          onClick={() => {
                            setShowSuggestions(false);
                          }}
                        >
                          + Create "{catSearch}"
                        </Button>
                      </div>
                    ) : (
                      filteredCats.slice(0, 5).map((cat: any) => (
                        <button
                          key={cat._id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, name: { en: cat.name?.en || cat.name, bn: cat.name?.bn || '' }, slug: cat.slug });
                            setCatSearch(cat.name?.en || cat.name);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-between"
                        >
                          <span>{cat.name?.en || cat.name}</span>
                          {(formData.name.en === cat.name?.en || formData.name.en === cat.name) && <Check className="h-3 w-3 text-primary" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">Bangla Name</label>
                <Input
                  value={formData.name.bn}
                  onChange={(e) => setFormData({ ...formData, name: { ...formData.name, bn: e.target.value } })}
                  className="mt-1 bg-slate-800 border-slate-700 text-white"
                  placeholder="উদাঃ ইলেকট্রনিক্স"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">URL Slug</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="mt-1 bg-slate-800 border-slate-700 text-slate-500"
                />
              </div>
              <div className="flex gap-3 pt-6">
                <Button variant="outline" className="flex-1 border-slate-700 text-slate-400" onClick={() => { setShowAddModal(false); setCatSearch(''); }}>Cancel</Button>
                <Button className="flex-1 bg-primary text-white" onClick={handleAddCategory} disabled={createMutation.isPending}>
                  Create Category
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}