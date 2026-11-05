import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';
import { Store, Eye, EyeOff } from 'lucide-react';

/** Detect if a string looks like a phone number (all digits / starts with 0 or +) */
function isPhone(value: string) {
  return /^[+0-9][0-9]{5,}$/.test(value.trim());
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error('Please enter your email or phone');
      return;
    }
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    // Decide whether to send as email or phone
    const credentials = isPhone(identifier)
      ? { phone: identifier.trim(), password }
      : { email: identifier.trim().toLowerCase(), password };

    try {
      await login(credentials);
      toast.success('Login successful!');
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#218477] p-4">
      <Card className="w-full max-w-md relative animate-fade-in shadow-xl">
        <CardHeader className="text-center">
          <img src="icon.png" alt="logo" className="w-25 h-20 mx-auto" />
          <CardTitle className="text-2xl font-heading">Welcome to <b className="text-[#218477]">{import.meta.env.VITE_APP_NAME || 'BizHub'}</b></CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email or Phone</label>
              <Input
                type="text"
                placeholder="Enter your email or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-input" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
            <div className="pt-2 border-t text-center w-full mt-2">
              <Link to="/employee-login" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                <Store className="h-4 w-4" /> Go to Employee Portal
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}