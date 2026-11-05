import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { User, Business, Employee } from '../models/index.js';
import { AppError } from '../middleware/index.js';
import type { ITokens, IPayload } from '../types/index.js';
import { logger } from '../utils/logger.js';

export const generateTokens = (payload: IPayload): ITokens => {
  const accessToken = jwt.sign(payload, config.jwt.accessSecret as jwt.Secret, {
    expiresIn: config.jwt.accessExpiry as any,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret as jwt.Secret, {
    expiresIn: config.jwt.refreshExpiry as any,
  });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): IPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as IPayload;
};

export const registerUser = async (data: {
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}) => {
  const existingUser = await User.findOne({
    $or: [
      ...(data.email ? [{ email: data.email }] : []),
      ...(data.phone ? [{ phone: data.phone }] : []),
    ],
  });

  if (existingUser) {
    throw new AppError(
      existingUser.email === data.email
        ? 'Email already registered'
        : 'Phone already registered',
      400
    );
  }

  const user = await User.create({
    email: data.email,
    phone: data.phone,
    password: data.password,
    profile: {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
    },
    role: data.role || 'owner',
  });

  const payload: IPayload = {
    userId: user._id.toString(),
    role: user.role as never,
  };

  const tokens = generateTokens(payload);

  await User.findByIdAndUpdate(user._id, {
    $push: {
      sessions: {
        device: 'web',
        ip: '0.0.0.0',
        lastActive: new Date(),
      },
    },
  });

  logger.info(`New user registered: ${user._id}`);

  return { user, tokens };
};

export const loginUser = async (data: {
  email?: string;
  phone?: string;
  password: string;
  device?: string;
  ip?: string;
}) => {
  const query = data.email
    ? { email: data.email }
    : data.phone
    ? { phone: data.phone }
    : {};

  const user = await User.findOne(query);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check account status BEFORE password validation
  if (user.status === 'locked') {
    throw new AppError('Account locked due to multiple failed attempts. Please contact your administrator.', 403);
  }

  if (user.status === 'suspended') {
    throw new AppError('Account is suspended', 403);
  }

  const isValidPassword = await user.comparePassword(data.password);

  if (!isValidPassword) {
    // Count only failed login attempts (loginHistory entries without a session)
    const failedAttempts = (user as any).failedLoginAttempts || 0;
    const newFailedCount = failedAttempts + 1;

    if (newFailedCount >= 5) {
      await User.findByIdAndUpdate(user._id, {
        status: 'locked',
        failedLoginAttempts: newFailedCount,
      });
      throw new AppError('Account locked due to multiple failed attempts. Please contact your administrator.', 403);
    }

    await User.findByIdAndUpdate(user._id, {
      $inc: { failedLoginAttempts: 1 },
    });

    const remaining = 5 - newFailedCount;
    throw new AppError(
      remaining > 0
        ? `Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before account lock.`
        : 'Invalid credentials',
      401
    );
  }

  // Check business status if user is associated with a business
  if (user.businessId && user.role !== 'super_admin') {
    const business = await Business.findById(user.businessId);
    if (business) {
      if (business.status === 'pending') {
        throw new AppError('Your business is pending admin verification. Please wait for approval.', 403);
      }
      if (business.status === 'suspended') {
        throw new AppError('Your business has been suspended by an admin.', 403);
      }
      if (business.status === 'rejected') {
        throw new AppError('Your business registration was rejected.', 403);
      }
    }
  }

  // Successful login — reset failed attempts and create session
  const payload: IPayload = {
    userId: user._id.toString(),
    role: user.role as never,
    businessId: user.businessId?.toString(),
    branchId: user.branchId?.toString(),
  };

  const tokens = generateTokens(payload);

  await User.findByIdAndUpdate(user._id, {
    $set: { failedLoginAttempts: 0 },
    $push: {
      sessions: {
        device: data.device || 'web',
        ip: data.ip || '0.0.0.0',
        lastActive: new Date(),
      },
    },
  });

  logger.info(`User logged in: ${user._id}`);

  return { user, tokens };
};

export const refreshToken = async (refreshToken: string) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const payload: IPayload = {
      userId: user._id.toString(),
      role: user.role as never,
      businessId: user.businessId?.toString(),
      branchId: user.branchId?.toString(),
    };

    const tokens = generateTokens(payload);

    return { tokens };
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
};

export const logoutUser = async (userId: string) => {
  await User.findByIdAndUpdate(userId, {
    $pull: {
      sessions: { lastActive: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    },
  });

  logger.info(`User logged out: ${userId}`);
};

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export const updateUserProfile = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    address?: string;
  }
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'profile.firstName': data.firstName,
        'profile.lastName': data.lastName,
        'profile.avatar': data.avatar,
        'profile.address': data.address,
      },
    },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isValid = await user.comparePassword(oldPassword);

  if (!isValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  await User.findByIdAndUpdate(userId, { password: newPassword });

  logger.info(`Password changed for user: ${userId}`);

  return { message: 'Password changed successfully' };
};

export const employeeRegister = async (data: {
  email?: string;
  phone?: string;
  password: string;
}) => {
  const query = data.email ? { email: data.email } : data.phone ? { phone: data.phone } : null;
  if (!query) throw new AppError('Email or phone is required', 400);

  const employee = await Employee.findOne(query);
  if (!employee) throw new AppError('You are not registered as an employee by any business owner.', 404);
  
  if (employee.userId) throw new AppError('You have already registered an account.', 400);

  const existingUser = await User.findOne(query);
  if (existingUser) throw new AppError('User already exists.', 400);

  // Default role if designation is not one of the enum values
  const validRoles = ['manager', 'accountant', 'cashier', 'delivery', 'salesman', 'vendor'];
  const assignedRole = employee.designation && validRoles.includes(employee.designation.toLowerCase()) 
    ? employee.designation.toLowerCase() 
    : 'salesman';

  // Assign default permissions based on role
  let defaultPermissions: string[] = [];
  switch (assignedRole) {
    case 'manager':
      defaultPermissions = ['manage_dashboard', 'manage_pos', 'manage_orders', 'manage_inventory', 'manage_customers', 'manage_employees', 'manage_branches', 'manage_accounting'];
      break;
    case 'cashier':
      defaultPermissions = ['manage_pos', 'manage_orders', 'manage_customers'];
      break;
    case 'accountant':
      defaultPermissions = ['manage_accounting', 'manage_orders'];
      break;
    case 'salesman':
      defaultPermissions = ['manage_pos', 'manage_customers', 'manage_orders'];
      break;
    case 'delivery':
      defaultPermissions = ['manage_orders'];
      break;
    default:
      defaultPermissions = ['manage_pos'];
  }

  const user = await User.create({
    email: employee.email,
    phone: employee.phone,
    password: data.password,
    profile: {
      firstName: employee.name,
      lastName: employee.surname || '',
    },
    role: assignedRole,
    permissions: defaultPermissions,
    businessId: employee.businessId,
  });

  employee.userId = user._id as any;
  await employee.save();

  const payload: IPayload = {
    userId: user._id.toString(),
    role: user.role as never,
    businessId: user.businessId?.toString(),
  };

  const tokens = generateTokens(payload);
  return { user, tokens };
};

export const unlockAccount = async (data: {
  userId?: string;
  email?: string;
  phone?: string;
}) => {
  if (!data.userId && !data.email && !data.phone) {
    throw new AppError('userId, email, or phone is required', 400);
  }

  const query = data.userId
    ? { _id: data.userId }
    : data.email
    ? { email: data.email }
    : { phone: data.phone };

  const user = await User.findOne(query);
  if (!user) throw new AppError('User not found', 404);

  await User.findByIdAndUpdate(user._id, {
    $set: { status: 'active', failedLoginAttempts: 0 },
  });

  logger.info(`Account unlocked for user: ${user._id}`);
  return { message: 'Account unlocked successfully' };
};