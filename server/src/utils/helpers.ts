import crypto from 'crypto';

export const generateOrderNumber = (businessId: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const generateVoucherNumber = (businessId: string, type: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const prefix = type.toUpperCase().substring(0, 3);
  return `${prefix}-${timestamp}`;
};

export const generateSKU = (categoryCode: string, productName: string): string => {
  const initials = productName
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z]/g, 'X');
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${categoryCode}-${initials}-${random}`;
};

export const generateCustomerCode = (businessId: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CUS-${timestamp.slice(-4)}-${random}`;
};

export const generateEmployeeId = (businessId: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `EMP-${timestamp.slice(-6)}`;
};

export const generateAccountCode = (type: string, parentCode?: string): string => {
  const typeCodes: Record<string, string> = {
    asset: '1',
    liability: '2',
    income: '3',
    expense: '4',
    equity: '5',
  };

  const prefix = typeCodes[type] || '0';
  const random = crypto.randomBytes(3).toString('hex');
  return parentCode ? `${parentCode}.${random.slice(0, 2)}` : `${prefix}${random}`;
};

export const formatCurrency = (amount: number, currency = 'BDT'): string => {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const calculateVAT = (amount: number, rate: number): number => {
  return (amount * rate) / (100 + rate);
};

export const calculateDiscount = (
  amount: number,
  discountType: 'fixed' | 'percentage',
  discountValue: number
): number => {
  if (discountType === 'percentage') {
    return (amount * discountValue) / 100;
  }
  return discountValue;
};

export const paginate = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, limit: Math.min(limit, 100) };
};

export const generateOtp = (length = 6): string => {
  return crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, '0');
};

export const hashOtp = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const verifyOtp = (otp: string, hashedOtp: string): boolean => {
  return hashOtp(otp) === hashedOtp;
};

export const parsePhone = (phone: string): string => {
  let cleaned = phone.replace(/[^0-9]/g, '');

  if (cleaned.startsWith('880')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('+880')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  return `0${cleaned}`;
};

export const isValidPhone = (phone: string): boolean => {
  const regex = /^(\+88)?01[3-9]\d{8}$/;
  return regex.test(phone);
};

export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const getDateRange = (period: string): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
};