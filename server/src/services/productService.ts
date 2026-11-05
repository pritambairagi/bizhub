import { Product, Category, InventoryStock, InventoryLog, Warehouse } from '../models/index.js';
import { AppError } from '../middleware/index.js';
import type { IProduct, ICategory } from '../types/index.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

export const createProduct = async (
  businessId: string,
  data: {
    name: { en: string; bn?: string };
    sku: string;
    barcode?: string;
    category: string;
    brand?: string;
    unit?: string;
    description?: { en?: string; bn?: string };
    images?: string[];
    pricing?: {
      costPrice?: number;
      sellingPrice?: number;
      mrp?: number;
      wholeSalePrice?: number;
    };
    tax?: { vatRate?: number; taxCategory?: string };
    inventory?: {
      trackInventory?: boolean;
      lowStockAlert?: number;
      reorderPoint?: number;
      isSerial?: boolean;
      isBatch?: boolean;
    };
    expiry?: { trackExpiry?: boolean; expiryWarningDays?: number };
    status?: string;
    vendorId?: string;
    variants?: { name: string; priceOverride?: number; stock?: number }[];
    warehouseId?: string;
    branchId?: string;
    supplierId?: string;
    stockQuantity?: number;
    createdBy?: string;
  }
) => {
  const existingProduct = await Product.findOne({
    businessId,
    $or: [{ sku: data.sku }, ...(data.barcode ? [{ barcode: data.barcode }] : [])],
  });

  if (existingProduct) {
    throw new AppError('Product with this SKU or barcode already exists', 400);
  }

  // Map status values from frontend
  let productStatus = data.status || 'active';
  if (productStatus === 'Live') productStatus = 'active';
  if (productStatus === 'Draft') productStatus = 'draft';
  if (productStatus === 'Damage') productStatus = 'damage';
  if (productStatus === 'Out of stock') productStatus = 'out_of_stock';

  const product = await Product.create({
    businessId,
    name: data.name,
    sku: data.sku,
    barcode: data.barcode,
    category: new mongoose.Types.ObjectId(data.category),
    brand: data.brand,
    unit: data.unit || 'পিস',
    description: data.description,
    images: data.images,
    pricing: data.pricing,
    tax: data.tax,
    inventory: data.inventory,
    expiry: data.expiry,
    variants: data.variants || [],
    status: productStatus,
    vendorId: data.vendorId,
    createdBy: data.createdBy ? new mongoose.Types.ObjectId(data.createdBy) : undefined,
  });

  // Auto-create inventory stock:
  // Priority: branchId (resolve to branch's warehouse) -> warehouseId (direct)
  let resolvedWarehouseId: string | undefined = data.warehouseId;

  if (data.branchId) {
    // Find the warehouse for this branch (use Main Warehouse if multiple)
    const branchWarehouse = await Warehouse.findOne({
      businessId,
      branchId: new mongoose.Types.ObjectId(data.branchId),
    }).sort({ createdAt: 1 }); // Pick oldest/first warehouse for branch

    if (branchWarehouse) {
      resolvedWarehouseId = (branchWarehouse._id as any).toString();
      logger.info(`Resolved branchId ${data.branchId} to warehouseId ${resolvedWarehouseId}`);
    } else {
      // No warehouse exists for this branch yet — auto-create one
      const { Branch } = await import('../models/Branch.js');
      const branch = await Branch.findById(data.branchId);
      if (branch) {
        const newWarehouse = await Warehouse.create({
          businessId,
          branchId: branch._id,
          name: `${branch.name} Warehouse`,
          code: `WH-${(branch.code || branch.name.substring(0, 3)).toUpperCase()}-${Date.now().toString().slice(-4)}`,
          type: 'sub',
          status: 'active',
        });
        resolvedWarehouseId = (newWarehouse._id as any).toString();
        logger.info(`Auto-created warehouse ${resolvedWarehouseId} for branch ${data.branchId}`);
      }
    }
  }

  if (resolvedWarehouseId && data.stockQuantity && data.stockQuantity > 0) {
    const warehouse = await Warehouse.findOne({ _id: resolvedWarehouseId, businessId });
    if (warehouse) {
      await InventoryStock.create({
        businessId,
        productId: product._id,
        warehouseId: resolvedWarehouseId,
        quantity: data.stockQuantity,
        availableQty: data.stockQuantity,
        costPrice: data.pricing?.costPrice || 0,
      });

      await InventoryLog.create({
        businessId,
        productId: product._id,
        warehouseId: resolvedWarehouseId,
        type: 'adjustment',
        quantity: data.stockQuantity,
        previousQty: 0,
        newQty: data.stockQuantity,
        note: 'Initial stock on product creation',
        createdBy: businessId,
      });

      logger.info(`Initial stock created: ${data.stockQuantity} units for product ${product._id} in warehouse ${resolvedWarehouseId}`);
    }
  }

  logger.info(`Product created: ${product._id} for business ${businessId}`);

  return product;
};

export const getProducts = async (
  businessId: string | undefined,
  options: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    status?: string;
  } = {}
) => {
  const { page = 1, limit = 20, category, search, status } = options;
  const query: Record<string, unknown> = {};

  if (businessId) {
    query.businessId = businessId;
  }

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { 'name.en': { $regex: search, $options: 'i' } },
      { 'name.bn': { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { 'description.en': { $regex: search, $options: 'i' } },
    ];
  }

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .populate('createdBy', 'profile.firstName profile.lastName email')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await Product.countDocuments(query);

  // Fetch stock data for each product
  const productIds = products.map((p: any) => p._id);
  const stockData = await InventoryStock.aggregate([
    {
      $match: {
        productId: { $in: productIds },
        ...(businessId ? { businessId: new mongoose.Types.ObjectId(businessId) } : {}),
      },
    },
    {
      $group: {
        _id: '$productId',
        totalQuantity: { $sum: '$quantity' },
        totalAvailable: { $sum: '$availableQty' },
        totalReserved: { $sum: '$reservedQty' },
      },
    },
  ]);

  const stockMap = new Map(stockData.map((s: any) => [s._id.toString(), s]));

  const productsWithStock = products.map((product: any) => {
    const stock = stockMap.get(product._id.toString());
    return {
      ...product,
      stock: {
        quantity: stock?.totalQuantity || 0,
        available: stock?.totalAvailable || 0,
        reserved: stock?.totalReserved || 0,
      },
    };
  });

  return {
    products: productsWithStock,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProduct = async (productId: string, businessId: string | undefined): Promise<any> => {
  const query: Record<string, unknown> = { _id: productId };
  if (businessId) {
    query.businessId = businessId;
  }

  const product = await Product.findOne(query)
    .populate('category', 'name slug')
    .populate('createdBy', 'profile.firstName profile.lastName email')
    .lean();

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Get stock info
  const stockMatch: Record<string, unknown> = { productId: new mongoose.Types.ObjectId(productId) };
  if (businessId) {
    stockMatch.businessId = new mongoose.Types.ObjectId(businessId);
  }

  const stockData = await InventoryStock.aggregate([
    { $match: stockMatch },
    {
      $group: {
        _id: '$warehouseId',
        quantity: { $sum: '$quantity' },
        availableQty: { $sum: '$availableQty' },
        reservedQty: { $sum: '$reservedQty' },
      },
    },
    {
      $lookup: {
        from: 'warehouses',
        localField: '_id',
        foreignField: '_id',
        as: 'warehouse',
      },
    },
    { $unwind: { path: '$warehouse', preserveNullAndEmptyArrays: true } },
  ]);

  return {
    ...product,
    stockByWarehouse: stockData,
    totalStock: stockData.reduce((sum: number, s: any) => sum + s.quantity, 0),
  };
};

export const updateProduct = async (
  productId: string,
  businessId: string | undefined,
  data: Partial<IProduct>
) => {
  const query: Record<string, unknown> = { _id: productId };
  if (businessId) {
    query.businessId = businessId;
  }

  const product = await Product.findOneAndUpdate(query, data, { new: true });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

export const deleteProduct = async (productId: string, businessId: string | undefined) => {
  const query: Record<string, unknown> = { _id: productId };
  if (businessId) {
    query.businessId = businessId;
  }

  const product = await Product.findOneAndDelete(query);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  await InventoryStock.deleteMany({ productId, businessId: businessId || undefined });

  logger.info(`Product deleted: ${productId}`);

  return { message: 'Product deleted successfully' };
};

export const getProductStock = async (productId: string, businessId: string | undefined) => {
  const productQuery: Record<string, unknown> = { _id: productId };
  if (businessId) {
    productQuery.businessId = businessId;
  }
  const product = await Product.findOne(productQuery);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const stockMatch: Record<string, unknown> = { productId: new mongoose.Types.ObjectId(productId) };
  if (businessId) {
    stockMatch.businessId = new mongoose.Types.ObjectId(businessId);
  }

  const stock = await InventoryStock.aggregate([
    { $match: stockMatch },
    {
      $group: {
        _id: '$warehouseId',
        quantity: { $sum: '$quantity' },
        availableQty: { $sum: '$availableQty' },
        reservedQty: { $sum: '$reservedQty' },
      },
    },
    {
      $lookup: {
        from: 'warehouses',
        localField: '_id',
        foreignField: '_id',
        as: 'warehouse',
      },
    },
    { $unwind: '$warehouse' },
    {
      $project: {
        warehouse: '$warehouse.name',
        quantity: 1,
        availableQty: 1,
        reservedQty: 1,
      },
    },
  ]);

  const totalStock = stock.reduce((sum: number, s: any) => sum + s.quantity, 0);

  return {
    product,
    totalStock,
    byWarehouse: stock,
  };
};

export const adjustStock = async (
  productId: string,
  businessId: string | undefined,
  data: {
    warehouseId: string;
    quantity: number;
    type: 'add' | 'remove' | 'set';
    batch?: string;
    expiryDate?: Date;
    costPrice?: number;
    note?: string;
  }
) => {
  if (!businessId) {
    throw new AppError('Business ID is required for stock adjustment', 400);
  }

  const product = await Product.findOne({ _id: productId, businessId });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const warehouse = await Warehouse.findOne({
    _id: data.warehouseId,
    businessId,
  });

  if (!warehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  let stock = await InventoryStock.findOne({
    productId,
    warehouseId: data.warehouseId,
    ...(data.batch ? { batch: data.batch } : {}),
  });

  let newQuantity: number;

  if (data.type === 'add') {
    newQuantity = (stock?.quantity || 0) + data.quantity;
  } else if (data.type === 'remove') {
    newQuantity = (stock?.quantity || 0) - data.quantity;
    if (newQuantity < 0) {
      throw new AppError('Insufficient stock', 400);
    }
  } else {
    newQuantity = data.quantity;
  }

  if (stock) {
    const previousQty = stock.quantity;
    stock.quantity = newQuantity;
    stock.availableQty = newQuantity - stock.reservedQty;
    if (data.costPrice) stock.costPrice = data.costPrice;
    if (data.batch) stock.batch = data.batch;
    if (data.expiryDate) stock.expiryDate = data.expiryDate;
    await stock.save();

    await InventoryLog.create({
      businessId,
      productId: new mongoose.Types.ObjectId(productId),
      warehouseId: new mongoose.Types.ObjectId(data.warehouseId),
      type: 'adjustment',
      quantity: Math.abs(newQuantity - previousQty),
      previousQty,
      newQty: newQuantity,
      note: data.note,
      createdBy: businessId, // Should ideally be userId
    });
  } else {
    stock = await InventoryStock.create({
      businessId,
      productId,
      warehouseId: data.warehouseId,
      quantity: newQuantity,
      availableQty: newQuantity,
      costPrice: data.costPrice || product.pricing.costPrice,
      batch: data.batch,
      expiryDate: data.expiryDate,
    });

    await InventoryLog.create({
      businessId,
      productId: new mongoose.Types.ObjectId(productId),
      warehouseId: new mongoose.Types.ObjectId(data.warehouseId),
      type: 'adjustment',
      quantity: newQuantity,
      previousQty: 0,
      newQty: newQuantity,
      note: data.note,
      createdBy: businessId,
    });
  }

  logger.info(`Stock adjusted for product ${productId}: ${data.type} ${data.quantity}`);

  return stock;
};

// Inventory Stats
export const getInventoryStats = async (businessId: string) => {
  const totalProducts = await Product.countDocuments({ businessId });

  // Get stock data per product
  const stockAgg = await InventoryStock.aggregate([
    { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
    {
      $group: {
        _id: '$productId',
        totalQty: { $sum: '$quantity' },
        totalCost: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
      },
    },
  ]);

  const stockMap = new Map(stockAgg.map((s: any) => [s._id.toString(), s]));

  // Count by stock status
  const allProducts = await Product.find({ businessId }).select('_id pricing inventory').lean();

  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  let totalInvestment = 0;
  let totalProfit = 0;

  for (const product of allProducts) {
    const stock = stockMap.get(product._id.toString());
    const qty = stock?.totalQty || 0;
    const lowAlert = (product as any).inventory?.lowStockAlert || 10;

    if (qty <= 0) {
      outOfStock++;
    } else if (qty <= lowAlert) {
      lowStock++;
    } else {
      inStock++;
    }

    const costPrice = (product as any).pricing?.costPrice || 0;
    const sellingPrice = (product as any).pricing?.sellingPrice || 0;
    totalInvestment += costPrice * qty;
    totalProfit += (sellingPrice - costPrice) * qty;
  }

  return {
    totalProducts,
    inStock,
    lowStock,
    outOfStock,
    stockValue: {
      investment: totalInvestment,
      profit: totalProfit,
    },
  };
};

// Category Services
export const createCategory = async (
  businessId: string,
  data: {
    name: { en: string; bn?: string };
    parentId?: string;
    slug?: string;
    image?: string;
    icon?: string;
    order?: number;
  }
) => {
  const slug = data.slug || data.name.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const category = await Category.create({
    ...data,
    slug,
    businessId,
    parentId: data.parentId && data.parentId.length > 0 ? new mongoose.Types.ObjectId(data.parentId) : undefined,
  });

  return category;
};

export const getCategories = async (businessId: string | undefined, parentId?: string) => {
  const query: Record<string, any> = {};

  if (businessId) {
    query.$or = [{ businessId }, { businessId: null }, { businessId: { $exists: false } }];
  }

  if (parentId) {
    query.parentId = new mongoose.Types.ObjectId(parentId);
  } else {
    query.parentId = { $exists: false };
  }

  const categories = await Category.find(query).sort({ order: 1, name: 1 });

  return categories;
};

export const getCategoryTree = async (businessId: string | undefined) => {
  const query: Record<string, any> = {};
  if (businessId) {
    query.$or = [{ businessId }, { businessId: null }, { businessId: { $exists: false } }];
  }

  const categories = await Category.find(query).sort({ order: 1, name: 1 });

  const buildTree = (parentId?: string): ICategory[] => {
    return categories
      .filter((c) => {
        if (parentId) {
          return c.parentId?.toString() === parentId.toString();
        }
        return !c.parentId;
      })
      .map((cat) => ({
        ...cat.toObject(),
        children: buildTree(cat._id.toString()),
      })) as unknown as ICategory[];
  };

  return buildTree();
};

// Get ALL categories for a business (flat list for dropdown selects)
export const getAllCategories = async (businessId: string | undefined) => {
  const query: Record<string, any> = { status: 'active' };
  if (businessId) {
    query.$or = [
      { businessId, status: 'active' },
      { businessId: null, status: 'active' },
      { businessId: { $exists: false }, status: 'active' }
    ];
  }
  const categories = await Category.find(query).sort({ 'name.en': 1 });
  return categories;
};