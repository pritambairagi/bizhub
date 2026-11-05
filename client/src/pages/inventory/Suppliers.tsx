import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { suppliersApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Plus, Truck, Phone, Mail, Edit, Trash2, Building, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function Suppliers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    address: '',
    brand: '',
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, limit, search],
    queryFn: () => suppliersApi.getAll({ page, limit, search }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => 
      editingId ? suppliersApi.update(editingId, data) : suppliersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(editingId ? 'Supplier updated' : 'Supplier added successfully');
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ name: '', companyName: '', phone: '', email: '', address: '', brand: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier deleted successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete'),
  });

  const suppliers = data?.data?.data?.suppliers || [];
  const pagination = data?.data?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  
  const handleAddSupplier = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (supplier: any) => {
    setEditingId(supplier._id);
    setFormData({
      name: supplier.name || '',
      companyName: supplier.companyName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      brand: supplier.brand || '',
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-semibold text-white">Suppliers</h2>
          <p className="text-slate-400 font-medium">Manage your product suppliers, brands and track purchase metrics</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({ name: '', companyName: '', phone: '', email: '', address: '', brand: '' }); setShowAddModal(true); }}>
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search suppliers..."
                className="pl-9 bg-slate-800 border-slate-700 text-white focus:ring-1 focus:ring-primary focus:outline-none"
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
                <div key={i} className="h-16 skeleton rounded-lg bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-slate-500 mb-4 animate-bounce" />
              <p className="text-slate-400 font-medium">No suppliers found</p>
              <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4" />
                Add your first supplier
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-400">Supplier</th>
                    <th className="px-4 py-3 text-left text-slate-400">Company / Brand</th>
                    <th className="px-4 py-3 text-left text-slate-400">Phone</th>
                    <th className="px-4 py-3 text-right text-slate-400">Total Purchases</th>
                    <th className="px-4 py-3 text-right text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {suppliers.map((supplier: any) => (
                    <tr key={supplier._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Truck className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{supplier.name}</p>
                            <p className="text-[10px] text-slate-500">{supplier.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <span className="font-medium">{supplier.companyName || '-'}</span>
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">{supplier.brand || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{supplier.phone}</td>
                      <td className="px-4 py-3 text-right text-emerald-400 font-bold">
                        {formatCurrency(supplier.totalPurchases || 0)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-white" onClick={() => handleEdit(supplier)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-white" onClick={() => handleEdit(supplier)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-red-500 hover:bg-red-500/10" onClick={() => {
                            if (confirm('Delete this supplier?')) deleteMutation.mutate(supplier._id);
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                      ? 'No suppliers'
                      : `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, pagination.total)} of ${pagination.total} supplier${pagination.total !== 1 ? 's' : ''}`}
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
          )}
        </CardContent>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-2xl overflow-hidden animate-fade-in-up">
            <CardHeader className="border-b border-slate-800 pb-4">
              <CardTitle className="text-xl font-bold text-white">{editingId ? 'Edit Supplier Details' : 'Add New Supplier'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[75vh] overflow-y-auto pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-1 focus:ring-primary"
                    placeholder="Supplier name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Company Name</label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-1 focus:ring-primary"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Brand</label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-1 focus:ring-primary"
                    placeholder="Brand name"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-1 focus:ring-primary"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-1 focus:ring-primary"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-1 focus:ring-primary"
                    placeholder="Supplier address"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-6 border-t border-slate-800">
                <Button variant="outline" className="flex-1 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20" onClick={handleAddSupplier} disabled={createMutation.isPending}>
                  {editingId ? 'Update Supplier' : 'Add Supplier'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
