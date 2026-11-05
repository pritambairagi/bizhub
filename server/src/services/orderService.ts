import { Order, Product, InventoryStock, InventoryLog, Customer, Branch, Warehouse, Transaction, Account } from '../models/index.js';
import { AppError } from '../middleware/index.js';
import { generateOrderNumber } from '../utils/helpers.js';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const createOrder = async (
  businessId: string,
  branchId: string,
  userId: string,
  data: {
    customer?: { id?: string; name: string; phone: string };
    items: Array<{
      productId: string;
      variantId?: string;
      qty: number;
      unitPrice: number;
      discount?: number;
      vat?: number;
    }>;
    discount?: { type: 'fixed' | 'percentage'; value: number };
    note?: string;
    payments?: Array<{ method: string; amount: number; reference?: string }>;
  }
) => {
  const branch = await Branch.findOne({ _id: branchId, businessId });
  if (!branch) {
    throw new AppError('Branch not found', 404);
  }

  let customer = null;
  if (data.customer?.id) {
    customer = await Customer.findOne({ _id: data.customer.id, businessId });
  }

  const orderItems: Array<{
    productId: mongoose.Types.ObjectId;
    name: string;
    sku: string;
    qty: number;
    unitPrice: number;
    discount: number;
    vat: number;
    total: number;
  }> = [];

  let subtotal = 0;
  let totalVat = 0;

  for (const item of data.items) {
    // Defensively extract pure productId — the frontend may send "productId-variantId" as a combined key
    const rawProductId = String(item.productId || '');
    const pureProdIdStr = rawProductId.includes('-') && rawProductId.length > 48
      ? rawProductId.split('-')[0]   // take only the first ObjectId part
      : rawProductId;

    // Validate and convert productId to ObjectId
    let productIdObj;
    try {
      productIdObj = new mongoose.Types.ObjectId(pureProdIdStr);
    } catch (err) {
      throw new AppError(`Invalid product ID: ${rawProductId}`, 400);
    }

    const product = await Product.findOne({
      _id: productIdObj,
      businessId,
    });

    if (!product) {
      // Also try without status filter (allow inactive during POS)
      const anyProduct = await Product.findById(productIdObj);
      if (!anyProduct || anyProduct.businessId.toString() !== businessId) {
        throw new AppError(`Product not found: ${pureProdIdStr}`, 404);
      }
    }

    const resolvedProduct = product || await Product.findById(productIdObj);

    // Handle variant if present
    let itemName = resolvedProduct!.name.en;
    let itemSku = resolvedProduct!.sku;
    let itemPrice = item.unitPrice;

    // Also extract variantId from combined string if needed
    const rawVariantId = item.variantId ? String(item.variantId) : '';
    const pureVariantId = rawVariantId.includes('-') && rawVariantId.length > 48
      ? rawVariantId.split('-').slice(-1)[0]  // last segment is the variant ObjectId
      : rawVariantId;

    if (pureVariantId && (resolvedProduct as any).variants) {
      // Validate variantId - ensure it's a clean ObjectId
      const variant = (resolvedProduct as any).variants.find((v: any) => {
        const vIdStr = v._id.toString();
        return vIdStr === pureVariantId || vIdStr === rawVariantId;
      });
      if (variant) {
        itemName = `${resolvedProduct!.name.en} (${variant.name})`;
        itemSku = `${resolvedProduct!.sku}-${variant.name.toUpperCase()}`;
        itemPrice = variant.priceOverride !== undefined && variant.priceOverride !== null
          ? variant.priceOverride
          : item.unitPrice;
      }
    }

    const itemTotal = item.qty * itemPrice;
    const itemDiscount = item.discount || 0;
    const itemVat = item.vat || (itemTotal * (resolvedProduct!.tax?.vatRate || 0)) / 100;
    const itemFinalTotal = itemTotal - itemDiscount + itemVat;

    orderItems.push({
      productId: resolvedProduct!._id as never,
      name: itemName,
      sku: itemSku,
      qty: item.qty,
      unitPrice: itemPrice,
      discount: itemDiscount,
      vat: itemVat,
      total: itemFinalTotal,
    });

    subtotal += itemTotal;
    totalVat += itemVat;
  }

  let discountAmount = 0;
  if (data.discount) {
    if (data.discount.type === 'percentage') {
      discountAmount = (subtotal * data.discount.value) / 100;
    } else {
      discountAmount = data.discount.value;
    }
  }

  const total = subtotal - discountAmount + totalVat;

  const totalPaid = (data.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const due = Math.max(0, total - totalPaid);

  const order = await Order.create({
    businessId,
    branchId,
    orderNumber: generateOrderNumber(businessId),
    type: 'sale',
    customer: {
      id: customer?._id,
      name: data.customer?.name || 'Walk-in Customer',
      phone: data.customer?.phone || '',
    },
    items: orderItems,
    subtotal,
    discount: {
      type: data.discount?.type || 'fixed',
      value: data.discount?.value || 0,
      amount: discountAmount,
    },
    vat: totalVat,
    total,
    paid: totalPaid,
    due,
    payments: data.payments || [],
    status: due > 0 ? 'pending' : 'confirmed',
    note: data.note,
    createdBy: userId,
  });

  // Update inventory - Deduct from the default warehouse of the branch
  const warehouse = await Warehouse.findOne({ branchId, businessId });
  
  for (const item of orderItems) {
    if (item.productId && warehouse) {
      const stock = await InventoryStock.findOne({
        productId: item.productId,
        warehouseId: warehouse._id,
      });

      const previousQty = stock ? stock.quantity : 0;
      const newQty = previousQty - item.qty;

      await InventoryStock.updateOne(
        {
          productId: item.productId,
          warehouseId: warehouse._id,
          businessId
        },
        {
          $inc: {
            quantity: -item.qty,
            availableQty: -item.qty,
          },
        },
        { upsert: true }
      );

      // Log the movement
      await InventoryLog.create({
        businessId,
        productId: item.productId,
        warehouseId: warehouse._id,
        type: 'sale',
        quantity: item.qty,
        previousQty,
        newQty,
        referenceId: order._id,
        referenceType: 'Order',
        createdBy: userId,
      });
    }
  }

  // Update customer wallet and loyalty
  if (customer) {
    const loyaltyPoints = Math.floor(total / 100);
    const newLifetimeValue = customer.loyalty.lifetimeValue + total;

    let newTier = customer.loyalty.tier;
    if (newLifetimeValue > 100000) {
      newTier = 'platinum';
    } else if (newLifetimeValue > 50000) {
      newTier = 'gold';
    } else if (newLifetimeValue > 10000) {
      newTier = 'silver';
    }

    await Customer.findByIdAndUpdate(customer._id, {
      $inc: {
        'loyalty.points': loyaltyPoints,
        'loyalty.lifetimeValue': total,
      },
      $set: {
        'loyalty.tier': newTier,
      },
    });
  }

  // Handle Accounting - Create Transaction for Cash In (sales revenue)
  // Record payments as Cash In (cash coming in from sales)
  if (totalPaid > 0) {
    try {
      // Find default Cash account and Revenue account
      const cashAccount = await Account.findOne({ businessId, type: 'asset', isBank: false });
      const revenueAccount = await Account.findOne({ businessId, type: 'income', name: /Sales|Revenue/i });

      if (cashAccount && revenueAccount) {
        // Cash In - money coming into cash account from sales
        await Transaction.create({
          businessId,
          voucherNumber: `SAL-${order.orderNumber}`,
          date: new Date(),
          type: 'credit', // Credit to revenue (income increase)
          accountId: revenueAccount._id,
          contraAccountId: cashAccount._id,
          amount: totalPaid,
          description: `Cash In - Sale ${order.orderNumber} from ${data.customer?.name || 'Walk-in Customer'}`,
          reference: order.orderNumber,
          createdBy: userId,
        });

        // If there's due amount, record the receivable
        if (due > 0) {
          const receivableAccount = await Account.findOne({ businessId, type: 'asset', name: /Receivable|Due/i });
          if (receivableAccount) {
            await Transaction.create({
              businessId,
              voucherNumber: `SAL-${order.orderNumber}-DUE`,
              date: new Date(),
              type: 'debit', // Debit to receivable (asset increase)
              accountId: receivableAccount._id,
              contraAccountId: revenueAccount._id,
              amount: due,
              description: `Sale ${order.orderNumber} - Due Amount`,
              reference: order.orderNumber,
              createdBy: userId,
            });
          }
        }
      }
    } catch (accountingError) {
      // Log but don't fail the order if accounting fails
      logger.error('Failed to create accounting transaction:', accountingError);
    }
  }

  logger.info(`Order created: ${order._id} for business ${businessId}`);

  return order;
};

export const getOrders = async (
  businessId: string,
  options: {
    page?: number;
    limit?: number;
    branchId?: string;
    status?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    customerId?: string;
  } = {}
) => {
  const { page = 1, limit = 20, branchId, status, type, startDate, endDate, search, customerId } = options;

  const query: Record<string, unknown> = {};
  if (businessId && mongoose.Types.ObjectId.isValid(businessId)) {
    query.businessId = new mongoose.Types.ObjectId(businessId);
  }

  if (branchId) query.branchId = new mongoose.Types.ObjectId(branchId);
  if (status) query.status = status;
  if (type) query.type = type;
  if (customerId) query['customer.id'] = new mongoose.Types.ObjectId(customerId);

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) (query.createdAt as Record<string, Date>).$gte = startDate;
    if (endDate) (query.createdAt as Record<string, Date>).$lte = endDate;
  }

  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'customer.phone': { $regex: search, $options: 'i' } },
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'items.name': { $regex: search, $options: 'i' } },
      { 'items.sku': { $regex: search, $options: 'i' } },
    ];
  }

  const orders = await Order.find(query)
    .populate('branchId', 'name code')
    .populate('createdBy', 'profile.firstName profile.lastName role')
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Order.countDocuments(query);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getOrder = async (orderId: string, businessId: string) => {
  const order = await Order.findOne({ _id: orderId, businessId })
    .populate('branchId')
    .populate('createdBy', 'profile.firstName profile.lastName role')
    .populate('customer.id');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return order;
};

export const updateOrderStatus = async (
  orderId: string,
  businessId: string,
  status: string
) => {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, businessId },
    { status },
    { new: true }
  );

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  logger.info(`Order ${orderId} status updated to ${status}`);

  return order;
};

export const processPayment = async (
  orderId: string,
  businessId: string,
  payments: Array<{ method: string; amount: number; reference?: string }>
) => {
  const order = await Order.findOne({ _id: orderId, businessId });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const totalPaid = order.paid + payments.reduce((sum, p) => sum + p.amount, 0);
  const due = Math.max(0, order.total - totalPaid);

  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    {
      $push: { payments: { $each: payments } },
      $set: { paid: totalPaid, due, status: due > 0 ? 'pending' : 'confirmed' },
    },
    { new: true }
  );

  logger.info(`Payment processed for order ${orderId}: ${payments.reduce((s, p) => s + p.amount, 0)}`);

  return updatedOrder;
};

export const createReturn = async (
  orderId: string,
  businessId: string,
  userId: string,
  data: {
    items: Array<{ productId: string; qty: number; reason?: string }>;
    refundAmount: number;
    refundMethod: string;
    note?: string;
  }
) => {
  const originalOrder = await Order.findOne({ _id: orderId, businessId });

  if (!originalOrder) {
    throw new AppError('Original order not found', 404);
  }

  const returnOrder = await Order.create({
    businessId,
    branchId: originalOrder.branchId,
    orderNumber: generateOrderNumber(businessId),
    type: 'return',
    customer: originalOrder.customer,
    items: data.items.map((item) => {
      const originalItem = originalOrder.items.find(
        (i) => i.productId.toString() === item.productId
      );
      return {
        productId: new mongoose.Types.ObjectId(item.productId),
        name: originalItem?.name || '',
        sku: originalItem?.sku || '',
        qty: item.qty,
        unitPrice: originalItem?.unitPrice || 0,
        discount: 0,
        vat: 0,
        total: -item.qty * (originalItem?.unitPrice || 0),
      };
    }),
    subtotal: -data.refundAmount,
    discount: { type: 'fixed', value: 0, amount: 0 },
    vat: 0,
    total: -data.refundAmount,
    paid: 0,
    due: 0,
    payments: [
      {
        method: data.refundMethod as never,
        amount: data.refundAmount,
      },
    ],
    status: 'completed',
    note: data.note,
    createdBy: userId,
  });

  // Restore inventory
  const warehouse = await Warehouse.findOne({ branchId: originalOrder.branchId, businessId });

  for (const item of data.items) {
    if (warehouse) {
      const stock = await InventoryStock.findOne({
        productId: item.productId,
        warehouseId: warehouse._id,
      });

      const previousQty = stock ? stock.quantity : 0;
      const newQty = previousQty + item.qty;

      await InventoryStock.updateOne(
        { 
          productId: item.productId,
          warehouseId: warehouse._id,
          businessId
        },
        {
          $inc: {
            quantity: item.qty,
            availableQty: item.qty,
          },
        }
      );

      // Log the movement
      await InventoryLog.create({
        businessId,
        productId: item.productId,
        warehouseId: warehouse._id,
        type: 'return',
        quantity: item.qty,
        previousQty,
        newQty,
        referenceId: returnOrder._id,
        referenceType: 'Order',
        createdBy: userId,
      });
    }
  }

  logger.info(`Return order created: ${returnOrder._id} for original order ${orderId}`);

  return returnOrder;
};

export const getDailySales = async (businessId: string, branchId?: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const query: Record<string, unknown> = {
    businessId,
    createdAt: { $gte: today },
    type: 'sale',
    status: { $ne: 'cancelled' },
  };

  if (branchId) {
    query.branchId = new mongoose.Types.ObjectId(branchId);
  }

  const orders = await Order.find(query);

  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalPaid = orders.reduce((sum, o) => sum + o.paid, 0);
  const totalDue = orders.reduce((sum, o) => sum + o.due, 0);
  const orderCount = orders.length;

  const paymentBreakdown = orders.reduce((acc, order) => {
    for (const payment of order.payments) {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSales,
    totalPaid,
    totalDue,
    orderCount,
    paymentBreakdown,
  };
};

export const getSalesReport = async (
  businessId: string,
  startDate: Date,
  endDate: Date,
  branchId?: string
) => {
  const query: Record<string, unknown> = {
    businessId,
    createdAt: { $gte: startDate, $lte: endDate },
    type: 'sale',
    status: { $ne: 'cancelled' },
  };

  if (branchId) {
    query.branchId = new mongoose.Types.ObjectId(branchId);
  }

  const orders = await Order.find(query).populate('branchId', 'name');

  const report = orders.reduce(
    (acc, order) => {
      acc.totalSales += order.total;
      acc.totalVat += order.vat;
      acc.totalDiscount += order.discount.amount;
      acc.orderCount += 1;

      if (order.branchId) {
        const branchName = (order.branchId as any).name;
        acc.byBranch[branchName] = (acc.byBranch[branchName] || 0) + order.total;
      }

      return acc;
    },
    {
      totalSales: 0,
      totalVat: 0,
      totalDiscount: 0,
      orderCount: 0,
      byBranch: {} as Record<string, number>,
    }
  );

  return report;
};