import { Request } from 'express';

export interface IUser {
  _id: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  businessId?: string;
  branchId?: string;
  permissions: string[];
  profile: IUserProfile;
  auth: IUserAuth;
  sessions: ISession[];
  loginHistory: ILoginHistory[];
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole =
  | 'super_admin'
  | 'owner'
  | 'share_holder'
  | 'manager'
  | 'accountant'
  | 'cashier'
  | 'delivery'
  | 'salesman'
  | 'vendor'
  | 'customer'
  | 'custom';

export type UserStatus = 'active' | 'suspended' | 'locked';

export interface IUserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  nid?: string;
  address?: string;
}

export interface IUserAuth {
  googleId?: string;
  facebookId?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface ISession {
  device: string;
  ip: string;
  lastActive: Date;
  createdAt: Date;
}

export interface ILoginHistory {
  ip: string;
  device: string;
  location?: string;
  timestamp: Date;
}

export interface IBusiness {
  _id: string;
  name: string;
  slug: string;
  type: BusinessType;
  industry?: string;
  logo?: string;
  contact: IBusinessContact;
  registration?: IBusinessRegistration;
  settings: IBusinessSettings;
  subscription: ISubscription;
  owner: string;
  status?: 'pending' | 'verified' | 'suspended' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export type BusinessType =
  | 'retail'
  | 'wholesale'
  | 'restaurant'
  | 'pharmacy'
  | 'franchise'
  | 'marketplace';

export interface IBusinessContact {
  email: string;
  phone: string;
  address: string;
  district?: string;
  thana?: string;
}

export interface IBusinessRegistration {
  bin?: string;
  nbr?: string;
  tradeLicense?: string;
}

export interface IBusinessSettings {
  currency: string;
  timezone: string;
  language: string;
  dateFormat?: string;
  taxNumber?: string;
  invoicePrefix?: string;
}

export interface ISubscription {
  plan: string;
  startDate: Date;
  endDate: Date;
  features: string[];
}

export interface IBranch {
  _id: string;
  businessId: string;
  name: string;
  code: string;
  type: BranchType;
  address: IBranchAddress;
  contact: IBranchContact;
  settings: IBranchSettings;
  status: BranchStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type BranchType = 'main_branch' | 'sub_branch' | 'warehouse' | 'storehouse' | 'shop' | 'stowage' | 'restaurant' | 'store' | 'other';
export type BranchStatus = 'active' | 'inactive';

export interface IBranchAddress {
  street?: string;
  district?: string;
  thana?: string;
  zip?: string;
}

export interface IBranchContact {
  phone: string;
  email?: string;
  manager?: string;
}

export interface IBranchSettings {
  posEnabled: boolean;
  warehouseEnabled: boolean;
  defaultWarehouse: boolean;
}

export interface IProduct {
  _id: string;
  businessId: string;
  name: ILocalizedString;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  unit: string;
  description?: ILocalizedString;
  images: string[];
  pricing: IPricing;
  tax: ITax;
  inventory: IInventory;
  expiry: IExpiry;
  status: ProductStatus;
  vendorId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILocalizedString {
  en: string;
  bn: string;
}

export type ProductStatus = 'active' | 'inactive' | 'draft';

export interface IPricing {
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  wholeSalePrice?: number;
}

export interface ITax {
  vatRate: number;
  taxCategory?: string;
}

export interface IInventory {
  trackInventory: boolean;
  lowStockAlert: number;
  reorderPoint: number;
  isSerial: boolean;
  isBatch: boolean;
}

export interface IExpiry {
  trackExpiry: boolean;
  expiryWarningDays: number;
}

export interface ICategory {
  _id: string;
  businessId: string;
  name: ILocalizedString;
  slug: string;
  parentId?: string;
  image?: string;
  icon?: string;
  order: number;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryStatus = 'active' | 'inactive';

export interface IOrder {
  _id: string;
  businessId: string;
  branchId: string;
  orderNumber: string;
  type: OrderType;
  customer: ICustomerInfo;
  items: IOrderItem[];
  subtotal: number;
  discount: IDiscount;
  vat: number;
  total: number;
  paid: number;
  due: number;
  payments: IPayment[];
  status: OrderStatus;
  note?: string;
  invoice?: IInvoice;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderType = 'sale' | 'return' | 'exchange';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface ICustomerInfo {
  id?: string;
  name: string;
  phone: string;
}

export interface IOrderItem {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  discount: number;
  vat: number;
  total: number;
  batch?: string;
  serial?: string;
}

export interface IDiscount {
  type: 'fixed' | 'percentage';
  value: number;
  amount: number;
}

export interface IPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  gateway?: string;
}

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'bkash'
  | 'nagad'
  | 'rocket'
  | 'wallet'
  | 'giftcard';

export interface IInvoice {
  number: string;
  url?: string;
}

export interface ICustomer {
  _id: string;
  businessId: string;
  code: string;
  name: string;
  email?: string;
  phone: string;
  gender?: string;
  dateOfBirth?: Date;
  address?: ICustomerAddress;
  customerType: CustomerType;
  loyalty: ILoyalty;
  wallet: IWallet;
  tags: string[];
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerType = 'regular' | 'vip' | 'wholesale';
export type CustomerStatus = 'active' | 'inactive';

export interface ICustomerAddress {
  present?: string;
  permanent?: string;
  district?: string;
  thana?: string;
}

export interface ILoyalty {
  points: number;
  tier: string;
  lifetimeValue: number;
}

export interface IWallet {
  balance: number;
  transactions: IWalletTransaction[];
}

export interface IWalletTransaction {
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: Date;
}

export interface IAccount {
  _id: string;
  businessId: string;
  name: string;
  code: string;
  type: AccountType;
  subType?: string;
  parentId?: string;
  openingBalance: number;
  currentBalance: number;
  isBank: boolean;
  bankDetails?: IBankDetails;
  mobileBanking?: IMobileBanking;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type AccountType = 'asset' | 'liability' | 'income' | 'expense' | 'equity';
export type AccountStatus = 'active' | 'inactive';

export interface IBankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch?: string;
  routing?: string;
}

export interface IMobileBanking {
  provider: 'bkash' | 'nagad' | 'rocket' | 'other';
  accountNumber: string;
}

export interface ITransaction {
  _id: string;
  businessId: string;
  voucherNumber: string;
  date: Date;
  type: 'debit' | 'credit';
  accountId: string;
  contraAccountId?: string;
  amount: number;
  description: string;
  reference?: string;
  attachments: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployee {
  _id: string;
  businessId: string;
  userId?: string;
  employeeId: string;
  name: string;
  surname?: string;
  email: string;
  phone: string;
  education?: string;
  photo?: string;
  department?: string;
  designation?: string;
  nid?: string;
  birthCertificate?: string;
  joiningDate: Date;
  roleId?: string;
  salary: ISalary;
  attendance: IAttendance;
  leaveBalance: ILeaveBalance;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type EmployeeStatus = 'active' | 'terminated' | 'onleave';

export interface ISalary {
  basic: number;
  houseRent: number;
  medical: number;
  transport: number;
  other: number;
  total: number;
}

export interface IAttendance {
  deviceId?: string;
  faceId?: string;
}

export interface ILeaveBalance {
  casual: number;
  sick: number;
  annual: number;
}

export interface IAttendanceRecord {
  _id: string;
  businessId: string;
  employeeId: string;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'on_leave';
  note?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayroll {
  _id: string;
  businessId: string;
  employeeId: string;
  month: number; // 1-12
  year: number;
  basicSalary: number;
  allowances: {
    houseRent: number;
    medical: number;
    transport: number;
    other: number;
  };
  deductions: {
    tax: number;
    providentFund: number;
    other: number;
  };
  netSalary: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryStock {
  _id: string;
  businessId: string;
  productId: string;
  warehouseId: string;
  batch?: string;
  expiryDate?: Date;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  costPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWarehouse {
  _id: string;
  businessId: string;
  name: string;
  code: string;
  branchId: string;
  type: 'main' | 'sub' | 'transit';
  address: IWarehouseAddress;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type WarehouseStatus = 'active' | 'inactive';

export interface IWarehouseAddress {
  street?: string;
  district?: string;
  thana?: string;
  zip?: string;
}

// Express Request Extensions
export interface AuthRequest extends Omit<Request, 'params'> {
  user?: IUser;
  params: Record<string, string>;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: IPaginationMeta;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Token Types
export interface ITokens {
  accessToken: string;
  refreshToken: string;
}

export interface IPayload {
  userId: string;
  role: UserRole;
  businessId?: string;
  branchId?: string;
}

export interface IPurchase {
  _id: string;
  businessId: string;
  supplierId?: string;
  supplierName: string;
  purchaseNumber: string;
  items: IPurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  status: 'pending' | 'received' | 'partial' | 'ordered';
  purchaseDate: Date;
  note?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseItem {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  costPrice: number;
  total: number;
}

export interface ISupplier {
  _id: string;
  businessId: string;
  name: string;
  companyName?: string;
  email?: string;
  phone: string;
  address?: string;
  brand?: string;
  openingBalance: number;
  balance: number;
  status: 'active' | 'inactive';
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusinessShare {
  _id: string;
  businessId: string;
  partnerName: string;
  email?: string;
  phone: string;
  sharePercentage: number;
  investmentAmount: number;
  role: string;
  status: 'active' | 'inactive';
  joinedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}