import { Supplier } from '../models/Supplier.js';
import type { ISupplier } from '../types/index.js';

export const getSuppliers = async (
  businessId: string,
  options: { page?: number; limit?: number; search?: string } = {}
): Promise<{ suppliers: ISupplier[]; pagination: any }> => {
  const { page = 1, limit = 20, search } = options;
  const query: any = {
    $or: [{ businessId }, { businessId: null }, { businessId: { $exists: false } }]
  };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { companyName: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const suppliers = await Supplier.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit) as any;

  const total = await Supplier.countDocuments(query);

  return {
    suppliers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAllSuppliersArray = async (businessId: string): Promise<ISupplier[]> => {
  return await Supplier.find({
    $or: [{ businessId }, { businessId: null }, { businessId: { $exists: false } }]
  }).sort({ createdAt: -1 }) as any;
};

export const getSupplier = async (supplierId: string, businessId: string): Promise<ISupplier | null> => {
  return await Supplier.findOne({ _id: supplierId, businessId }) as any;
};

export const createSupplier = async (businessId: string, data: Partial<ISupplier>): Promise<ISupplier> => {
  const balance = data.balance !== undefined ? data.balance : (data.openingBalance || 0);
  const supplier = new Supplier({
    ...data,
    balance,
    businessId,
  });
  return await supplier.save() as any;
};

export const updateSupplier = async (supplierId: string, businessId: string, data: Partial<ISupplier>): Promise<ISupplier | null> => {
  return await Supplier.findOneAndUpdate(
    { _id: supplierId, businessId },
    { $set: data },
    { new: true }
  ) as any;
};

export const deleteSupplier = async (supplierId: string, businessId: string): Promise<boolean> => {
  const result = await Supplier.deleteOne({ _id: supplierId, businessId });
  return result.deletedCount > 0;
};
