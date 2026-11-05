import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { employeesApi, rolesApi, uploadApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search, Plus, User, Edit, Trash2, Shield, Check, X,
  Loader2, DollarSign, Users,
  Calendar, CreditCard, Lock,
  ChevronLeft, ChevronRight, BadgeCheck, Clock, AlertCircle
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

const PERMISSIONS_LIST = [
  { id: 'manage_dashboard',  label: 'View Dashboard',     group: 'Core' },
  { id: 'manage_pos',        label: 'Use POS System',      group: 'Core' },
  { id: 'manage_inventory',  label: 'Manage Inventory',    group: 'Inventory' },
  { id: 'manage_orders',     label: 'Manage Orders',       group: 'Sales' },
  { id: 'manage_customers',  label: 'Manage Customers',    group: 'Sales' },
  { id: 'manage_employees',  label: 'Manage Employees',    group: 'HRM' },
  { id: 'manage_accounting', label: 'Manage Accounting',   group: 'Finance' },
  { id: 'manage_settings',   label: 'Manage Settings',     group: 'Admin' },
  { id: 'view_reports',      label: 'View Reports',        group: 'Admin' },
  { id: 'manage_branches',   label: 'Manage Branches',     group: 'Admin' },
];

const PERM_GROUPS = [...new Set(PERMISSIONS_LIST.map(p => p.group))];

const EMPTY_EMP = {
  employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
  name: '', surname: '', phone: '', email: '',
  education: '', department: '', designation: '', roleId: '',
  nid: '', birthCertificate: '',
  status: 'active',
  salary: { basic: 0, houseRent: 0, medical: 0, transport: 0, other: 0 },
  password: '',
  photo: '',
};

const EMPTY_ROLE = { name: '', description: '', permissions: [] as string[] };

export default function Employees() {
  const [tab, setTab]               = useState<'employees'|'roles'|'attendance'|'payroll'>('employees');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(10);
  const [showEmpModal, setShowEmpModal]   = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingEmpId, setEditingEmpId]   = useState<string|null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string|null>(null);
  const [showPermModal, setShowPermModal] = useState(false);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<any>(null);
  const [userPerms, setUserPerms] = useState<string[]>([]);
  const [formData, setFormData]     = useState(EMPTY_EMP);
  const [roleData, setRoleData]     = useState(EMPTY_ROLE);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const qc = useQueryClient();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const tId = toast.loading('Uploading profile photo...');
    try {
      const res = await uploadApi.upload(file);
      const url = res.data.data.url;
      setFormData(prev => ({ ...prev, photo: url }));
      toast.success('Photo uploaded successfully', { id: tId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: tId });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const { data: empData,   isLoading: empLoading }   = useQuery({ queryKey: ['employees', page, limit, search], queryFn: () => employeesApi.getAll({ page, limit, search }), staleTime: 30000 });
  const { data: rolesData, isLoading: rolesLoading } = useQuery({ queryKey: ['roles'],     queryFn: () => rolesApi.getAll() });

  const employees = empData?.data?.data?.employees || [];
  const pagination = empData?.data?.data?.pagination || { total: 0, totalPages: 1 };
  const roles = rolesData?.data?.data || [];

  const salaryTotal = (s: any) => (s?.basic||0)+(s?.houseRent||0)+(s?.medical||0)+(s?.transport||0)+(s?.other||0);

  const saveEmpMutation = useMutation({
    mutationFn: (d: any) => editingEmpId ? employeesApi.update(editingEmpId, d) : employeesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success(editingEmpId ? 'Employee updated' : 'Employee added'); closeEmpModal(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const deleteEmpMutation = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employees'] }); toast.success('Employee removed'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const saveRoleMutation = useMutation({
    mutationFn: (d: any) => editingRoleId ? rolesApi.update(editingRoleId, d) : rolesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success(editingRoleId ? 'Role updated' : 'Role created'); closeRoleModal(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); toast.success('Role deleted'); },
  });
  const updatePermsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      employeesApi.updatePermissions(userId, permissions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Permissions updated successfully');
      setShowPermModal(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update permissions'),
  });

  function openAddEmp() { setEditingEmpId(null); setFormData({ ...EMPTY_EMP, employeeId: `EMP-${Math.floor(1000+Math.random()*9000)}` }); setShowEmpModal(true); }
  function openEditEmp(emp: any) {
    setEditingEmpId(emp._id);
    setFormData({ employeeId: emp.employeeId, name: emp.name, surname: emp.surname||'', phone: emp.phone, email: emp.email||'', education: emp.education||'', department: emp.department||'', designation: emp.designation||'', roleId: emp.roleId||'', status: emp.status||'active', nid: emp.nid||'', birthCertificate: emp.birthCertificate||'', salary: emp.salary||{ basic:0,houseRent:0,medical:0,transport:0,other:0 }, password: '', photo: emp.photo||'' });
    setShowEmpModal(true);
  }
  function closeEmpModal() { setShowEmpModal(false); setEditingEmpId(null); }
  function openAddRole() { setEditingRoleId(null); setRoleData(EMPTY_ROLE); setShowRoleModal(true); }
  function openEditRole(role: any) { setEditingRoleId(role._id); setRoleData({ name: role.name, description: role.description||'', permissions: role.permissions||[] }); setShowRoleModal(true); }
  function closeRoleModal() { setShowRoleModal(false); setEditingRoleId(null); }

  function togglePerm(id: string) {
    setRoleData(prev => ({ ...prev, permissions: prev.permissions.includes(id) ? prev.permissions.filter(p => p !== id) : [...prev.permissions, id] }));
  }

  const monthlyPayroll = employees.reduce((sum: number, e: any) => sum + salaryTotal(e.salary), 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Employee Management</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your workforce, roles &amp; permissions</p>
        </div>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-xl border">
          {([
            ['employees','Employees',User],
            ['roles','Roles',Shield],
            ['attendance', 'Attendance', Calendar],
            ['payroll', 'Payroll', CreditCard]
          ] as const).map(([id,label,Icon]) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', tab === id ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── EMPLOYEES TAB ── */}
      {tab === 'employees' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label:'Total Staff',     value: pagination.total,       Icon: Users,       color:'bg-blue-500/10 text-blue-600' },
              { label:'Active',          value: employees.filter((e:any)=>e.status!=='inactive').length, Icon: User, color:'bg-emerald-500/10 text-emerald-600' },
              { label:'Monthly Payroll', value: formatCurrency(monthlyPayroll), Icon: DollarSign, color:'bg-amber-500/10 text-amber-600' },
            ].map(s => (
              <Card key={s.label} className="stat-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', s.color)}>
                    <s.Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-bold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table Card */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search employees…" className="pl-9" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} />
              </div>
              <Button onClick={openAddEmp} className="gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto">
                <Plus className="h-4 w-4" />Add Employee
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th><th>ID</th><th>Department</th>
                      <th>Designation</th><th className="text-right">Salary</th>
                      <th>Status</th><th>Portal Access</th><th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empLoading ? (
                      [...Array(4)].map((_,i)=>(
                        <tr key={i}><td colSpan={8}><div className="h-12 skeleton my-1 rounded" /></td></tr>
                      ))
                    ) : employees.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-16 text-muted-foreground">
                        <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        No employees found
                      </td></tr>
                    ) : employees.map((emp: any) => (
                      <tr key={emp._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            {emp.photo ? (
                              <img src={emp.photo} alt={emp.name} className="h-9 w-9 rounded-full object-cover border border-muted/50 flex-shrink-0" />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                                {emp.name?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-sm">{emp.name} {emp.surname}</p>
                              <p className="text-xs text-muted-foreground">{emp.email||emp.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="font-mono text-xs text-muted-foreground">{emp.employeeId||'-'}</span></td>
                        <td><span className="text-sm">{emp.department||'-'}</span></td>
                        <td>
                          <span className="badge badge-primary text-[10px]">{emp.designation||'Staff'}</span>
                        </td>
                        <td className="text-right font-semibold">{formatCurrency(salaryTotal(emp.salary))}</td>
                        <td>
                          <span className={cn(
                            'badge text-[10px] font-bold uppercase',
                            emp.status==='active' ? 'badge-success' :
                            emp.status==='onleave' ? 'badge-warning' : 'badge-danger'
                          )}>
                            {emp.status||'active'}
                          </span>
                        </td>
                        <td>
                          {emp.userId ? (
                            <span className="flex items-center gap-1.5">
                              <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                              <span className="text-[10px] font-semibold text-emerald-600">
                                {emp.userId?.role ? emp.userId.role.charAt(0).toUpperCase() + emp.userId.role.slice(1) : 'Linked'}
                              </span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                              <span className="text-[10px] font-semibold text-amber-600">Pending</span>
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="icon"
                              className={cn('h-8 w-8', emp.userId ? 'text-muted-foreground hover:text-primary' : 'text-muted-foreground/40 cursor-not-allowed')}
                              title={emp.userId ? 'Manage Permissions' : 'Employee must register portal access first'}
                              onClick={()=>{
                                if (!emp.userId) { toast.warning('Employee has not registered portal access yet.'); return; }
                                setSelectedUserForPerms(emp.userId);
                                setUserPerms(Array.isArray(emp.userId?.permissions) ? emp.userId.permissions : []);
                                setShowPermModal(true);
                              }}
                            ><Shield className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={()=>openEditEmp(emp)}><Edit className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={()=>{if(confirm('Delete this employee?'))deleteEmpMutation.mutate(emp._id)}}><Trash2 className="h-4 w-4"/></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Items per page:</span>
                    <select
                      className="bg-transparent border-none focus:ring-0 cursor-pointer font-medium text-sm"
                      value={limit}
                      onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                    >
                      {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <span>
                    {pagination.total === 0 ? 'No employees' :
                      `Showing ${(page-1)*limit+1} – ${Math.min(page*limit, pagination.total)} of ${pagination.total} employee${pagination.total !== 1 ? 's' : ''}`
                    }
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon-sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages||1) }, (_, i) => {
                      const tot = pagination.totalPages || 1;
                      let pn: number;
                      if (tot <= 5) pn = i + 1;
                      else if (page <= 3) pn = i + 1;
                      else if (page >= tot - 2) pn = tot - 4 + i;
                      else pn = page - 2 + i;
                      return (
                        <Button key={pn} variant={page===pn?'default':'ghost'} size="icon-sm" className="w-8 h-8" onClick={()=>setPage(pn)}>
                          {pn}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="icon-sm" disabled={page>=(pagination.totalPages||1)} onClick={()=>setPage(p=>p+1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── ROLES TAB ── */}
      {tab === 'roles' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">Custom Roles</p>
              <p className="text-sm text-muted-foreground">Define roles with granular permissions for your team</p>
            </div>
            <Button onClick={openAddRole} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />New Role
            </Button>
          </div>

          {rolesLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_,i)=><div key={i} className="h-24 skeleton rounded-xl"/>)}</div>
          ) : roles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 gap-3">
                <Shield className="h-12 w-12 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">No custom roles yet</p>
                <Button onClick={openAddRole} className="gap-2"><Plus className="h-4 w-4"/>Create Role</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((role: any) => (
                <Card key={role._id} className="card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">{role.name}</p>
                          <p className="text-xs text-muted-foreground">{role.description||'No description'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={()=>openEditRole(role)}><Edit className="h-3.5 w-3.5"/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={()=>{if(confirm('Delete this role?'))deleteRoleMutation.mutate(role._id)}}><Trash2 className="h-3.5 w-3.5"/></Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(role.permissions||[]).length === 0
                        ? <span className="text-xs text-muted-foreground">No permissions assigned</span>
                        : (role.permissions||[]).slice(0,6).map((p: string) => {
                            const perm = PERMISSIONS_LIST.find(x=>x.id===p);
                            return <span key={p} className="badge badge-primary text-[10px]">{perm?.label||p}</span>;
                          })
                      }
                      {(role.permissions||[]).length > 6 && (
                        <span className="badge text-[10px] bg-muted text-muted-foreground">+{(role.permissions||[]).length-6} more</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ATTENDANCE TAB ── */}
      {tab === 'attendance' && (
        <AttendanceTab employees={employees} />
      )}

      {/* ── PAYROLL TAB ── */}
      {tab === 'payroll' && (
        <PayrollTab
          month={selectedMonth}
          setMonth={setSelectedMonth}
          year={selectedYear}
          setYear={setSelectedYear}
        />
      )}

      {/* ── EMPLOYEE MODAL ── */}
      {showEmpModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl w-full bg-card border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-lg">{editingEmpId?'Edit Employee':'Add Employee'}</h3>
              <Button variant="ghost" size="icon" onClick={closeEmpModal}><X className="h-4 w-4"/></Button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
              {/* Photo Upload Panel */}
              <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border">
                <div className="relative h-16 w-16 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground/60" />
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-background/85 flex items-center justify-center animate-pulse">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Profile Photo</p>
                  <p className="text-[10px] text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
                  <div className="flex items-center gap-2 mt-1">
                    <label className={cn(
                      "inline-flex items-center justify-center rounded-md text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 px-2.5 cursor-pointer",
                      uploadingPhoto && "opacity-50 pointer-events-none"
                    )}>
                      <span>Upload Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                    </label>
                    {formData.photo && (
                      <Button type="button" variant="ghost" className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 px-2" onClick={() => setFormData({...formData, photo: ''})}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Employee ID</label>
                  <Input value={formData.employeeId} onChange={e=>setFormData({...formData,employeeId:e.target.value})} className="font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">First Name <span className="text-destructive">*</span></label>
                  <Input value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} placeholder="Enter name" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Last Name</label>
                  <Input value={formData.surname} onChange={e=>setFormData({...formData,surname:e.target.value})} placeholder="Surname" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input type="email" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone <span className="text-destructive">*</span></label>
                  <Input value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Department</label>
                  <Input value={formData.department} onChange={e=>setFormData({...formData,department:e.target.value})} placeholder="Sales, IT, etc." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Designation / Role</label>
                  <select className="w-full" value={formData.designation} onChange={e=>{
                    const r=roles.find((x:any)=>x.name===e.target.value);
                    setFormData({...formData,designation:e.target.value,roleId:r?r._id:''});
                  }}>
                    <option value="">Select role</option>
                    <optgroup label="System Roles">
                      {['Manager','Cashier','Salesman','Accountant'].map(r=><option key={r} value={r}>{r}</option>)}
                    </optgroup>
                    {roles.length>0&&<optgroup label="Custom Roles">{roles.map((r:any)=><option key={r._id} value={r.name}>{r.name}</option>)}</optgroup>}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Education</label>
                  <Input value={formData.education} onChange={e=>setFormData({...formData,education:e.target.value})} placeholder="Degrees, certifications…" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">NID Number</label>
                  <Input value={formData.nid} onChange={e=>setFormData({...formData,nid:e.target.value})} placeholder="NID Number" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Birth Certificate</label>
                  <Input value={formData.birthCertificate} onChange={e=>setFormData({...formData,birthCertificate:e.target.value})} placeholder="Birth Certificate Number" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <select className="w-full" value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value})}>
                    <option value="active">Active</option>
                    <option value="onleave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
              {/* Password — only when adding new employee */}
              {!editingEmpId && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    Portal Login Password
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 mb-3">
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                      This password lets the employee log in to the Employee Portal using their email or phone number.
                    </p>
                  </div>
                  <Input
                    type="password"
                    value={(formData as any).password || ''}
                    onChange={e => setFormData({...formData, password: e.target.value} as any)}
                    placeholder="Min. 6 characters"
                    className="h-9"
                  />
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary"/>
                  Salary Breakdown (৳) — Total: <span className="text-primary">{formatCurrency(salaryTotal(formData.salary))}</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(['basic','houseRent','medical','transport','other'] as const).map(f=>(
                    <div key={f}>
                      <label className="text-xs text-muted-foreground capitalize block mb-1">{f.replace(/([A-Z])/g,' $1')}</label>
                      <Input type="number" min="0" value={(formData.salary as any)[f]||''} onChange={e=>setFormData({...formData,salary:{...formData.salary,[f]:Number(e.target.value)}})} className="h-9 text-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeEmpModal}>Cancel</Button>
              <Button className="flex-1 shadow-lg shadow-primary/20" onClick={()=>saveEmpMutation.mutate(formData)} disabled={saveEmpMutation.isPending}>
                {saveEmpMutation.isPending?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Saving…</>:editingEmpId?'Update Employee':'Add Employee'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── ROLE MODAL ── */}
      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xl w-full bg-card border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="font-bold text-lg">{editingRoleId?'Edit Role':'Create Role'}</h3>
                <p className="text-xs text-muted-foreground">Define permissions for this role</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeRoleModal}><X className="h-4 w-4"/></Button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
              <div>
                <label className="text-sm font-medium mb-1 block">Role Name <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Senior Accountant" value={roleData.name} onChange={e=>setRoleData({...roleData,name:e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input placeholder="Brief description…" value={roleData.description} onChange={e=>setRoleData({...roleData,description:e.target.value})} />
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold">Permissions</label>
                  <div className="flex gap-2 text-xs">
                    <button className="text-primary hover:underline" onClick={()=>setRoleData({...roleData,permissions:PERMISSIONS_LIST.map(p=>p.id)})}>Select All</button>
                    <span className="text-muted-foreground">·</span>
                    <button className="text-muted-foreground hover:underline" onClick={()=>setRoleData({...roleData,permissions:[]})}>Clear</button>
                  </div>
                </div>
                {PERM_GROUPS.map(group=>(
                  <div key={group} className="mb-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{group}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PERMISSIONS_LIST.filter(p=>p.group===group).map(perm=>{
                        const checked = roleData.permissions.includes(perm.id);
                        return (
                          <button key={perm.id} type="button" onClick={()=>togglePerm(perm.id)}
                            className={cn('perm-card', checked&&'checked')}>
                            <div className={cn('perm-check', checked&&'checked')}>
                              {checked&&<Check className="h-3 w-3 text-white"/>}
                            </div>
                            <span className="text-sm font-medium">{perm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeRoleModal}>Cancel</Button>
              <Button className="flex-1 shadow-lg shadow-primary/20" onClick={()=>saveRoleMutation.mutate(roleData)} disabled={!roleData.name||saveRoleMutation.isPending}>
                {saveRoleMutation.isPending?<><Loader2 className="h-4 w-4 animate-spin mr-2"/>Saving…</>:editingRoleId?'Update Role':'Create Role'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── PERMISSIONS MODAL ── */}
      {showPermModal && selectedUserForPerms && (
        <div className="modal-overlay">
          <div className="modal-content max-w-xl w-full bg-card border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Direct Permissions
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-semibold text-foreground">{selectedUserForPerms.email || selectedUserForPerms.phone}</span>
                  {' · '}
                  <span className="capitalize badge badge-primary text-[10px] py-0.5">{selectedUserForPerms.role || 'employee'}</span>
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={()=>setShowPermModal(false)}><X className="h-4 w-4"/></Button>
            </div>

            {/* Current permission summary */}
            <div className="px-6 pt-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/60 mb-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Active Permissions</p>
                  <p className="text-lg font-bold text-primary">{userPerms.length} <span className="text-sm font-normal text-muted-foreground">/ {PERMISSIONS_LIST.length}</span></p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button className="px-3 py-1.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors" onClick={()=>setUserPerms(PERMISSIONS_LIST.map(p=>p.id))}>Grant All</button>
                  <button className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors" onClick={()=>setUserPerms([])}>Revoke All</button>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4 space-y-4 max-h-[50vh] overflow-y-auto scrollbar-thin">
              {PERM_GROUPS.map(group=>(
                <div key={group}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span className="h-px flex-1 bg-border" />{group}<span className="h-px flex-1 bg-border" />
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERMISSIONS_LIST.filter(p=>p.group===group).map(perm=>{
                      const checked = userPerms.includes(perm.id);
                      return (
                        <button key={perm.id} type="button"
                          onClick={()=>setUserPerms(prev=>prev.includes(perm.id)?prev.filter(p=>p!==perm.id):[...prev,perm.id])}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                            checked
                              ? 'border-primary/40 bg-primary/5 shadow-sm'
                              : 'border-border bg-muted/20 hover:border-border/80 hover:bg-muted/40'
                          )}>
                          <div className={cn(
                            'h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                            checked ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                          )}>
                            {checked && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className={cn('text-sm font-medium', checked ? 'text-foreground' : 'text-muted-foreground')}>{perm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={()=>setShowPermModal(false)}>Cancel</Button>
              <Button
                className="flex-1 shadow-lg shadow-primary/20 gap-2"
                onClick={()=>updatePermsMutation.mutate({ userId: selectedUserForPerms._id, permissions: userPerms })}
                disabled={updatePermsMutation.isPending}
              >
                {updatePermsMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Check className="h-4 w-4" />Save Permissions</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ATTENDANCE TAB COMPONENT ──────────────────────────────────────────
function AttendanceTab({ employees }: { employees: any[] }) {
  const [subTab, setSubTab] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selEmpId, setSelEmpId] = useState(employees[0]?._id || '');
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selYear, setSelYear] = useState(new Date().getFullYear());
  const qc = useQueryClient();

  // Daily Query
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () => employeesApi.getAttendance({ date: selectedDate }),
    enabled: subTab === 'daily'
  });

  const attendance = attendanceData?.data?.data?.attendance || [];

  // Monthly Range Calculation
  const firstDay = new Date(selYear, selMonth - 1, 1).toISOString().split('T')[0];
  const lastDay = new Date(selYear, selMonth, 0).toISOString().split('T')[0];

  // Monthly Query
  const { data: monthlyAttendanceData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['attendance-monthly', selEmpId, selMonth, selYear],
    queryFn: () => employeesApi.getAttendance({
      employeeId: selEmpId,
      startDate: firstDay,
      endDate: lastDay
    }),
    enabled: subTab === 'monthly' && !!selEmpId
  });

  const monthlyAttendance = monthlyAttendanceData?.data?.data?.attendance || [];

  const recordMutation = useMutation({
    mutationFn: (d: any) => employeesApi.recordAttendance(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-monthly'] });
      toast.success('Attendance recorded');
    },
  });

  // Calculate statistics for the selected month
  const stats = monthlyAttendance.reduce((acc: any, curr: any) => {
    const s = curr.status || 'absent';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, { present: 0, absent: 0, late: 0, half_day: 0, on_leave: 0 });

  // Get date range array for the entire month
  const getDaysInMonth = (month: number, year: number) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    while (date.getMonth() === month - 1) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const daysOfSelectedMonth = getDaysInMonth(selMonth, selYear);

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="flex items-center justify-between bg-muted/40 p-1.5 rounded-xl border w-full sm:w-fit">
        <button
          onClick={() => setSubTab('daily')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            subTab === 'daily' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Daily Record
        </button>
        <button
          onClick={() => {
            setSubTab('monthly');
            if (employees.length > 0 && !selEmpId) {
              setSelEmpId(employees[0]._id);
            }
          }}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            subTab === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Monthly Log &amp; Timeline
        </button>
      </div>

      {/* ── DAILY VIEW ── */}
      {subTab === 'daily' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Daily Attendance</CardTitle>
              <CardDescription>Record and manage daily staff presence</CardDescription>
            </div>
            <Input
              type="date"
              className="w-44"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10">No employees found</td></tr>
                  ) : employees.map((emp) => {
                    const record = attendance.find((a: any) => a.employeeId?._id === emp._id);
                    return (
                      <tr key={emp._id}>
                        <td>
                          <p className="font-semibold text-sm">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.employeeId}</p>
                        </td>
                        <td className="text-sm">
                          {record?.checkIn ? (
                            <span className="font-mono">{new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span className="text-muted-foreground/50 font-mono">-</span>
                          )}
                        </td>
                        <td className="text-sm">
                          {record?.checkOut ? (
                            <span className="font-mono">{new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span className="text-muted-foreground/50 font-mono">-</span>
                          )}
                        </td>
                        <td>
                          <select
                            className="text-xs p-1 rounded border bg-card font-medium"
                            value={record?.status || 'absent'}
                            onChange={(e) => recordMutation.mutate({
                              employeeId: emp._id,
                              date: selectedDate,
                              status: e.target.value
                            })}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="half_day">Half Day</option>
                            <option value="on_leave">On Leave</option>
                          </select>
                        </td>
                        <td className="text-right">
                          {!record?.checkIn ? (
                            <Button size="sm" className="h-7 text-[10px] font-semibold" onClick={() => recordMutation.mutate({
                              employeeId: emp._id,
                              date: selectedDate,
                              checkIn: new Date().toISOString(),
                              status: 'present'
                            })}>Check In</Button>
                          ) : !record?.checkOut ? (
                            <Button size="sm" variant="outline" className="h-7 text-[10px] font-semibold" onClick={() => recordMutation.mutate({
                              employeeId: emp._id,
                              date: selectedDate,
                              checkOut: new Date().toISOString()
                            })}>Check Out</Button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded font-bold uppercase">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── MONTHLY VIEW WITH LOGS & TIMELINE ── */}
      {subTab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-xl border">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial">
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">Select Employee</label>
                <select
                  value={selEmpId}
                  onChange={(e) => setSelEmpId(e.target.value)}
                  className="p-2 rounded border bg-card text-sm w-full sm:w-56 font-semibold"
                >
                  <option value="">Choose Employee</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.employeeId})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">Month</label>
                <select
                  value={selMonth}
                  onChange={(e) => setSelMonth(Number(e.target.value))}
                  className="p-2 rounded border bg-card text-sm font-semibold"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-semibold mb-1 block">Year</label>
                <select
                  value={selYear}
                  onChange={(e) => setSelYear(Number(e.target.value))}
                  className="p-2 rounded border bg-card text-sm font-semibold"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {selEmpId ? (
            <>
              {/* Monthly stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Present Days', value: stats.present + stats.half_day, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'Late Arrivals', value: stats.late, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
                  { label: 'Half Days', value: stats.half_day, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
                  { label: 'On Leave', value: stats.on_leave, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
                  { label: 'Absent Days', value: stats.absent, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
                ].map(s => (
                  <Card key={s.label} className={cn('border', s.color)}>
                    <CardContent className="p-3.5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-85">{s.label}</p>
                      <p className="text-2xl font-black mt-1">{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Monthly date-wise timeline logs */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Log &amp; Timeline Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {monthlyLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date / Day</th>
                            <th>Status</th>
                            <th>In / Out Timeline Log</th>
                            <th>Hours Worked</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daysOfSelectedMonth.map(day => {
                            const dateStr = day.toISOString().split('T')[0];
                            const record = monthlyAttendance.find((a: any) => {
                              const rDate = new Date(a.date).toISOString().split('T')[0];
                              return rDate === dateStr;
                            });

                            let badgeColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
                            let statusText = 'Absent';

                            if (record) {
                              if (record.status === 'present') {
                                badgeColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                                statusText = 'Present';
                              } else if (record.status === 'late') {
                                badgeColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                                statusText = 'Late';
                              } else if (record.status === 'half_day') {
                                badgeColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                                statusText = 'Half Day';
                              } else if (record.status === 'on_leave') {
                                badgeColor = 'text-purple-500 bg-purple-500/10 border-purple-500/20';
                                statusText = 'On Leave';
                              }
                            }

                            // Calculate worked hours
                            let workedHours = '-';
                            if (record?.checkIn && record?.checkOut) {
                              const diff = new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime();
                              const hrs = Math.floor(diff / 3600000);
                              const mins = Math.round((diff % 3600000) / 60000);
                              workedHours = `${hrs}h ${mins}m`;
                            }

                            return (
                              <tr key={dateStr} className="hover:bg-muted/10">
                                <td>
                                  <span className="font-semibold text-sm">
                                    {day.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground block font-medium">
                                    {day.toLocaleDateString('default', { weekday: 'long' })}
                                  </span>
                                </td>
                                <td>
                                  <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider', badgeColor)}>
                                    {statusText}
                                  </span>
                                </td>
                                <td>
                                  {record?.checkIn ? (
                                    <div className="flex flex-col gap-1 text-xs">
                                      <div className="flex items-center gap-1.5 text-emerald-600 font-semibold font-mono">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        Logged In: {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                      </div>
                                      {record.checkOut ? (
                                        <div className="flex items-center gap-1.5 text-rose-600 font-semibold font-mono">
                                          <span className="h-2 w-2 rounded-full bg-rose-500" />
                                          Logged Out: {new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </div>
                                      ) : (
                                        <div className="text-muted-foreground text-[10px] italic">Still Active / Not checked out</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/40 italic text-xs">No activity logged</span>
                                  )}
                                </td>
                                <td className="font-mono text-sm font-semibold">
                                  {workedHours}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed py-16 text-center text-muted-foreground bg-muted/5">
              <CardContent>
                <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="font-semibold">Please select an employee to view monthly logs</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PAYROLL TAB COMPONENT ───────────────────────────────────────────
function PayrollTab({ month, setMonth, year, setYear }: any) {
  const qc = useQueryClient();
  const { data: payrollData, isLoading } = useQuery({
    queryKey: ['payroll', month, year],
    queryFn: () => employeesApi.getPayroll({ month, year })
  });

  const payrolls = payrollData?.data?.data?.payrolls || [];

  const generateMutation = useMutation({
    mutationFn: () => employeesApi.generatePayroll({ month, year }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Payroll generated');
    },
  });

  const payMutation = useMutation({
    mutationFn: ({ id, data }: any) => employeesApi.paySalary(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Salary paid');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <select className="p-2 rounded border bg-card text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select className="p-2 rounded border bg-card text-sm" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          Generate Payroll
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Month</th>
                  <th>Basic</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-10">Loading...</td></tr>
                ) : payrolls.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10">No records found</td></tr>
                ) : payrolls.map((p: any) => (
                  <tr key={p._id}>
                    <td>
                      <p className="font-medium text-sm">{p.employeeId?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.employeeId?.employeeId}</p>
                    </td>
                    <td className="text-sm">{new Date(0, p.month-1).toLocaleString('default', { month: 'short' })}</td>
                    <td className="text-sm">{formatCurrency(p.basicSalary)}</td>
                    <td className="text-sm font-bold">{formatCurrency(p.netSalary)}</td>
                    <td>
                      <span className={cn('badge text-[10px]', p.status === 'paid' ? 'badge-success' : 'badge-warning')}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {p.status === 'pending' && (
                        <Button size="sm" className="h-7 text-[10px]" onClick={() => payMutation.mutate({
                          id: p._id,
                          data: { paymentMethod: 'Cash' }
                        })}>Pay Salary</Button>
                      )}
                    </td>
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