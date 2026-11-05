import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FolderTree,
  Warehouse,
  Calculator,
  WalletCards,
  UserCog,
  Settings,
  Store,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Truck,
  Building2,
  PieChart,
  MessageSquare,
  CreditCard,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const mainNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'manage_dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'POS System', permission: 'manage_pos' },
  { to: '/sales-history', icon: TrendingUp, label: 'Sales History', permission: 'manage_orders' },
  { to: '/inventory', icon: Package, label: 'Inventory', permission: 'manage_inventory' },
  { to: '/categories', icon: FolderTree, label: 'Categories', permission: 'manage_inventory' },
  { to: '/purchases', icon: ShoppingCart, label: 'Purchases', permission: 'manage_inventory' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers', permission: 'manage_inventory' },
  { to: '/branches', icon: Building2, label: 'Branches', permission: 'manage_branches' },
  { to: '/customers', icon: Users, label: 'Customers', permission: 'manage_customers' },
  { to: '/employees', icon: UserCog, label: 'Employees', permission: 'manage_employees' },
  { to: '/share-business', icon: PieChart, label: 'Share Business', permission: 'manage_settings' },
  { to: '/accounting', icon: Calculator, label: 'Cash Box', permission: 'manage_accounting' },
  { to: '/utilities', icon: WalletCards, label: 'Utilities', permission: 'manage_accounting' },
  { to: '/emi', icon: CreditCard, label: 'EMI / Installments', permission: 'manage_accounting' },
  { to: '/dues', icon: WalletCards, label: 'Remaining Dues', permission: 'manage_accounting' },
  { to: '/association', icon: Users, label: 'Cooperative / সমিতি', permission: 'manage_accounting' },
  { to: '/chat', icon: MessageSquare, label: 'Team Chat' },
  { to: '/settings', icon: Settings, label: 'Settings', permission: 'manage_settings' },
];

const ecommNavItems = [
  { to: '/shop', icon: Store, label: 'Online Shop' },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();

  const filteredNavItems = mainNavItems.filter(item => {
    if (user?.role === 'super_admin') {
      const hiddenPaths = ['/pos', '/sales-history', '/purchases', '/share-business'];
      if (hiddenPaths.includes(item.to)) return false;
      return true;
    }
    if (!item.permission || user?.role === 'owner') return true;
    const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
    return userPermissions.includes(item.permission);
  });

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onToggle}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-slate-950 border-r border-slate-800 transition-all duration-300 shadow-2xl',
          isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
            {isOpen && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Store className="h-5 w-5" />
                </div>
                <span className="font-heading text-xl font-bold text-white tracking-tight">
                  {import.meta.env.VITE_APP_NAME || 'BizHub'}
                </span>
              </div>
            )}
            <button
              onClick={onToggle}
              className="rounded-md p-1.5 hover:bg-slate-900 text-slate-400 transition-colors"
            >
              {isOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-slate-800">
            <ul className="space-y-1.5 px-3">
              {filteredNavItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group',
                        isActive
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                      )
                    }
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors")} />
                    {isOpen && <span className="truncate">{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>

            {isOpen && (
              <div className="my-6 mx-4 border-t border-slate-800" />
            )}

            {isOpen && (
              <ul className="space-y-1.5 px-3">
                <li className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  E-Commerce
                </li>
                {ecommNavItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {isOpen && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}

            {user?.role === 'super_admin' && (
              <ul className="space-y-1.5 px-3 mt-6 border-t border-slate-800 pt-6">
                <li className="px-3 py-2 text-[10px] font-black text-red-400/50 uppercase tracking-widest">
                  System Admin
                </li>
                <li>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                          : 'text-red-400/70 hover:bg-red-500/10 hover:text-red-400'
                      )
                    }
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    {isOpen && <span>Admin Panel</span>}
                  </NavLink>
                </li>
              </ul>
            )}
          </nav>

          {/* User Section */}
          <div className="border-t border-slate-800 p-4 bg-slate-950/50">
            {isOpen ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                    {user?.profile?.firstName?.[0] || 'U'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-bold text-white leading-tight">
                      {user?.profile?.firstName} {user?.profile?.lastName}
                    </p>
                    <p className="truncate text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="rounded-lg p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={logout}
                className="flex w-full items-center justify-center rounded-lg p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}