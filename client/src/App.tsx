import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import Layout from '@/components/layout/Layout';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import EmployeeAuth from '@/pages/auth/EmployeeAuth';
import Dashboard from '@/pages/Dashboard';

import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import POS from '@/pages/POS';
import Customers from '@/pages/customers/Customers';
import Categories from '@/pages/categories/Categories';
import Inventory from '@/pages/inventory/Inventory';
import Accounting from '@/pages/accounting/Accounting';
import Utilities from '@/pages/accounting/Utilities';
import Employees from '@/pages/hrm/Employees';
import Purchases from '@/pages/hrm/Purchases';
import Suppliers from '@/pages/inventory/Suppliers';
import Branches from '@/pages/business/Branches';
import ShareBusiness from '@/pages/business/ShareBusiness';
import SalesHistory from '@/pages/orders/SalesHistory';
import Settings from '@/pages/Settings';
import Analytics from '@/pages/Analytics';
import Shop from '@/pages/ecommerce/Shop';
import Cart from '@/pages/ecommerce/Cart';
import Checkout from '@/pages/ecommerce/Checkout';
import AdminDashboard from '@/pages/AdminDashboard';
import Onboarding from '@/pages/Onboarding';
import Chat from '@/pages/Chat';
import EMIPage from '@/pages/finance/EMIPage';
import DuesPage from '@/pages/finance/DuesPage';
import AssociationPage from '@/pages/finance/AssociationPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) return <Navigate to="/login" />;

  if (user?.role === 'owner' && !user.businessId && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  if (user?.role === 'owner' && user.businessId && location.pathname === '/onboarding') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" /> : <>{children}</>;
}

function RedirectHandler() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (user.role === 'super_admin') return <Navigate to="/admin" replace />;
  if (user.role === 'owner' || user.role === 'manager' || user.permissions?.includes('manage_dashboard')) return <Navigate to="/dashboard" replace />;
  if (user.permissions?.includes('manage_pos')) return <Navigate to="/pos" replace />;
  
  return <Navigate to="/sales-history" replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/employee-login"
          element={
            <PublicRoute>
              <EmployeeAuth />
            </PublicRoute>
          }
        />

        {/* E-commerce public routes */}
        <Route path="/shop" element={<Shop />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        {/* Onboarding Route */}
        <Route
          path="/onboarding"
          element={
            <PrivateRoute>
              <Onboarding />
            </PrivateRoute>
          }
        />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<RedirectHandler />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Navigate to="/inventory" replace />} />
          <Route path="products/:id" element={<Navigate to="/inventory" replace />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="sales-history" element={<SalesHistory />} />
          <Route path="pos" element={<POS />} />
          <Route path="customers" element={<Customers />} />
          <Route path="categories" element={<Categories />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="branches" element={<Branches />} />
          <Route path="share-business" element={<ShareBusiness />} />
          <Route path="accounting" element={<Accounting />} />
          <Route path="utilities" element={<Utilities />} />
          <Route path="emi" element={<EMIPage />} />
          <Route path="dues" element={<DuesPage />} />
          <Route path="association" element={<AssociationPage />} />
          <Route path="employees" element={<Employees />} />
          <Route path="settings" element={<Settings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="chat" element={<Chat />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}