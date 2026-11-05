import { Purchase } from '../models/Purchase.js';
import { Product, InventoryStock, InventoryLog, Warehouse, Transaction, Account } from '../models/index.js';
import { AppError } from '../middleware/index.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

export const createPurchase = async (
  businessId: string,
  userId: string,
  data: {
    supplierId?: string;
    supplierName: string;
    purchaseNumber: string;
    items: Array<{
      productId: string;
      name?: string;
      sku?: string;
      qty: number;
      costPrice: number;
    }>;
    tax?: number;
    paidAmount: number;
    purchaseDate?: Date;
    note?: string;
    warehouseId: string;
  }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let subtotal = 0;
    const purchaseItems = [];
    const purchaseId = new mongoose.Types.ObjectId();

    for (const item of data.items) {
      let product = null;
      if (item.productId && !item.productId.startsWith('manual-')) {
        product = await Product.findOne({ _id: item.productId, businessId }).session(session);
      }

      const itemTotal = item.qty * item.costPrice;
      subtotal += itemTotal;

      purchaseItems.push({
        productId: product ? product._id : item.productId,
        name: product ? (product.name.en || product.name) : (item.name || 'Unknown Item'),
        sku: product ? product.sku : (item.sku || 'N/A'),
        qty: item.qty,
        costPrice: item.costPrice,
        total: itemTotal,
      });

      if (product) {
        // Update Product cost price if it changed
        if (product.pricing.costPrice !== item.costPrice) {
          product.pricing.costPrice = item.costPrice;
          await product.save({ session });
        }

        // Update Inventory Stock
        let stock = await InventoryStock.findOne({
          businessId,
          productId: product._id,
          warehouseId: data.warehouseId,
        }).session(session);

        const previousQty = stock ? stock.quantity : 0;
        const newQty = previousQty + item.qty;

        if (stock) {
          stock.quantity = newQty;
          stock.availableQty = newQty - stock.reservedQty;
          stock.costPrice = item.costPrice;
          await stock.save({ session });
        } else {
          const createdStocks = await InventoryStock.create([{
            businessId,
            productId: product._id,
            warehouseId: data.warehouseId,
            quantity: newQty,
            availableQty: newQty,
            costPrice: item.costPrice,
          }], { session });
          stock = createdStocks[0];
        }

        // Log Inventory Movement
        await InventoryLog.create([{
          businessId,
          productId: product._id,
          warehouseId: data.warehouseId,
          type: 'purchase',
          quantity: item.qty,
          previousQty,
          newQty,
          referenceId: purchaseId,
          referenceType: 'Purchase',
          note: `Purchase ${data.purchaseNumber} from ${data.supplierName}`,
          createdBy: userId,
        }], { session });
      }
    }

    const tax = data.tax || 0;
    const total = subtotal + tax;
    const dueAmount = Math.max(0, total - data.paidAmount);

    const purchase = await Purchase.create([{
      _id: purchaseId,
      businessId,
      supplierId: data.supplierId && mongoose.Types.ObjectId.isValid(data.supplierId) ? new mongoose.Types.ObjectId(data.supplierId) : undefined,
      supplierName: data.supplierName,
      purchaseNumber: data.purchaseNumber,
      items: purchaseItems,
      subtotal,
      tax,
      total,
      paidAmount: data.paidAmount,
      dueAmount,
      status: 'received',
      purchaseDate: data.purchaseDate || new Date(),
      note: data.note,
      createdBy: userId,
    }], { session });

    // Update supplier balance and total purchases if supplierId is provided
    if (data.supplierId && mongoose.Types.ObjectId.isValid(data.supplierId)) {
      const { Supplier } = await import('../models/Supplier.js');
      await Supplier.findByIdAndUpdate(
        data.supplierId,
        { $inc: { balance: dueAmount, totalPurchases: total } },
        { session }
      );
    }

    // Handle Accounting - Create Transaction for Cash Out (total purchase)
    // Record the full purchase amount as Cash Out (cash going out for inventory purchase)
    if (total > 0) {
      // Find default Cash account
      const cashAccount = await Account.findOne({ businessId, type: 'asset', isBank: false }).session(session);
      const inventoryAccount = await Account.findOne({ businessId, type: 'asset', name: /Inventory/i }).session(session);

      if (cashAccount && inventoryAccount) {
        // Cash Out - money going out from cash account
        await Transaction.create([{
          businessId,
          voucherNumber: `PUR-${Date.now()}`,
          date: data.purchaseDate || new Date(),
          type: 'debit', // Debit to inventory (asset increase)
          accountId: inventoryAccount._id,
          contraAccountId: cashAccount._id,
          amount: total,
          description: `Cash Out - Purchase ${data.purchaseNumber} from ${data.supplierName}`,
          reference: data.purchaseNumber,
          createdBy: userId,
        }], { session });

        // If there's a due amount, also record the payable
        if (dueAmount > 0) {
          const payableAccount = await Account.findOne({ businessId, type: 'liability', name: /Payable/i }).session(session);
          if (payableAccount) {
            await Transaction.create([{
              businessId,
              voucherNumber: `PUR-${Date.now()}-DUE`,
              date: data.purchaseDate || new Date(),
              type: 'credit', // Credit to payable (liability increase)
              accountId: payableAccount._id,
              contraAccountId: inventoryAccount._id,
              amount: dueAmount,
              description: `Purchase ${data.purchaseNumber} - Due Amount`,
              reference: data.purchaseNumber,
              createdBy: userId,
            }], { session });
          }
        }
      }
    }

    await session.commitTransaction();
    return purchase[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getPurchases = async (businessId: string, options: any = {}) => {
  const { page = 1, limit = 20, search, startDate, endDate } = options;
  const query: any = { businessId };

  if (startDate || endDate) {
    query.purchaseDate = {};
    if (startDate) query.purchaseDate.$gte = new Date(startDate);
    if (endDate) query.purchaseDate.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { purchaseNumber: { $regex: search, $options: 'i' } },
      { supplierName: { $regex: search, $options: 'i' } },
    ];
  }

  const purchases = await Purchase.find(query)
    .populate('createdBy', 'profile.firstName profile.lastName')
    .sort({ purchaseDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Purchase.countDocuments(query);

  return {
    purchases,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPurchaseById = async (id: string, businessId: string) => {
  const purchase = await Purchase.findOne({ _id: id, businessId })
    .populate('createdBy', 'profile.firstName profile.lastName');
  
  if (!purchase) {
    throw new AppError('Purchase not found', 404);
  }

  return purchase;
};
