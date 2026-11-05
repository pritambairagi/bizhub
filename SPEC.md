# BizHub - Enterprise ERP & POS for Bangladesh

## Project Overview

**Project Name:** BizHub (বিজহাব)
**Type:** Enterprise SaaS ERP + POS + E-commerce Platform
**Target Users:** Bangladesh SMEs, retail shops, wholesalers, pharmacies, restaurants, franchise businesses, multi-vendor marketplaces
**Core Functionality:** Complete business management with POS, inventory, accounting, CRM, HRM, e-commerce, and analytics
**Target Market:** Bangladesh and South Asia

---

## Technical Architecture

### Tech Stack
- **Frontend:** React 18 + Vite + TypeScript
- **Backend:** Node.js 20 + Express.js + TypeScript
- **Database:** MongoDB 7 + Mongoose
- **State Management:** Zustand + React Query
- **Styling:** Tailwind CSS 3.4 + ShadCN UI
- **Charts:** Recharts
- **Authentication:** JWT + Refresh Token
- **File Storage:** Cloudinary (configurable for AWS S3)
- **Real-time:** Socket.io
- **Payments:** SSLCommerz, bKash, Nagad (Bangladesh payment gateways)

### Project Structure
```
bizhub/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── ...
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── services/      # Business logic
│   │   ├── utils/        # Utilities
│   │   └── types/        # TypeScript types
│   └── ...
├── docker/                 # Docker configs
├── nginx/                  # Nginx configs
└── docs/                  # Documentation
```

---

## UI/UX Specification

### Design System

#### Color Palette
- **Primary:** `#0F766E` (Teal-700 - Trust, Growth)
- **Primary Light:** `#14B8A6` (Teal-500)
- **Primary Dark:** `#0D5D56` (Teal-800)
- **Secondary:** `#7C3AED` (Violet-600 - Premium)
- **Accent:** `#F59E0B` (Amber-500 - Bangladesh)
- **Success:** `#10B981` (Emerald-500)
- **Warning:** `#F59E0B` (Amber-500)
- **Error:** `#EF4444` (Red-500)
- **Background:** `#F8FAFC` (Slate-50)
- **Surface:** `#FFFFFF`
- **Text Primary:** `#1E293B` (Slate-800)
- **Text Secondary:** `#64748B` (Slate-500)
- **Border:** `#E2E8F0` (Slate-200)

#### Typography
- **Primary Font:** `Inter` (Modern, readable)
- **Secondary Font:** `Noto Sans Bengali` (Bangla support)
- **Heading Font:** `Plus Jakarta Sans` (Professional)

| Element | Size | Weight |
|---------|------|--------|
| H1 | 36px | 800 |
| H2 | 30px | 700 |
| H3 | 24px | 700 |
| H4 | 20px | 600 |
| Body | 16px | 400 |
| Small | 14px | 400 |
| Caption | 12px | 400 |

#### Spacing System
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

#### Border Radius
- Small: 4px (buttons, inputs)
- Default: 8px (cards)
- Large: 12px (modals)
- XL: 16px (panels)

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: 1024px - 1440px
- Large: > 1440px

### Layout Structure

#### Admin Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  Top Bar (Logo, Search, Notifications, Profile)        │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Sidebar │           Main Content Area                  │
│  (240px) │           (Scrollable)                      │
│          │                                              │
│  - Nav   │  ┌────────────────────────────────────────┐ │
│  - Quick │  │  Page Header + Actions                  │ │
│    Stats │  ├────────────────────────────────────────┤ │
│          │  │                                        │ │
│          │  │  Content (Tables, Forms, Charts)        │ │
│          │  │                                        │ │
│          │  └────────────────────────────────────────┘ │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

#### POS Layout (Touch-optimized)
```
┌─────────────────────────────────────────────────────────┐
│  Branch: Dhaka Store  |  User: John  |  Time: 10:30   │
├───────────────────────────────────┬─────────────────────┤
│                                   │                     │
│   Product Grid (3-4 cols)          │   Cart              │
│   - Categories                    │   - Items           │
│   - Search                         │   - Qty controls    │
│   - Quick add                     │   - Discount        │
│                                   │   - Total           │
│                                   │   - Payment btns    │
│                                   │                     │
├───────────────────────────────────┴─────────────────────┤
│  Action Bar: Hold | Recall | Return | Checkout          │
└─────────────────────────────────────────────────────────┘
```

### Component Library

#### Buttons
- **Primary:** Teal background, white text
- **Secondary:** White background, teal border
- **Ghost:** Transparent, hover shows background
- **Danger:** Red for destructive actions
- **Sizes:** sm (32px), md (40px), lg (48px)
- **States:** default, hover, active, disabled, loading

#### Cards
- White background
- 8px border radius
- 1px border (slate-200)
- Shadow: `0 1px 3px rgba(0,0,0,0.1)`
- Hover: Elevated shadow

#### Tables
- Striped rows (alternate slate-50)
- Sticky header
- Sortable columns
- Row actions
- Pagination
- Bulk selection

#### Forms
- Floating labels
- Inline validation
- Error states with red border
- Success states with green border
- Required indicator (*)

#### Modals
- Centered overlay (50% black)
- Max-width: 500px (sm), 700px (md), 900px (lg)
- Close button top-right
- Action buttons bottom-right

---

## Module Specifications

### 1. Authentication Module

#### Features
- JWT access token (15min) + refresh token (7 days)
- Email/password registration and login
- Phone OTP verification
- Google OAuth
- Facebook OAuth
- Role-based access control (RBAC)
- Session management (max 5 concurrent)
- Device login history
- 2FA via authenticator app
- Account lock after 5 failed attempts
- IP whitelist/blacklist
- Complete audit logging

#### Roles Hierarchy
```
Super Admin (Platform)
    └── Business Owner
        ├── Branch Manager
        │   ├── Accountant
        │   ├── Cashier
        │   └── Delivery Agent
        ├── HR Manager
        └── Seller/Vendor
            └── Customer
```

#### Permissions
- `*` (Full access)
- `read`, `create`, `update`, `delete`
- Module-specific permissions

### 2. Smart POS Module

#### Features
- Touch-optimized interface
- Barcode/QR scanning
- Thermal printer integration (ESC/POS)
- A4 invoice printing
- Draft sales / Hold cart
- Split payments
- Due management
- Discounts (% and fixed)
- Coupon codes
- Gift cards
- Customer wallet
- Offline mode with sync
- Quick checkout (F1-F12)
- Returns & refunds
- Exchange products
- Multi-payment split
- VAT calculation (NBR compliant)
- Digital invoice (e-invoice)
- Bangla + English invoices

#### UI Layout
- Left: Category tabs + Product grid
- Right: Cart + Customer info + Total + Payment

### 3. Inventory Module

#### Features
- Real-time stock sync across branches
- Multi-warehouse support
- Batch tracking
- Expiry date management
- Serial number tracking
- Auto reorder points
- Purchase orders
- Supplier management
- Stock transfer (inter-branch)
- Damage/loss tracking
- Stock audit
- SKU/Barcode generator
- Inventory valuation (FIFO, LIFO, Average)

### 4. Accounting Module

#### Features
- Chart of accounts
- General ledger
- Accounts payable
- Accounts receivable
- Bank reconciliation
- Mobile banking ledger (bKash, Nagad, Rocket)
- Contra entries
- Cashbook
- Daybook
- P&L statement
- Balance sheet
- Cash flow analysis
- Expense tracking
- Budget vs actual
- Tax/VAT management
- Payroll accounting
- Auto journal entries
- Export to Excel/PDF

### 5. CRM Module

#### Features
- Customer database
- Customer ledger/wallet
- Loyalty points
- Reward system
- SMS notifications (Bangladesh SMS gateways)
- WhatsApp notifications
- Email campaigns
- Customer segmentation
- Lead management
- Sales pipeline
- Support tickets
- Review/rating system

### 6. HRM Module

#### Features
- Employee profiles
- Attendance (biometric API ready)
- Face recognition attendance
- Shift scheduling
- Leave management
- Payroll processing
- KPI tracking
- Commission calculation
- Recruitment (optional)
- Performance analytics

### 7. Multi-Vendor Module

#### Features
- Vendor registration/approval
- Vendor dashboard
- Product approval workflow
- Commission management (%)
- Vendor wallet/settlement
- Vendor analytics
- Order management
- Subscription packages
- Verification badges

### 8. E-commerce Module

#### Features
- Responsive storefront
- Product catalog
- AI search
- Category navigation
- Wishlist
- Shopping cart
- Checkout flow
- Payment gateways
- Order tracking
- Delivery tracking
- Reviews/ratings
- Flash sales
- Coupons
- Referral program
- Affiliate system

### 9. Logistics Module

#### Features
- Courier integration
- Delivery agent app
- Route optimization
- Live tracking
- Proof of delivery
- Return logistics
- COD management
- Fleet management

### 10. Analytics Module

#### Features
- Executive dashboard
- Real-time metrics
- Sales analytics
- Inventory insights
- Customer insights
- Profit analytics
- AI predictions
- Alerts (low stock, fraud)
- Custom reports

### 11. Bangladesh Localization

#### Features
- Complete Bangla translation
- Bangla invoice generation
- NBR VAT compliance
- BIN number support
- bKash/Nagad/Rocket API integration
- District-based delivery
- Bangladeshi date formats
- Taka (BDT) currency

---

## API Specification

### Base URL
```
Production: https://api.bizhub.com.bd/v1
Development: http://localhost:5000/v1
```

### Authentication Endpoints
```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/verify-email
POST   /auth/verify-phone
POST   /auth/google
POST   /auth/facebook
POST   /auth/2fa/enable
POST   /auth/2fa/verify
GET    /auth/sessions
DELETE /auth/sessions/:id
```

### Business Endpoints
```
GET    /businesses
POST   /businesses
GET    /businesses/:id
PUT    /businesses/:id
DELETE /businesses/:id
GET    /businesses/:id/branches
POST   /businesses/:id/branches
```

### Product Endpoints
```
GET    /products
POST   /products
GET    /products/:id
PUT    /products/:id
DELETE /products/:id
GET    /products/:id/stock
POST   /products/:id/adjust-stock
```

### POS Endpoints
```
GET    /pos/orders
POST   /pos/orders
GET    /pos/orders/:id
PUT    /pos/orders/:id
POST   /pos/orders/:id/pay
POST   /pos/orders/:id/return
GET    /pos/cart
POST   /pos/cart
```

### Inventory Endpoints
```
GET    /inventory/warehouses
POST   /inventory/warehouses
GET    /inventory/stock
POST   /inventory/transfer
GET    /inventory/audit
```

### Accounting Endpoints
```
GET    /accounting/accounts
POST   /accounting/accounts
GET    /accounting/transactions
POST   /accounting/transactions
GET    /accounting/reports/balance-sheet
GET    /accounting/reports/profit-loss
GET    /accounting/reports/cash-flow
```

### CRM Endpoints
```
GET    /crm/customers
POST   /crm/customers
GET    /crm/customers/:id
PUT    /crm/customers/:id
POST   /crm/customers/:id/wallet
GET    /crm/loyalty
```

### HRM Endpoints
```
GET    /hrm/employees
POST   /hrm/employees
GET    /hrm/employees/:id
PUT    /hrm/employees/:id
GET    /hrm/attendance
POST   /hrm/attendance
GET    /hrm/payroll
```

### E-commerce Endpoints
```
GET    /shop/products
GET    /shop/categories
GET    /shop/cart
POST   /shop/cart
POST   /shop/checkout
GET    /shop/orders
GET    /shop/orders/:id
```

---

## Database Schema

### Core Collections

#### users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  phone: String (unique),
  password: String (hashed),
  role: String (enum: super_admin, owner, manager, accountant, cashier, delivery, vendor, customer),
  businessId: ObjectId (ref: businesses),
  branchId: ObjectId (ref: branches),
  permissions: [String],
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,
    nid: String,
    address: String
  },
  auth: {
    googleId: String,
    facebookId: String,
    twoFactorEnabled: Boolean,
    twoFactorSecret: String,
    emailVerified: Boolean,
    phoneVerified: Boolean
  },
  sessions: [{
    device: String,
    ip: String,
    lastActive: Date,
    createdAt: Date
  }],
  loginHistory: [{
    ip: String,
    device: String,
    location: String,
    timestamp: Date
  }],
  status: String (enum: active, suspended, locked),
  createdAt: Date,
  updatedAt: Date
}
```

#### businesses
```javascript
{
  _id: ObjectId,
  name: String,
  slug: String (unique),
  type: String (enum: retail, wholesale, restaurant, pharmacy, franchise, marketplace),
  industry: String,
  logo: String,
  contact: {
    email: String,
    phone: String,
    address: String,
    district: String,
    thana: String
  },
  registration: {
    bin: String,
    nbr: String,
    tradeLicense: String
  },
  settings: {
    currency: String (default: BDT),
    timezone: String (default: Asia/Dhaka),
    language: String (default: en),
    dateFormat: String,
    taxNumber: String,
    invoicePrefix: String
  },
  subscription: {
    plan: String,
    startDate: Date,
    endDate: Date,
    features: [String]
  },
  owner: ObjectId (ref: users),
  createdAt: Date,
  updatedAt: Date
}
```

#### branches
```javascript
{
  _id: ObjectId,
  businessId: ObjectId (ref: businesses),
  name: String,
  code: String,
  type: String (enum: warehouse, store, restaurant),
  address: {
    street: String,
    district: String,
    thana: String,
    zip: String
  },
  contact: {
    phone: String,
    email: String,
    manager: ObjectId (ref: users)
  },
  settings: {
    posEnabled: Boolean,
    warehouseEnabled: Boolean,
    defaultWarehouse: Boolean
  },
  status: String (enum: active, inactive),
  createdAt: Date,
  updatedAt: Date
}
```

#### products
```javascript
{
  _id: ObjectId,
  businessId: ObjectId (ref: businesses),
  name: {
    en: String,
    bn: String
  },
  sku: String (unique per business),
  barcode: String,
  category: ObjectId (ref: categories),
  brand: ObjectId (ref: brands),
  unit: String,
  description: {
    en: String,
    bn: String
  },
  images: [String],
  pricing: {
    costPrice: Number,
    sellingPrice: Number,
    mrp: Number,
    wholeSalePrice: Number
  },
  tax: {
    vatRate: Number,
    taxCategory: String
  },
  inventory: {
    trackInventory: Boolean,
    lowStockAlert: Number,
    reorderPoint: Number,
    isSerial: Boolean,
    isBatch: Boolean
  },
  expiry: {
    trackExpiry: Boolean,
    expiryWarningDays: Number
  },
  status: String (enum: active, inactive, draft),
  vendorId: ObjectId (ref: users),
  createdAt: Date,
  updatedAt: Date
}
```

#### categories
```javascript
{
  _id: ObjectId,
  businessId: ObjectId (ref: businesses),
  name: {
    en: String,
    bn: String
  },
  slug: String,
  parentId: ObjectId (ref: categories),
  image: String,
  icon: String,
  order: Number,
  status: String (enum: active, inactive),
  createdAt: Date,
  updatedAt: Date
}
```

#### orders (POS)
```javascript
{
  _id: ObjectId,
  businessId: ObjectId (ref: businesses),
  branchId: ObjectId (ref: branches),
  orderNumber: String,
  type: String (enum: sale, return, exchange),
  customer: {
    id: ObjectId (ref: customers),
    name: String,
    phone: String
  },
  items: [{
    productId: ObjectId (ref: products),
    name: String,
    sku: String,
    qty: Number,
    unitPrice: Number,
    discount: Number,
    vat: Number,
    total: Number,
    batch: String,
    serial: String
  }],
  subtotal: Number,
  discount: {
    type: String (enum: fixed, percentage),
    value: Number,
    amount: Number
  },
  vat: Number,
  total: Number,
  paid: Number,
  due: Number,
  payments: [{
    method: String (enum: cash, card, bkash, nagad, wallet, giftcard),
    amount: Number,
    reference: String,
    gateway: String
  }],
  status: String (enum: pending, confirmed, processing, ready, delivered, cancelled),
  note: String,
  invoice: {
    number: String,
    url: String
  },
  createdBy: ObjectId (ref: users),
  createdAt: Date,
  updatedAt: Date
}
```

#### inventory
```javascript
{
  _id: ObjectId,
  businessId: ObjectId (ref: businesses),
  productId: ObjectId (ref: products),
  warehouseId: ObjectId (ref: warehouses),
  batch: String,
  expiryDate: Date,
  quantity: Number,
  reservedQty: Number,
  availableQty: Number,
  costPrice: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### accounts
```javascript
{
  _id: ObjectId,
  businessId: ObjectId (ref: businesses),
  name: String,
  code: String,
  type: String (enum: asset, liability, income, expense, equity),
  subType: String,
  parentId: ObjectId (ref: accounts),
  openingBalance: Number,
  currentBalance: Number,
  isBank: Boolean,
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    branch: String,
    routing: String
  },
  mobileBanking: {
    provider: String,
    accountNumber: String
  },
  status: String (enum: active, inactive),
  createdAt: Date,
  updatedAt: Date
}
```

#### transactions
```javascript
{
  _id: ObjectId,
  businessId: ObjectId (ref: businesses),
  voucherNumber: String,
  date: Date,
  type: String (enum: debit, credit),
  accountId: ObjectId (ref: accounts),
  contraAccountId: ObjectId (ref: accounts),
  amount: Number,
  description: String,
  reference: String,
  attachments: [String],
  createdBy: ObjectId (ref: users),
  createdAt: Date,
  updatedAt: Date
}
```

#### customers
```javascript
{
  _id: ObjectId,
  businessId: ObjectId (ref: businesses),
  code: String,
  name: String,
  email: String,
  phone: String,
  gender: String,
  dateOfBirth: Date,
  address: {
    present: String,
    permanent: String,
    district: String,
    thana: String
  },
  customerType: String (enum: regular, vip, wholesale),
  loyalty: {
    points: Number,
    tier: String,
    lifetimeValue: Number
  },
  wallet: {
    balance: Number,
    transactions: [{
      type: String,
      amount: Number,
      description: String,
      createdAt: Date
    }]
  },
  tags: [String],
  status: String (enum: active, inactive),
  createdAt: Date,
  updatedAt: Date
}
```

#### employees
```javascript
{
  _id: ObjectId,
  businessId: ObjectId (ref: businesses),
  userId: ObjectId (ref: users),
  employeeId: String,
  name: String,
  photo: String,
  department: String,
  designation: String,
  joiningDate: Date,
  salary: {
    basic: Number,
    houseRent: Number,
    medical: Number,
    transport: Number,
    other: Number,
    total: Number
  },
  attendance: {
    deviceId: String,
    faceId: String
  },
  leaveBalance: {
    casual: Number,
    sick: Number,
    annual: Number
  },
  status: String (enum: active, terminated, onleave),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Acceptance Criteria

### Core Requirements
- [ ] User can register and login with email/phone
- [ ] JWT tokens work correctly with refresh
- [ ] Role-based access control enforced
- [ ] Business owner can create business
- [ ] Branch management works
- [ ] Products CRUD with inventory tracking
- [ ] POS system completes full sale flow
- [ ] Inventory transfers between branches
- [ ] Accounting entries recorded
- [ ] Customer management with loyalty
- [ ] Employee attendance tracking
- [ ] E-commerce storefront displays products
- [ ] Payment gateway integration ready
- [ ] Bangladesh locale (Bangla, BDT)
- [ ] Dashboard shows analytics
- [ ] Docker deployment works

### Performance Requirements
- [ ] API response < 200ms (p95)
- [ ] Page load < 3 seconds
- [ ] Support 1000+ concurrent users
- [ ] Real-time updates via Socket.io

### Security Requirements
- [ ] Passwords hashed with bcrypt
- [ ] JWT tokens properly validated
- [ ] Input validation on all endpoints
- [ ] Rate limiting on auth endpoints
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CORS configured
- [ ] Security headers set

---

## Implementation Priority

### Phase 1 (Foundation)
1. Project setup with Docker
2. Backend architecture
3. Authentication system
4. Business/Branch CRUD

### Phase 2 (Core)
5. Product/Category management
6. Inventory system
7. POS system
8. Basic accounting

### Phase 3 (Advanced)
9. CRM features
10. HRM features
11. Analytics dashboard

### Phase 4 (E-commerce)
12. Storefront
13. Cart/Checkout
14. Payment integration

### Phase 5 (Enterprise)
15. Multi-vendor
16. Mobile apps (future)
17. Advanced AI features