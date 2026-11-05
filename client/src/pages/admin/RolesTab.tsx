import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Shield, Building2, UserCog, Calculator, ShoppingCart, Truck, User, CheckCircle2, XCircle } from 'lucide-react';

const ROLES = [
  { role: 'super_admin', label: 'Super Admin', icon: Shield, color: '#dc2626', desc: 'Full global platform control. Can manage all businesses, all users, system settings and platform configuration.', permissions: ['All Permissions', 'Manage Platform', 'Manage All Businesses', 'Manage All Users', 'View All Data', 'System Settings', 'Financial Oversight'] },
  { role: 'owner', label: 'Business Owner', icon: Building2, color: '#7c3aed', desc: 'Full control over their registered business, staff and financials.', permissions: ['Manage Business', 'Manage Staff', 'Manage Products', 'Financial Access', 'View Reports', 'Manage Branches', 'Manage Customers'] },
  { role: 'manager', label: 'Manager', icon: UserCog, color: '#2563eb', desc: 'Manages day-to-day operations of a branch.', permissions: ['Manage Inventory', 'Manage Staff Schedule', 'Process Orders', 'View Reports', 'Manage Products', 'Handle Returns'] },
  { role: 'accountant', label: 'Accountant', icon: Calculator, color: '#16a34a', desc: 'Handles all financial records and reporting.', permissions: ['Manage Accounts', 'View Transactions', 'Financial Reports', 'Balance Sheet', 'Profit & Loss', 'Cash Flow'] },
  { role: 'cashier', label: 'Cashier', icon: ShoppingCart, color: '#ea580c', desc: 'POS operations — process sales and returns.', permissions: ['Process Sales', 'Process Returns', 'View Products', 'Apply Discounts', 'Print Receipts'] },
  { role: 'delivery', label: 'Delivery', icon: Truck, color: '#0891b2', desc: 'Fulfills and tracks assigned delivery orders.', permissions: ['View Assigned Orders', 'Update Delivery Status', 'Contact Customer'] },
  { role: 'vendor', label: 'Vendor', icon: Building2, color: '#4f46e5', desc: 'Supplier who manages supply orders and stock.', permissions: ['Manage Supply Orders', 'View Purchase Orders', 'Update Stock'] },
  { role: 'customer', label: 'Customer', icon: User, color: '#64748b', desc: 'End customer with e-commerce shop access.', permissions: ['Place Orders', 'View Profile', 'Loyalty Points', 'Track Orders'] },
];

const PERM_MATRIX = [
  { perm: 'Manage Users', roles: ['super_admin', 'owner'] },
  { perm: 'Manage Products', roles: ['super_admin', 'owner', 'manager', 'cashier'] },
  { perm: 'View Reports', roles: ['super_admin', 'owner', 'manager', 'accountant'] },
  { perm: 'Process Orders', roles: ['super_admin', 'owner', 'manager', 'cashier', 'delivery'] },
  { perm: 'Manage Finances', roles: ['super_admin', 'owner', 'accountant'] },
  { perm: 'System Settings', roles: ['super_admin'] },
  { perm: 'Manage Inventory', roles: ['super_admin', 'owner', 'manager', 'vendor'] },
  { perm: 'Customer Access', roles: ['super_admin', 'owner', 'manager', 'cashier', 'customer'] },
];

export default function RolesTab() {
  const displayRoles = ROLES.slice(0, 6);
  return (
    <div className="space-y-6">
      {/* Role Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map(role => (
          <Card key={role.role} className="border-none shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 overflow-hidden">
            <CardContent className="p-0">
              <div className="h-1.5 w-full" style={{ background: role.color }} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl" style={{ background: `${role.color}15` }}>
                    <role.icon className="h-5 w-5" style={{ color: role.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{role.label}</p>
                    <p className="text-[10px] font-mono text-slate-400">{role.role}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{role.desc}</p>
                <div className="space-y-1.5">
                  {role.permissions.map(p => (
                    <div key={p} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0" style={{ color: role.color }} />
                      <span className="text-slate-600">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card className="shadow-xl border-none">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-lg font-bold">Permission Matrix</CardTitle>
          <CardDescription>Comparison of access levels across roles</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase min-w-[160px]">Permission</th>
                  {displayRoles.map(r => (
                    <th key={r.role} className="px-3 py-3.5 text-center text-[11px] font-bold uppercase" style={{ color: r.color }}>{r.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERM_MATRIX.map(row => (
                  <tr key={row.perm} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">{row.perm}</td>
                    {displayRoles.map(r => (
                      <td key={r.role} className="px-3 py-3.5 text-center">
                        {row.roles.includes(r.role)
                          ? <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500" />
                          : <XCircle className="h-5 w-5 mx-auto text-slate-200" />
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
