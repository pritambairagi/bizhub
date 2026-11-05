import { Business, Branch, User, Warehouse, Account, BusinessShare } from '../models/index.js';
import { AppError } from '../middleware/index.js';
import type { IBusiness, IBusinessShare } from '../types/index.js';
import { logger } from '../utils/logger.js';


export const getBusinessShares = async (businessId: string) => {
  return await BusinessShare.find({ businessId }).sort({ createdAt: -1 });
};

export const createBusinessShare = async (businessId: string, data: Partial<IBusinessShare>) => {
  const currentShares = await BusinessShare.find({ businessId });
  const totalPercentage = currentShares.reduce((acc, s) => acc + (s.sharePercentage || 0), 0);
  
  if (totalPercentage + (data.sharePercentage || 0) > 100) {
    throw new AppError(`Total share percentage cannot exceed 100%. Currently allocated: ${totalPercentage}%`, 400);
  }

  const share = new BusinessShare({
    ...data,
    businessId,
  });
  return await share.save();
};

export const updateBusinessShare = async (shareId: string, businessId: string, data: Partial<IBusinessShare>) => {
  return await BusinessShare.findOneAndUpdate(
    { _id: shareId, businessId },
    { $set: data },
    { new: true }
  );
};

export const deleteBusinessShare = async (shareId: string, businessId: string): Promise<any> => {
  return await BusinessShare.deleteOne({ _id: shareId, businessId });
};

export const createBusiness = async (
  ownerId: string,
  data: {
    name: string;
    type: string;
    industry?: string;
    contact: {
      email: string;
      phone: string;
      address: string;
      district?: string;
      thana?: string;
    };
    registration?: {
      bin?: string;
      nbr?: string;
      tradeLicense?: string;
    };
  }
) => {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const existingBusiness = await Business.findOne({
    $or: [
      { slug },
      { 'contact.email': data.contact.email },
      { 'contact.phone': data.contact.phone },
    ],
  });

  if (existingBusiness) {
    if (existingBusiness.slug === slug) {
      throw new AppError('A business with this name already exists. Please choose a different name.', 400);
    }
    throw new AppError('Business with this email or phone already exists', 400);
  }

  let business: any;
  try {
    business = await Business.create({
      ...data,
      owner: ownerId,
      subscription: {
        plan: 'starter',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        features: ['pos', 'inventory', 'basic_accounting'],
      },
    });

    const defaultBranch = await Branch.create({
      businessId: business._id,
      name: 'Main Branch',
      code: 'MAIN',
      type: 'main_branch',
      contact: {
        phone: data.contact.phone,
        email: data.contact.email,
        manager: ownerId,
      },
      settings: {
        posEnabled: true,
        warehouseEnabled: true,
        defaultWarehouse: true,
      },
    });

    // Create default warehouse
    await Warehouse.create({
      businessId: business._id,
      branchId: defaultBranch._id,
      name: 'Main Warehouse',
      code: 'MW01',
      type: 'main',
    });

    // Create default accounts
    const defaultAccounts = [
      { name: 'Cash', code: '1001', type: 'asset', subType: 'Cash', openingBalance: 0 },
      { name: 'Bank Account', code: '1002', type: 'asset', subType: 'Bank', openingBalance: 0 },
      { name: 'Inventory', code: '1003', type: 'asset', subType: 'Inventory', openingBalance: 0 },
      { name: 'Sales Income', code: '4001', type: 'income', openingBalance: 0 },
      { name: 'Purchase Expense', code: '5001', type: 'expense', openingBalance: 0 },
    ];

    await Account.insertMany(
      defaultAccounts.map(acc => ({ ...acc, businessId: business._id }))
    );

    await User.findByIdAndUpdate(ownerId, {
      businessId: business._id,
      branchId: defaultBranch._id,
      role: 'owner',
      permissions: ['*'],
    });

    logger.info(`Business created: ${business._id} with default branch, warehouse, and accounts`);

    return { business, defaultBranch };
  } catch (error) {
    if (business) {
      await Business.findByIdAndDelete(business._id);
      await Branch.deleteMany({ businessId: business._id });
      await Warehouse.deleteMany({ businessId: business._id });
      await Account.deleteMany({ businessId: business._id });
    }
    throw error;
  }
};

export const getBusiness = async (businessId: string) => {
  const business = await Business.findById(businessId).populate('owner', 'profile email');

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  return business;
};

export const updateBusiness = async (
  businessId: string,
  userId: string,
  data: Partial<IBusiness>
) => {
  const business = await Business.findById(businessId);

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  if (business.owner.toString() !== userId) {
    throw new AppError('Not authorized to update this business', 403);
  }

  // Handle nested object updates properly
  const updateData: any = { ...data };

  // If contact is being updated, merge with existing
  if (data.contact) {
    updateData.contact = { ...(business.contact as any).toObject(), ...data.contact };
  }

  // If settings is being updated, merge with existing
  if (data.settings) {
    updateData.settings = { ...business.settings, ...data.settings };
  }

  const updatedBusiness = await Business.findByIdAndUpdate(businessId, updateData, {
    new: true,
    runValidators: true,
  });

  return updatedBusiness;
};

export const getBranches = async (businessId: string) => {
  const branches = await Branch.find({ businessId }).sort({ createdAt: -1 });
  return { branches };
};

export const createBranch = async (
  businessId: string,
  data: {
    name: string;
    code: string;
    type?: string;
    address?: {
      street?: string;
      district?: string;
      thana?: string;
      zip?: string;
    };
    contact: {
      phone: string;
      email?: string;
    };
  }
) => {
  const existingBranch = await Branch.findOne({
    businessId,
    code: data.code.toUpperCase(),
  });

  if (existingBranch) {
    throw new AppError('Branch with this code already exists', 400);
  }

  const branch = await Branch.create({
    ...data,
    businessId,
    code: data.code.toUpperCase(),
  });

  logger.info(`Branch created: ${branch._id} for business ${businessId}`);

  return branch;
};

export const updateBranch = async (
  branchId: string,
  businessId: string,
  data: Partial<typeof Branch>
) => {
  const branch = await Branch.findOneAndUpdate(
    { _id: branchId, businessId },
    data,
    { new: true }
  );

  if (!branch) {
    throw new AppError('Branch not found', 404);
  }

  return branch;
};

export const deleteBranch = async (branchId: string, businessId: string) => {
  const branch = await Branch.findOneAndDelete({
    _id: branchId,
    businessId,
  });

  if (!branch) {
    throw new AppError('Branch not found', 404);
  }

  if (branch.settings?.defaultWarehouse) {
    throw new AppError('Cannot delete default branch', 400);
  }

  logger.info(`Branch deleted: ${branchId}`);

  return { message: 'Branch deleted successfully' };
};

export const getBusinessSettings = async (businessId: string) => {
  const business = await Business.findById(businessId).select('settings');

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  return business.settings;
};

export const updateBusinessSettings = async (
  businessId: string,
  userId: string,
  settings: Partial<IBusiness['settings']>
) => {
  const business = await Business.findById(businessId);

  if (!business) {
    throw new AppError('Business not found', 404);
  }

  if (business.owner.toString() !== userId) {
    throw new AppError('Not authorized to update settings', 403);
  }

  const updatedBusiness = await Business.findByIdAndUpdate(
    businessId,
    { $set: { settings } },
    { new: true }
  );

  return updatedBusiness?.settings;
};

export const getWarehouses = async (businessId: string) => {
  const warehouses = await Warehouse.find({ businessId }).populate('branchId', 'name');
  return warehouses;
};

export const createWarehouse = async (
  businessId: string,
  data: {
    name: string;
    code: string;
    branchId: string;
    type?: string;
  }
) => {
  const existing = await Warehouse.findOne({ businessId, code: data.code.toUpperCase() });
  if (existing) {
    throw new AppError('Warehouse with this code already exists', 400);
  }

  const warehouse = await Warehouse.create({
    ...data,
    businessId,
    code: data.code.toUpperCase(),
  });

  return warehouse;
};

export const syncDefaults = async (businessId: string) => {
  // Ensure default branch exists
  let branch = await Branch.findOne({ businessId, code: 'MAIN' });
  if (!branch) {
    // Get phone from business to satisfy required field
    const biz = await Business.findById(businessId).select('contact');
    branch = await Branch.create({
      businessId,
      name: 'Main Branch',
      code: 'MAIN',
      type: 'main_branch',
      contact: {
        phone: biz?.contact?.phone || '0000000000',
        email: biz?.contact?.email || '',
      },
      settings: { posEnabled: true, warehouseEnabled: true, defaultWarehouse: true }
    });
    logger.info(`Sync: Created default MAIN branch for business ${businessId}`);
  }

  // Ensure default warehouse exists
  const warehouse = await Warehouse.findOne({ businessId });
  if (!warehouse) {
    await Warehouse.create({
      businessId,
      branchId: branch._id,
      name: 'Main Warehouse',
      code: 'MW01',
      type: 'main'
    });
    logger.info(`Sync: Created default warehouse for business ${businessId}`);
  }

  // Ensure default accounts exist
  const accountCount = await Account.countDocuments({ businessId });
  if (accountCount === 0) {
    const defaultAccounts = [
      { name: 'Cash', code: '1001', type: 'asset', subType: 'Cash', openingBalance: 0 },
      { name: 'Bank Account', code: '1002', type: 'asset', subType: 'Bank', openingBalance: 0 },
      { name: 'Sales Income', code: '4001', type: 'income', openingBalance: 0 },
      { name: 'Purchase Expense', code: '5001', type: 'expense', openingBalance: 0 },
    ];
    await Account.insertMany(defaultAccounts.map(acc => ({ ...acc, businessId })));
    logger.info(`Sync: Created default accounts for business ${businessId}`);
  }
};