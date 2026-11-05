import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';
import { Loader2, User, Lock, Mail, Phone, ChevronLeft } from 'lucide-react';

export default function EmployeeAuth() {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [password, setPassword]   = useState('');
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'email' && !email) return toast.error('Email is required');
    if (authMethod === 'phone' && !phone) return toast.error('Phone is required');
    if (!password) return toast.error('Password is required');

    try {
      const credentials = {
        ...(authMethod === 'email' ? { email } : { phone }),
        password,
      };
      await login(credentials);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="absolute top-4 left-4">
        <Link to="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
          <ChevronLeft className="h-4 w-4" /> Back to Owner Login
        </Link>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <User className="h-8 w-8 relative z-10" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Employee Portal
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Sign in with the credentials set by your employer
          </p>
        </div>

        <Card className="border-0 shadow-2xl shadow-primary/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
          {/* Email / Phone toggle */}
          <div className="px-6 pt-6">
            <div className="flex bg-muted/50 p-1 rounded-lg">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMethod === 'email' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setAuthMethod('email')}
              >
                Email
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMethod === 'phone' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setAuthMethod('phone')}
              >
                Phone
              </button>
            </div>
          </div>

          <CardContent className="px-6 pb-6 pt-4">
            <form onSubmit={onSubmit} className="space-y-4">
              {authMethod === 'email' ? (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="pl-10 h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                  Your login credentials are set by your employer in the Employee Management system.
                  Contact your manager if you cannot log in.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/25 mt-2 transition-all hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Login to Portal'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
