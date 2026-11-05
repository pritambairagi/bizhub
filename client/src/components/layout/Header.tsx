import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, businessApi } from '@/services/api';
import { cn, formatDistanceToNow } from '@/lib/utils';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  Plus,
  RefreshCw,
  MessageSquare,
  X,
  Check,
  CheckCheck,
  ChevronDown,
  Building2,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  Info,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuClick: () => void;
  onChatToggle?: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/pos': 'Point of Sale',
  '/orders': 'Orders',
  '/categories': 'Categories',
  '/inventory': 'Inventory',
  '/customers': 'Customers',
  '/employees': 'Employees',
  '/accounting': 'Accounting',
  '/settings': 'Settings',
  '/shop': 'Online Store',
  '/analytics': 'Analytics',
  '/admin': 'Admin Panel',
};

const notifIcon = (category: string) => {
  switch (category) {
    case 'stock': return AlertTriangle;
    case 'order': return ShoppingCart;
    case 'payment': return CreditCard;
    default: return Info;
  }
};

export default function Header({ onMenuClick, onChatToggle }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const pageTitle = pageTitles[location.pathname] || import.meta.env.VITE_APP_NAME || 'BizHub';

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Dynamic notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications?limit=10').then(r => r.data.data),
    refetchInterval: 30000,
    enabled: !!user?.businessId,
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Dynamic branches
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => businessApi.getBranches().then(r => r.data.data),
    enabled: !!user?.businessId,
    staleTime: 5 * 60 * 1000,
  });

  const rawBranches = branchesData;
  const branches = Array.isArray(rawBranches) ? rawBranches : (rawBranches?.branches || []);
  const currentBranch = branches.find((b: any) => b._id === user?.branchId) || branches[0];

  const quickActions = [
    { label: 'New Sale', href: '/pos' },
    { label: 'Add Product', href: '/inventory?action=add' },
    { label: 'New Customer', href: '/customers?action=add' },
    { label: 'New Order', href: '/orders?action=add' },
  ];

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  // Search navigation
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-950/95 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-slate-900 text-slate-400 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center gap-4">
          <h1 className="text-lg md:text-xl font-heading font-black text-white tracking-tight">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                type="search"
                placeholder="Search... (Ctrl+K)"
                className="w-64 pl-9 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              />
            </form>
          </div>

          {/* Quick Add */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Quick Add</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {quickActions.map((action) => (
                <DropdownMenuItem key={action.href} asChild>
                  <a href={action.href}>{action.label}</a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {resolvedTheme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {themeOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    toast.success(`${opt.label} theme enabled`);
                  }}
                  className={cn(theme === opt.value && 'bg-muted')}
                >
                  <opt.icon className="h-4 w-4 mr-2" />
                  {opt.label}
                  {theme === opt.value && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Messages */}
          <Button variant="ghost" size="icon" onClick={onChatToggle} title="Messages">
            <MessageSquare className="h-5 w-5" />
          </Button>

          {/* Refresh */}
          <Button variant="ghost" size="icon" onClick={() => window.location.reload()} title="Refresh">
            <RefreshCw className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
              <div className="flex items-center justify-between px-3 py-2">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-primary hover:underline"
                  >
                    <CheckCheck className="h-3 w-3 inline mr-1" />
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notif: any) => {
                  const Icon = notifIcon(notif.category);
                  return (
                    <DropdownMenuItem
                      key={notif._id}
                      className={cn(
                        'flex items-start gap-3 p-3 cursor-pointer',
                        !notif.isRead && 'bg-primary/5'
                      )}
                      onClick={() => {
                        if (!notif.isRead) markReadMutation.mutate(notif._id);
                      }}
                    >
                      <div className={cn(
                        'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                        notif.type === 'alert' ? 'bg-destructive/10 text-destructive' :
                        notif.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                        notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-blue-100 text-blue-600'
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{notif.title}</span>
                          {!notif.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(notif.createdAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  );
                })
              )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-primary text-sm font-medium">
                    View all notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Branch Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden lg:flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 hover:bg-muted/80 transition-colors">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {currentBranch?.name || 'Main Branch'}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch Branch</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {branches.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">No branches found</div>
              ) : (
                branches.map((branch: any) => (
                  <DropdownMenuItem
                    key={branch._id}
                    className={cn(
                      'flex items-center justify-between',
                      branch._id === currentBranch?._id && 'bg-muted'
                    )}
                    onClick={() => {
                      useAuthStore.getState().updateUser({ branchId: branch._id });
                      toast.success(`Switched to ${branch.name}`);
                      queryClient.invalidateQueries();
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">{branch.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{branch.code}</p>
                      </div>
                    </div>
                    {branch._id === currentBranch?._id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search Overlay (Ctrl+K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
        >
          <div
            className="w-full max-w-lg bg-background rounded-xl shadow-2xl border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="flex items-center border-b px-4">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                className="flex-1 bg-transparent px-4 py-4 text-base outline-none placeholder:text-muted-foreground"
                placeholder="Search products, orders, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </form>
            <div className="p-4">
              <p className="text-xs text-muted-foreground mb-3">Quick Navigation</p>
              <div className="space-y-1">
                {Object.entries(pageTitles).slice(0, 6).map(([path, title]) => (
                  <button
                    key={path}
                    onClick={() => { navigate(path); setSearchOpen(false); setSearchQuery(''); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <span className="text-muted-foreground">#</span>
                    {title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}