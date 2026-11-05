import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Users, Trash2, RefreshCw, KeyRound, UserCheck, UserX, Shield } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = ['super_admin','owner','manager','employee','salesman','accountant','cashier','delivery','vendor','customer'];
const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-100 text-red-700', owner: 'bg-violet-100 text-violet-700',
  manager: 'bg-blue-100 text-blue-700', employee: 'bg-pink-100 text-pink-700',
  salesman: 'bg-teal-100 text-teal-700', accountant: 'bg-emerald-100 text-emerald-700',
  cashier: 'bg-orange-100 text-orange-700', delivery: 'bg-cyan-100 text-cyan-700',
  vendor: 'bg-indigo-100 text-indigo-700', customer: 'bg-slate-100 text-slate-600',
};

const ALL_PERMISSIONS = [
  'Manage Users', 'Manage Products', 'View Reports', 'Process Orders', 
  'Manage Finances', 'System Settings', 'Manage Inventory', 'Customer Access'
];

export default function UsersTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [permTarget, setPermTarget] = useState<any | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', search, roleFilter, statusFilter, page],
    queryFn: () => adminApi.getUsers({ search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined, page, limit: 15 }).then(r => r.data),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateUserStatus(id, status),
    onSuccess: (_, v) => { toast.success(`User ${v.status}`); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => toast.error('Failed to update status'),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => adminApi.updateUserRole(id, role),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => toast.error('Failed to update role'),
  });

  const permMut = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: string[] }) => adminApi.updateUserPermissions(id, permissions),
    onSuccess: () => { toast.success('Permissions updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setPermTarget(null); },
    onError: () => toast.error('Failed to update permissions'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { toast.success('User deleted'); qc.invalidateQueries({ queryKey: ['admin-users'] }); setConfirmDelete(null); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to delete'),
  });

  const resetPwdMut = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => adminApi.resetUserPassword(id, password),
    onSuccess: () => { toast.success('Password reset successfully'); setResetTarget(null); setNewPassword(''); },
    onError: () => toast.error('Failed to reset password'),
  });

  const openPermsModal = (user: any) => {
    setPermTarget(user);
    setSelectedPerms(user.permissions || []);
  };

  const togglePerm = (perm: string) => {
    setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
  };

  return (
    <Card className="shadow-2xl border-none">
      <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-t-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5" /> System Users</CardTitle>
            <CardDescription className="text-slate-400 mt-0.5">Total: {data?.total ?? '...'} users across all roles</CardDescription>
          </div>
          <Button size="sm" variant="secondary" onClick={() => refetch()} className="gap-1.5 w-fit"><RefreshCw className="h-3.5 w-3.5" />Refresh</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Filters */}
        <div className="p-4 border-b bg-slate-50 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="h-10 px-3 rounded-md border border-input bg-white text-sm" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>)}
          </select>
          <select className="h-10 px-3 rounded-md border border-input bg-white text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        {/* Reset Password Modal */}
        {resetTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-bold mb-1">Reset Password</h3>
              <p className="text-sm text-slate-500 mb-4">Set a new password for this user.</p>
              <Input type="password" placeholder="New password (min 6 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mb-4" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setResetTarget(null); setNewPassword(''); }}>Cancel</Button>
                <Button onClick={() => resetPwdMut.mutate({ id: resetTarget, password: newPassword })} disabled={newPassword.length < 6 || resetPwdMut.isPending}>Reset Password</Button>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Modal */}
        {permTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold mb-1">Manage Permissions</h3>
              <p className="text-sm text-slate-500 mb-4">Override default role permissions for <b>{permTarget.email}</b></p>
              
              <div className="space-y-2 mb-6 max-h-[50vh] overflow-y-auto pr-2">
                {ALL_PERMISSIONS.map(p => (
                  <label key={p} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedPerms.includes(p)} 
                      onChange={() => togglePerm(p)}
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">{p}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setPermTarget(null)}>Cancel</Button>
                <Button onClick={() => permMut.mutate({ id: permTarget._id, permissions: selectedPerms })} disabled={permMut.isPending}>Save Permissions</Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                {['User', 'Role', 'Business', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">Loading users...</td></tr>}
              {!isLoading && (data?.data as any[] || []).map((user: any) => (
                <tr key={user._id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${ROLE_COLORS[user.role]?.replace('text-', 'bg-').split(' ')[0] ?? 'bg-slate-400'}`}
                        style={{ background: user.role === 'super_admin' ? '#dc2626' : user.role === 'owner' ? '#7c3aed' : user.role === 'manager' ? '#2563eb' : '#64748b' }}>
                        {user.profile?.firstName?.charAt(0) ?? ''}{user.profile?.lastName?.charAt(0) ?? ''}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{user.profile?.firstName} {user.profile?.lastName}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border-0 cursor-pointer ${ROLE_COLORS[user.role] ?? 'bg-slate-100 text-slate-600'}`}
                      value={user.role}
                      onChange={e => roleMut.mutate({ id: user._id, role: e.target.value })}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r.replace('_',' ').toUpperCase()}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {(user.businessId as any)?.name ?? <span className="text-slate-300 italic text-xs">None</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : user.status === 'suspended' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user.status === 'active'
                        ? <Button size="sm" variant="ghost" className="h-7 px-2 text-amber-600 text-[11px] gap-1" onClick={() => statusMut.mutate({ id: user._id, status: 'suspended' })}><UserX className="h-3.5 w-3.5" />Suspend</Button>
                        : <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-600 text-[11px] gap-1" onClick={() => statusMut.mutate({ id: user._id, status: 'active' })}><UserCheck className="h-3.5 w-3.5" />Activate</Button>
                      }
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-purple-600 text-[11px] gap-1" onClick={() => openPermsModal(user)}><Shield className="h-3.5 w-3.5" />Perms</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600 text-[11px] gap-1" onClick={() => setResetTarget(user._id)}><KeyRound className="h-3.5 w-3.5" />Pwd</Button>
                      {confirmDelete === user._id
                        ? <>
                            <Button size="sm" variant="destructive" className="h-7 text-[11px]" onClick={() => deleteMut.mutate(user._id)} disabled={deleteMut.isPending}>Confirm</Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                          </>
                        : <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setConfirmDelete(user._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      }
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.data as any[] || []).length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.total ?? 0) > 15 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-slate-500">Showing {((page-1)*15)+1}–{Math.min(page*15, data?.total)} of {data?.total}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>Previous</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p+1)} disabled={page*15>=(data?.total??0)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
