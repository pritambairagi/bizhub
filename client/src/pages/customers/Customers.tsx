import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { customersApi, ordersApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Plus, User, Phone, Mail, Edit, Trash2, Wallet, Eye, X, ArrowUpRight, ArrowDownLeft, Star, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    customerType: 'regular',
  });
  const [walletData, setWalletData] = useState({
    amount: 0,
    type: 'credit',
    description: ''
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, limit, search],
    queryFn: () => customersApi.getAll({ page, limit, search }),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => editingId ? customersApi.update(editingId, data) : customersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(editingId ? 'Customer updated successfully' : 'Customer added successfully');
      setShowAddModal(false);
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '', address: '', customerType: 'regular' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    },
  });

  const walletMutation = useMutation({
    mutationFn: (data: {id: string, amount: number, type: string, description: string}) => 
      customersApi.addWallet(data.id, data.amount, data.type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Wallet updated successfully');
      setShowWalletModal(false);
      setActiveCustomer(null);
      setWalletData({ amount: 0, type: 'credit', description: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update wallet');
    },
  });

  const customers = data?.data?.data?.customers || [];
  const pagination = data?.data?.data?.pagination || { page: 1, total: 0, totalPages: 1 };

  // Query for customer order history
  const { data: customerOrdersData } = useQuery({
    queryKey: ['customer-orders', activeCustomer?._id],
    queryFn: () => ordersApi.getAll({ customerId: activeCustomer?._id, limit: 10 }),
    enabled: !!activeCustomer?._id && showViewModal,
  });
  const customerOrders = customerOrdersData?.data?.data?.orders || [];

  const handleAddCustomer = () => {
    createMutation.mutate(formData);
  };

  const openEdit = (customer: any) => {
    setEditingId(customer._id);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      customerType: customer.customerType || 'regular'
    });
    setShowAddModal(true);
  };

  const openView = (customer: any) => {
    setActiveCustomer(customer);
    setShowViewModal(true);
  };

  const openWallet = (customer: any) => {
    setActiveCustomer(customer);
    setWalletData({ amount: 0, type: 'credit', description: '' });
    setShowWalletModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customers</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your customer database and loyalty</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ name: '', phone: '', email: '', address: '', customerType: 'regular' });
          setShowAddModal(true);
        }} className="gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 skeleton rounded-lg" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground font-medium">No customers found</p>
              <Button className="mt-2 gap-2" onClick={() => {
                setEditingId(null);
                setFormData({ name: '', phone: '', email: '', address: '', customerType: 'regular' });
                setShowAddModal(true);
              }}>
                <Plus className="h-4 w-4" />
                Add your first customer
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th className="text-right">Wallet</th>
                    <th className="text-right">Loyalty Points</th>
                    <th className="text-right">Total Spent</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer: any) => (
                    <tr key={customer._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {customer.name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {customer.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td><span className="text-sm">{customer.phone}</span></td>
                      <td>
                        <span className={cn('badge text-[10px] font-bold uppercase', 
                          customer.customerType === 'vip' ? 'badge-primary' : 
                          customer.customerType === 'wholesale' ? 'badge-warning' : 'bg-slate-100 text-slate-600'
                        )}>
                          {customer.customerType || 'regular'}
                        </span>
                      </td>
                      <td className="text-right font-medium">
                        <span className={customer.wallet?.balance > 0 ? "text-emerald-600" : ""}>
                          {formatCurrency(customer.wallet?.balance || 0)}
                        </span>
                      </td>
                      <td className="text-right font-medium">
                        <span className="text-primary">{customer.loyalty?.points || 0}</span>
                      </td>
                      <td className="text-right font-bold text-slate-700">
                        {formatCurrency(customer.loyalty?.lifetimeValue || 0)}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openView(customer)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-emerald-500" onClick={() => openWallet(customer)}>
                            <Wallet className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEdit(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(customer._id)}>
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
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Items per page:</span>
                    <select 
                      className="bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-foreground bg-background rounded p-1 border"
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
                      ? 'No customers'
                      : `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, pagination.total)} of ${pagination.total} customer${pagination.total !== 1 ? 's' : ''}`}
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
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md w-full bg-card border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">{editingId ? 'Edit Customer' : 'Add Customer'}</h3>
              <Button variant="ghost" size="icon" onClick={() => { setShowAddModal(false); setEditingId(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div>
                <label className="text-sm font-medium mb-1 block">Name <span className="text-destructive">*</span></label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone <span className="text-destructive">*</span></label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="01XXXXXXXXX" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Address</label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="123 Main St" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Customer Type</label>
                <select className="w-full" value={formData.customerType} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}>
                  <option value="regular">Regular</option>
                  <option value="vip">VIP</option>
                  <option value="wholesale">Wholesale</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); setEditingId(null); }}>
                Cancel
              </Button>
              <Button className="flex-1 shadow-lg shadow-primary/20" onClick={handleAddCustomer} disabled={createMutation.isPending || !formData.name || !formData.phone}>
                {createMutation.isPending ? 'Saving...' : editingId ? 'Update Customer' : 'Save Customer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {showWalletModal && activeCustomer && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm w-full bg-card border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="font-bold text-lg">Customer Wallet</h3>
                <p className="text-xs text-muted-foreground">{activeCustomer.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowWalletModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                <span className="font-medium text-sm text-primary">Current Balance</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(activeCustomer.wallet?.balance || 0)}</span>
              </div>
              
              <div className="flex gap-2 p-1 bg-muted rounded-xl">
                <button 
                  className={cn('flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5', 
                    walletData.type === 'credit' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                  onClick={() => setWalletData({...walletData, type: 'credit'})}
                >
                  <ArrowDownLeft className="h-4 w-4" /> Add Funds
                </button>
                <button 
                  className={cn('flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5', 
                    walletData.type === 'debit' ? 'bg-red-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                  onClick={() => setWalletData({...walletData, type: 'debit'})}
                >
                  <ArrowUpRight className="h-4 w-4" /> Deduct Funds
                </button>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Amount <span className="text-destructive">*</span></label>
                <Input type="number" min="0" value={walletData.amount || ''} onChange={e => setWalletData({...walletData, amount: Number(e.target.value)})} placeholder="0.00" className="text-lg font-bold" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input value={walletData.description} onChange={e => setWalletData({...walletData, description: e.target.value})} placeholder="Reason for transaction" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowWalletModal(false)}>Cancel</Button>
              <Button 
                className={cn('flex-1 shadow-lg text-white', walletData.type === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20')}
                onClick={() => walletMutation.mutate({ id: activeCustomer._id, ...walletData })}
                disabled={!walletData.amount || walletData.amount <= 0 || walletMutation.isPending}
              >
                {walletMutation.isPending ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* View Modal */}
      {showViewModal && activeCustomer && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full bg-card border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">Customer Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowViewModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-6 py-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                  {activeCustomer.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-bold">{activeCustomer.name}</h4>
                  <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                    <span className={cn('badge text-[10px] font-bold uppercase', 
                      activeCustomer.customerType === 'vip' ? 'badge-primary' : 
                      activeCustomer.customerType === 'wholesale' ? 'badge-warning' : 'bg-slate-100 text-slate-600'
                    )}>
                      {activeCustomer.customerType || 'regular'}
                    </span>
                    • Since {formatDate(activeCustomer.createdAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contact Info</p>
                  <div className="space-y-1.5">
                    <p className="text-sm flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground"/> {activeCustomer.phone}</p>
                    <p className="text-sm flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground"/> {activeCustomer.email || 'No email'}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Financials</p>
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-2"><Wallet className="h-3.5 w-3.5"/> Wallet: {formatCurrency(activeCustomer.wallet?.balance || 0)}</p>
                    <p className="text-sm font-bold text-primary flex items-center gap-2"><Star className="h-3.5 w-3.5"/> Points: {activeCustomer.loyalty?.points || 0}</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><ArrowUpRight className="h-3.5 w-3.5"/> Total Spent: {formatCurrency(activeCustomer.loyalty?.lifetimeValue || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Address</p>
                <p className="text-sm bg-muted/30 p-3 rounded-lg border italic">{activeCustomer.address || 'No address provided'}</p>
              </div>

              {/* Purchase History */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Purchase History</p>
                {customerOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border italic">No purchases yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {customerOrders.map((order: any) => (
                      <div key={order._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{order.orderNumber}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {order.items?.length || 0} items • {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{formatCurrency(order.total)}</p>
                          <p className={`text-[10px] font-medium ${order.status === 'confirmed' || order.status === 'delivered' ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {order.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Button className="w-full" variant="outline" onClick={() => { setShowViewModal(false); openWallet(activeCustomer); }}>
                   Update Wallet Balance
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}