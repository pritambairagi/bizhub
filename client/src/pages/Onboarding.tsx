import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { businessApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, ArrowRight, Loader2, LayoutGrid, MapPin, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();
  const { fetchProfile } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    type: 'retail',
    industry: 'Other',
    contact: {
      email: '',
      phone: '',
      address: '',
      district: '',
      thana: '',
    },
    registration: {
      bin: '',
      tradeLicense: '',
    }
  });

  const createBusinessMut = useMutation({
    mutationFn: (data: typeof formData) => businessApi.create(data),
    onSuccess: async () => {
      toast.success('Business created successfully! Welcome to the platform.');
      await fetchProfile();
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create business');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact.email || !formData.contact.phone || !formData.contact.address || !formData.contact.district) {
      toast.error('Please fill in all required fields marked with *');
      return;
    }
    createBusinessMut.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center text-primary mb-4">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
          Register Your Business
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Provide your business details to get started with BizHub ERP.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <Card className="shadow-2xl border-none overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
            <CardTitle className="text-2xl font-bold">Business Profile</CardTitle>
            <CardDescription className="text-slate-400">Please fill out the professional profile for your company.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Group */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" /> Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Business Name *</label>
                    <Input 
                      placeholder="e.g. My Awesome Shop" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Business Type *</label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-input bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary/20"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="retail">Retail Shop</option>
                      <option value="wholesale">Wholesale Hub</option>
                      <option value="restaurant">Restaurant / Cafe</option>
                      <option value="pharmacy">Pharmacy / Healthcare</option>
                      <option value="franchise">Franchise Business</option>
                      <option value="marketplace">E-commerce Marketplace</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Industry *</label>
                    <Input 
                      placeholder="e.g. Electronics, Fashion, IT" 
                      value={formData.industry}
                      onChange={e => setFormData({ ...formData, industry: e.target.value })}
                      className="bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Group */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Contact & Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Business Email *</label>
                    <Input 
                      type="email" 
                      placeholder="info@yourbusiness.com"
                      value={formData.contact.email}
                      onChange={e => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
                      required
                      className="bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Business Phone *</label>
                    <Input 
                      placeholder="01XXXXXXXXX"
                      value={formData.contact.phone}
                      onChange={e => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
                      required
                      className="bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">District *</label>
                    <Input 
                      placeholder="e.g. Dhaka, Khulna"
                      value={formData.contact.district}
                      onChange={e => setFormData({ ...formData, contact: { ...formData.contact, district: e.target.value } })}
                      required
                      className="bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Thana / Area *</label>
                    <Input 
                      placeholder="e.g. Uttara, Boikali"
                      value={formData.contact.thana}
                      onChange={e => setFormData({ ...formData, contact: { ...formData.contact, thana: e.target.value } })}
                      required
                      className="bg-slate-50/50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Full Address *</label>
                    <Input 
                      placeholder="House, Road, Area details..."
                      value={formData.contact.address}
                      onChange={e => setFormData({ ...formData, contact: { ...formData.contact, address: e.target.value } })}
                      required
                      className="bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Registration Group */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" /> Legal / Registration (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">BIN Number</label>
                    <Input 
                      placeholder="VAT Registration No."
                      value={formData.registration.bin}
                      onChange={e => setFormData({ ...formData, registration: { ...formData.registration, bin: e.target.value } })}
                      className="bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Trade License No.</label>
                    <Input 
                      placeholder="Enter License No."
                      value={formData.registration.tradeLicense}
                      onChange={e => setFormData({ ...formData, registration: { ...formData.registration, tradeLicense: e.target.value } })}
                      className="bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full mt-6 h-12 text-lg font-bold shadow-xl shadow-primary/20 gap-3" disabled={createBusinessMut.isPending}>
                {createBusinessMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
                Complete Business Setup
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
