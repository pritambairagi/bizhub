import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const api = axios.create({
  baseURL: backendUrl ? `${backendUrl.replace(/\/$/, '')}/api/v1` : (import.meta.env.VITE_API_URL || '/api/v1'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('bizhub-auth');
  if (authStorage) {
    try {
      const { state } = JSON.parse(authStorage);
      if (state && state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    } catch (e) {
      // Ignore parse error
    }
  }
  return config;
});

// Products API
export const productsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getStock: (id: string) => api.get(`/products/${id}/stock`),
  adjustStock: (id: string, data: Record<string, unknown>) => api.post(`/products/${id}/adjust-stock`, data),
  getCategories: () => api.get('/products/categories'),
  getAllCategories: () => api.get('/products/categories/all'),
  getCategoryTree: () => api.get('/products/categories/tree'),
  createCategory: (data: Record<string, unknown>) => api.post('/products/categories', data),
  getInventoryStats: () => api.get('/products/inventory-stats'),
};

// Orders API
export const ordersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: Record<string, unknown>) => api.post('/orders', data),
  updateStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
  processPayment: (id: string, payments: Record<string, unknown>[]) => api.post(`/orders/${id}/pay`, { payments }),
  createReturn: (id: string, data: Record<string, unknown>) => api.post(`/orders/${id}/return`, data),
  getDailySales: (branchId?: string) => api.get('/orders/daily-sales', { params: { branchId } }),
  getReport: (startDate: string, endDate: string, branchId?: string) =>
    api.get('/orders/report', { params: { startDate, endDate, branchId } }),
};

// Business API
export const businessApi = {
  get: () => api.get('/business'),
  create: (data: Record<string, unknown>) => api.post('/business', data),
  update: (data: Record<string, unknown>) => api.put('/business', data),
  getSettings: () => api.get('/business/settings'),
  updateSettings: (data: Record<string, unknown>) => api.put('/business/settings', data),
  getBranches: () => api.get('/business/branches'),
  createBranch: (data: Record<string, unknown>) => api.post('/business/branches', data),
  updateBranch: (id: string, data: Record<string, unknown>) => api.put(`/business/branches/${id}`, data),
  deleteBranch: (id: string) => api.delete(`/business/branches/${id}`),
  getWarehouses: () => api.get('/business/warehouses'),
  createWarehouse: (data: Record<string, unknown>) => api.post('/business/warehouses', data),
  getShares: () => api.get('/business/shares'),
  createShare: (data: Record<string, unknown>) => api.post('/business/shares', data),
  updateShare: (id: string, data: Record<string, unknown>) => api.put(`/business/shares/${id}`, data),
  deleteShare: (id: string) => api.delete(`/business/shares/${id}`),
  getExpenses: (params?: Record<string, unknown>) => api.get('/business/expenses', { params }),
  createExpense: (data: Record<string, unknown>) => api.post('/business/expenses', data),
  deleteExpense: (id: string) => api.delete(`/business/expenses/${id}`),
  upgradePlan: (data: Record<string, unknown>) => api.post('/business/upgrade-plan', data),
  getBillingRequests: () => api.get('/business/billing-requests'),
};

// Customers API
export const customersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/crm/customers', { params }),
  getById: (id: string) => api.get(`/crm/customers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/crm/customers', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/crm/customers/${id}`, data),
  delete: (id: string) => api.delete(`/crm/customers/${id}`),
  addWallet: (id: string, amount: number, type: string) =>
    api.post(`/crm/customers/${id}/wallet`, { amount, type }),
};

// Employees API
export const employeesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/hrm/employees', { params }),
  getById: (id: string) => api.get(`/hrm/employees/${id}`),
  create: (data: Record<string, unknown>) => api.post('/hrm/employees', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/hrm/employees/${id}`, data),
  delete: (id: string) => api.delete(`/hrm/employees/${id}`),
  updatePermissions: (userId: string, permissions: string[]) =>
    api.patch(`/hrm/employees/users/${userId}/permissions`, { permissions }),
  getAttendance: (params?: Record<string, unknown>) => api.get('/hrm/attendance', { params }),
  recordAttendance: (data: Record<string, unknown>) => api.post('/hrm/attendance', data),
  getPayroll: (params?: Record<string, unknown>) => api.get('/hrm/payroll', { params }),
  generatePayroll: (data: Record<string, unknown>) => api.post('/hrm/payroll/generate', data),
  paySalary: (id: string, data: Record<string, unknown>) => api.post(`/hrm/payroll/${id}/pay`, data),
};

// Accounting API
export const accountingApi = {
  getAccounts: (params?: Record<string, unknown>) => api.get('/accounting/accounts', { params }),
  createAccount: (data: Record<string, unknown>) => api.post('/accounting/accounts', data),
  getTransactions: (params?: Record<string, unknown>) => api.get('/accounting/transactions', { params }),
  createTransaction: (data: Record<string, unknown>) => api.post('/accounting/transactions', data),
  getBalanceSheet: () => api.get('/accounting/reports/balance-sheet'),
  getProfitLoss: (params?: Record<string, unknown>) => api.get('/accounting/reports/profit-loss', { params }),
  getCashFlow: (params?: Record<string, unknown>) => api.get('/accounting/reports/cash-flow', { params }),
};

// Shop API (E-commerce)
export const shopApi = {
  getProducts: (params?: Record<string, unknown>) => api.get('/shop/products', { params }),
  getCategories: () => api.get('/shop/categories'),
  getCart: () => api.get('/shop/cart'),
  addToCart: (productId: string, qty: number) => api.post('/shop/cart', { productId, qty }),
  updateCartItem: (itemId: string, qty: number) => api.put(`/shop/cart/${itemId}`, { qty }),
  removeCartItem: (itemId: string) => api.delete(`/shop/cart/${itemId}`),
  checkout: (data: Record<string, unknown>) => api.post('/shop/checkout', data),
  getOrders: () => api.get('/shop/orders'),
  getOrderById: (id: string) => api.get(`/shop/orders/${id}`),
};

// ─── Admin / Super Admin API ───────────────────────────────────────────────────
export const adminApi = {
  // Stats & Monitoring
  getStats: () => api.get('/admin/stats'),
  getSystemHealth: () => api.get('/admin/system-health'),
  getRecentActivity: (limit?: number) => api.get('/admin/activity', { params: { limit } }),
  getRevenueAnalytics: (period?: number) => api.get('/admin/revenue-analytics', { params: { period } }),

  // Business Management
  getBusinesses: (params?: Record<string, unknown>) => api.get('/admin/businesses', { params }),
  updateBusiness: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/businesses/${id}`, data),
  deleteBusiness: (id: string) => api.delete(`/admin/businesses/${id}`),

  // User Management
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  updateUserStatus: (id: string, status: string) => api.patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id: string, role: string, businessId?: string) =>
    api.patch(`/admin/users/${id}/role`, { role, businessId }),
  updateUserPermissions: (id: string, permissions: string[]) =>
    api.patch(`/admin/users/${id}/permissions`, { permissions }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  resetUserPassword: (id: string, newPassword: string) =>
    api.post(`/admin/users/${id}/reset-password`, { newPassword }),

  // Platform Settings
  getPlatformSettings: () => api.get('/admin/settings'),
  updatePlatformSettings: (data: Record<string, unknown>) => api.put('/admin/settings', data),

  // Billing requests
  getBillingRequests: () => api.get('/admin/billing-requests'),
  handleBillingRequest: (id: string, data: { action: string, notes?: string }) =>
    api.post(`/admin/billing-requests/${id}/action`, data),
};

export const analyticsApi = {
  getAnalytics: () => api.get('/analytics'),
  getDashboardStats: () => api.get('/analytics/dashboard-stats'),
  getSalesTrends: () => api.get('/analytics/sales-trends'),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Roles API
export const rolesApi = {
  getAll: () => api.get('/roles'),
  create: (data: Record<string, unknown>) => api.post('/roles', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/roles/${id}`, data),
  delete: (id: string) => api.delete(`/roles/${id}`),
};

// Purchases API
export const purchasesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/purchases', { params }),
  getById: (id: string) => api.get(`/purchases/${id}`),
  create: (data: Record<string, unknown>) => api.post('/purchases', data),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/suppliers', { params }),
  getById: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: Record<string, unknown>) => api.post('/suppliers', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// Upload API
export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;