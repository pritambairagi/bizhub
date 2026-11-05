import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { businessApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search, Plus, MapPin, Phone, Mail, Edit, Trash2, Building2,
  X, CheckCircle2, XCircle, Loader2, MoreVertical, Store,
  Warehouse, Coffee, Package, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BRANCH_TYPES = [
  { value: 'main_branch', label: 'Main Branch', icon: Home },
  { value: 'sub_branch',  label: 'Sub Branch',  icon: Building2 },
  { value: 'warehouse',   label: 'Warehouse',   icon: Warehouse },
  { value: 'storehouse',  label: 'Storehouse',  icon: Package },
  { value: 'shop',        label: 'Shop',        icon: Store },
  { value: 'store',       label: 'Store',       icon: Store },
  { value: 'restaurant',  label: 'Restaurant',  icon: Coffee },
  { value: 'other',       label: 'Other',       icon: Building2 },
];

const EMPTY_FORM = {
  name: '', code: '', type: 'shop',
  address: { street: '', district: '', thana: '', zip: '' },
  contact: { phone: '', email: '' },
  status: 'active',
};

export default function Branches() {
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
  const [formData, setFormData]     = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string,string>>({});

  const queryClient = useQueryClient();

  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => businessApi.getBranches(),
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editingId
      ? businessApi.updateBranch(editingId, data)
      : businessApi.createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(editingId ? 'Branch updated successfully' : 'Branch created successfully');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save branch');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => businessApi.deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch removed');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Failed to delete'),
  });

  const responseData = branchesData?.data?.data;
  const branches: any[] = Array.isArray(responseData) ? responseData : (responseData?.branches || []);

  const filtered = branches.filter(b => {
    const q = search.toLowerCase();
    const branchName = b.name || '';
    const branchCode = b.code || '';
    const matchSearch = branchName.toLowerCase().includes(q) || branchCode.toLowerCase().includes(q);
    const matchType   = !filterType || b.type === filterType;
    return matchSearch && matchType;
  });

  const stats = {
    total:  branches.length,
    active: branches.filter(b => b.status !== 'inactive').length,
    types:  [...new Set(branches.map(b => b.type))].length,
  };

  function validate() {
    const err: Record<string,string> = {};
    if (!formData.name.trim())         err.name = 'Branch name is required';
    if (!formData.code.trim())         err.code = 'Branch code is required';
    if (!formData.contact.phone.trim()) err.phone = 'Phone is required';
    setFormErrors(err);
    return Object.keys(err).length === 0;
  }

  function openAdd() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(branch: any) {
    setEditingId(branch._id);
    setFormData({
      name:    branch.name || '',
      code:    branch.code || '',
      type:    branch.type || 'shop',
      status:  branch.status || 'active',
      address: { street: branch.address?.street || '', district: branch.address?.district || '', thana: branch.address?.thana || '', zip: branch.address?.zip || '' },
      contact: { phone: branch.contact?.phone || '', email: branch.contact?.email || '' },
    });
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
  }

  function handleSubmit() {
    if (!validate()) return;
    createMutation.mutate(formData);
  }

  function handleDelete(id: string) {
    if (!confirm('Remove this branch permanently?')) return;
    deleteMutation.mutate(id);
  }

  const TypeIcon = ({ type }: { type: string }) => {
    const t = BRANCH_TYPES.find(x => x.value === type);
    const Icon = t?.icon || Building2;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Branch Management
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage locations, warehouses and outlets across your business
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
            className="h-10 w-10"
          >
            <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button onClick={openAdd} className="gap-2 shadow-lg shadow-primary/20 flex-1 sm:flex-none">
            <Plus className="h-4 w-4" /> Add Branch
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Branches',  value: stats.total,  color: 'bg-primary/10 text-primary' },
          { label: 'Active',          value: stats.active, color: 'bg-emerald-500/10 text-emerald-600' },
          { label: 'Branch Types',    value: stats.types,  color: 'bg-blue-500/10 text-blue-600' },
        ].map(s => (
          <Card key={s.label} className="stat-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center font-bold text-lg', s.color)}>
                {s.value}
              </div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code…"
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm min-w-[160px]"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {BRANCH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </CardContent>
      </Card>

      {/* Branch Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 skeleton rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">No branches found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {search || filterType ? 'Try adjusting your filters' : 'Create your first branch to get started'}
              </p>
            </div>
            {!search && !filterType && (
              <Button onClick={openAdd} className="gap-2">
                <Plus className="h-4 w-4" /> Add Branch
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((branch: any) => (
            <Card
              key={branch._id}
              className="group relative overflow-hidden card-hover cursor-default"
            >
              {/* accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
              <CardContent className="p-5 pl-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <TypeIcon type={branch.type} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base leading-tight">
                          {branch.name || 'Unnamed Branch'}
                        </h3>
                        <span className="badge badge-primary text-[10px] font-bold uppercase">
                          {branch.code || 'NO-CODE'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {branch.type?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => openEdit(branch)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(branch._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {(branch.address?.street || branch.address?.district) && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
                      <span className="text-xs leading-relaxed">
                        {[branch.address?.street, branch.address?.district, branch.address?.zip]
                          .filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {branch.contact?.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary/60" />
                      <span className="text-xs">{branch.contact.phone}</span>
                    </div>
                  )}
                  {branch.contact?.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 text-primary/60" />
                      <span className="text-xs">{branch.contact.email}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                  <span className={cn(
                    'badge text-[10px] font-bold uppercase',
                    branch.status === 'inactive' ? 'badge-danger' : 'badge-success'
                  )}>
                    {branch.status === 'inactive' ? '● Inactive' : '● Active'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xl w-full bg-card border border-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="font-bold text-lg">{editingId ? 'Edit Branch' : 'Add New Branch'}</h3>
                <p className="text-xs text-muted-foreground">Fill in the details below</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
              {/* Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium mb-1 block">Branch Name <span className="text-destructive">*</span></label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dhaka Main Branch"
                    className={formErrors.name ? 'border-destructive' : ''}
                  />
                  {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Branch Code <span className="text-destructive">*</span></label>
                  <Input
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="DHAKA01"
                    className={cn('font-mono', formErrors.code ? 'border-destructive' : '')}
                  />
                  {formErrors.code && <p className="text-xs text-destructive mt-1">{formErrors.code}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Branch Type</label>
                  <select
                    className="w-full"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    {BRANCH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone <span className="text-destructive">*</span></label>
                  <Input
                    value={formData.contact.phone}
                    onChange={e => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
                    placeholder="01XXXXXXXXX"
                    className={formErrors.phone ? 'border-destructive' : ''}
                  />
                  {formErrors.phone && <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={formData.contact.email}
                    onChange={e => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
                    placeholder="branch@example.com"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider text-xs">Address</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <Input
                      value={formData.address.street}
                      onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                      placeholder="Street / Road / Area"
                    />
                  </div>
                  <Input
                    value={formData.address.district}
                    onChange={e => setFormData({ ...formData, address: { ...formData.address, district: e.target.value } })}
                    placeholder="District"
                  />
                  <Input
                    value={formData.address.thana}
                    onChange={e => setFormData({ ...formData, address: { ...formData.address, thana: e.target.value } })}
                    placeholder="Thana / Upazila"
                  />
                  <Input
                    value={formData.address.zip}
                    onChange={e => setFormData({ ...formData, address: { ...formData.address, zip: e.target.value } })}
                    placeholder="ZIP / Postal Code"
                  />
                </div>
              </div>

              {/* Status (for editing) */}
              {editingId && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <select
                    className="w-full"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                className="flex-1 shadow-lg shadow-primary/20"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</>
                  : editingId ? 'Update Branch' : 'Create Branch'
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
