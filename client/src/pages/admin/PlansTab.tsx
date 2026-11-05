import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Check, Settings2, Trash2, Edit, Save, DollarSign, Users, Package, Eye, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  maxProducts: number;
  maxUsers: number;
  maxBranches: number;
  features: string[];
  status: 'active' | 'inactive';
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Basic',
    price: 0,
    billingPeriod: 'month',
    maxProducts: 50,
    maxUsers: 2,
    maxBranches: 1,
    features: ['POS System', 'Basic Inventory', 'Walk-in Customers'],
    status: 'active'
  },
  {
    id: 'pro',
    name: 'Business Pro',
    price: 1500,
    billingPeriod: 'month',
    maxProducts: 2000,
    maxUsers: 15,
    maxBranches: 5,
    features: ['POS System', 'Advanced Inventory', 'HRM & Salary', 'Accounting & Cashbox', 'Team Chat', 'Category Trees'],
    status: 'active'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Unlimited',
    price: 5000,
    billingPeriod: 'month',
    maxProducts: 99999,
    maxUsers: 100,
    maxBranches: 20,
    features: ['POS System', 'Advanced Inventory', 'HRM & Salary', 'Accounting & Cashbox', 'Team Chat', 'Category Trees', 'E-Commerce Website', 'Advanced Sales Analytics', 'Super Admin Priority Support'],
    status: 'active'
  }
];

export default function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<Partial<Plan>>({
    name: '',
    price: 0,
    billingPeriod: 'month',
    maxProducts: 500,
    maxUsers: 5,
    maxBranches: 2,
    features: [],
    status: 'active'
  });

  const availableFeatures = [
    'POS System',
    'Basic Inventory',
    'Advanced Inventory',
    'HRM & Salary',
    'Accounting & Cashbox',
    'Team Chat',
    'Category Trees',
    'E-Commerce Website',
    'Advanced Sales Analytics',
    'Walk-in Customers',
    'Super Admin Priority Support'
  ];

  useEffect(() => {
    const saved = localStorage.getItem('bizhub-plans');
    if (saved) {
      setPlans(JSON.parse(saved));
    } else {
      setPlans(DEFAULT_PLANS);
      localStorage.setItem('bizhub-plans', JSON.stringify(DEFAULT_PLANS));
    }
  }, []);

  const savePlans = (updatedPlans: Plan[]) => {
    setPlans(updatedPlans);
    localStorage.setItem('bizhub-plans', JSON.stringify(updatedPlans));
  };

  const handleAddFeature = (feature: string) => {
    const currentFeatures = formData.features || [];
    if (currentFeatures.includes(feature)) {
      setFormData({ ...formData, features: currentFeatures.filter(f => f !== feature) });
    } else {
      setFormData({ ...formData, features: [...currentFeatures, feature] });
    }
  };

  const handleCreatePlan = () => {
    if (!formData.name) {
      toast.error('Plan name is required');
      return;
    }
    const newPlan: Plan = {
      id: formData.name.toLowerCase().replace(/\s+/g, '-'),
      name: formData.name,
      price: formData.price || 0,
      billingPeriod: formData.billingPeriod || 'month',
      maxProducts: formData.maxProducts || 100,
      maxUsers: formData.maxUsers || 5,
      maxBranches: formData.maxBranches || 2,
      features: formData.features || [],
      status: 'active'
    };

    const updated = [...plans, newPlan];
    savePlans(updated);
    toast.success('Subscription plan created successfully');
    setShowAddModal(false);
    setFormData({
      name: '',
      price: 0,
      billingPeriod: 'month',
      maxProducts: 500,
      maxUsers: 5,
      maxBranches: 2,
      features: [],
      status: 'active'
    });
  };

  const handleUpdatePlan = () => {
    if (!editPlan) return;
    const updated = plans.map(p => p.id === editPlan.id ? editPlan : p);
    savePlans(updated);
    toast.success('Plan details updated');
    setEditPlan(null);
  };

  const handleDeletePlan = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription plan?')) {
      const updated = plans.filter(p => p.id !== id);
      savePlans(updated);
      toast.success('Plan deleted');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Subscription Plans & Limits</h2>
          <p className="text-sm text-slate-500">Configure platform access tiers and limit enforcement</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create New Plan
        </Button>
      </div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.id} className="relative flex flex-col justify-between border-slate-200 shadow-md overflow-hidden bg-white">
            {plan.price > 0 && (
              <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-bl-lg shadow">
                Premium
              </div>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-black text-slate-900">{plan.name}</CardTitle>
              <CardDescription className="text-slate-400 capitalize">Billing Tiers ({plan.id})</CardDescription>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-black text-slate-900">৳{plan.price}</span>
                <span className="ml-1 text-sm text-slate-400">/{plan.billingPeriod}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-5 pt-0">
              {/* Limits */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Limits Configuration</p>
                <div className="grid grid-cols-3 gap-1.5 text-center pt-1.5">
                  <div className="bg-white p-2 rounded-lg border">
                    <Package className="h-4 w-4 mx-auto text-primary mb-1" />
                    <p className="text-[10px] font-bold text-slate-500">Products</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{plan.maxProducts >= 9999 ? '∞' : plan.maxProducts}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border">
                    <Users className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                    <p className="text-[10px] font-bold text-slate-500">Users</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{plan.maxUsers}</p>
                  </div>
                  <div className="bg-white p-2 rounded-lg border">
                    <Settings2 className="h-4 w-4 mx-auto text-indigo-600 mb-1" />
                    <p className="text-[10px] font-bold text-slate-500">Branches</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{plan.maxBranches}</p>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Included Features</p>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <div className="p-5 bg-slate-50 border-t flex gap-2">
              <Button variant="outline" className="flex-1 border-slate-300 text-slate-700 gap-1.5 h-9" onClick={() => setEditPlan(plan)}>
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>
              {plan.id !== 'free' && plan.id !== 'pro' && plan.id !== 'enterprise' && (
                <Button variant="ghost" className="h-9 px-3 text-red-500 hover:bg-red-50" onClick={() => handleDeletePlan(plan.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {editPlan && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full bg-white border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-black text-lg text-slate-800">Edit Plan: {editPlan.name}</h3>
              <Button variant="ghost" size="icon" onClick={() => setEditPlan(null)}>✕</Button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Plan Name</label>
                  <Input value={editPlan.name} onChange={e => setEditPlan({ ...editPlan, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Price (৳)</label>
                  <Input type="number" value={editPlan.price} onChange={e => setEditPlan({ ...editPlan, price: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Max Products</label>
                  <Input type="number" value={editPlan.maxProducts} onChange={e => setEditPlan({ ...editPlan, maxProducts: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Max Users</label>
                  <Input type="number" value={editPlan.maxUsers} onChange={e => setEditPlan({ ...editPlan, maxUsers: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Max Branches</label>
                  <Input type="number" value={editPlan.maxBranches} onChange={e => setEditPlan({ ...editPlan, maxBranches: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2.5 block">Select Included Features</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {availableFeatures.map(feature => {
                    const isChecked = editPlan.features.includes(feature);
                    return (
                      <label key={feature} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const newFeatures = isChecked
                              ? editPlan.features.filter(f => f !== feature)
                              : [...editPlan.features, feature];
                            setEditPlan({ ...editPlan, features: newFeatures });
                          }}
                          className="h-3.5 w-3.5 rounded accent-primary"
                        />
                        <span>{feature}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditPlan(null)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white" onClick={handleUpdatePlan}>Save Plan</Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg w-full bg-white border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-black text-lg text-slate-800">Create Subscription Plan</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>✕</Button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Plan Name</label>
                  <Input placeholder="e.g. Starter Pack" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Price (৳)</label>
                  <Input type="number" placeholder="৳ Price" value={formData.price || ''} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Max Products</label>
                  <Input type="number" value={formData.maxProducts || ''} onChange={e => setFormData({ ...formData, maxProducts: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Max Users</label>
                  <Input type="number" value={formData.maxUsers || ''} onChange={e => setFormData({ ...formData, maxUsers: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Max Branches</label>
                  <Input type="number" value={formData.maxBranches || ''} onChange={e => setFormData({ ...formData, maxBranches: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2.5 block">Select Included Features</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {availableFeatures.map(feature => {
                    const isChecked = (formData.features || []).includes(feature);
                    return (
                      <label key={feature} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleAddFeature(feature)}
                          className="h-3.5 w-3.5 rounded accent-primary"
                        />
                        <span>{feature}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-white" onClick={handleCreatePlan}>Create Plan</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
