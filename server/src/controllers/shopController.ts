import { Response } from 'express';
import { Product, Order, Category } from '../models/index.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

interface CartItem {
  productId: string;
  qty: number;
  price: number;
  total: number;
}

const cartStore: Map<string, CartItem[]> = new Map();

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search, category, sort = 'newest' } = req.query;
    const query: Record<string, unknown> = { status: 'active' };

    if (search) {
      query.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.bn': { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;

    let sortQuery: any = { createdAt: -1 };
    if (sort === 'price-low') sortQuery = { 'pricing.sellingPrice': 1 };
    if (sort === 'price-high') sortQuery = { 'pricing.sellingPrice': -1 };
    if (sort === 'popular') sortQuery = { createdAt: -1 };

    const products = await Product.find(query)
      .populate('category', 'name')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort(sortQuery);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get shop products error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ order: 1 });

    res.json({ success: true, data: { categories } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';
    const items = cartStore.get(sessionId) || [];

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId).select('name pricing images');
        return {
          ...item,
          product,
        };
      })
    );

    res.json({ success: true, data: { items: itemsWithProducts } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, qty = 1 } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const items = cartStore.get(sessionId) || [];
    const existingIndex = items.findIndex((item) => item.productId === productId);

    if (existingIndex >= 0) {
      items[existingIndex].qty += qty;
      items[existingIndex].total = items[existingIndex].qty * items[existingIndex].price;
    } else {
      items.push({
        productId,
        qty,
        price: product.pricing.sellingPrice,
        total: qty * product.pricing.sellingPrice,
      });
    }

    cartStore.set(sessionId, items);

    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const { qty } = req.body;
    const { itemId } = req.params;
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';

    const items = cartStore.get(sessionId) || [];
    const index = items.findIndex((item) => item.productId === itemId);

    if (index >= 0) {
      items[index].qty = qty;
      items[index].total = items[index].qty * items[index].price;
      cartStore.set(sessionId, items);
    }

    res.json({ success: true, data: { items } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const removeCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';

    const items = cartStore.get(sessionId) || [];
    const filteredItems = items.filter((item) => item.productId !== itemId);
    cartStore.set(sessionId, filteredItems);

    res.json({ success: true, data: { items: filteredItems } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const checkout = async (req: AuthRequest, res: Response) => {
  try {
    const { customer, items, paymentMethod, shipping, vat, total } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'anonymous';

    const orderItems = items.map((item: CartItem) => ({
      productId: item.productId,
      name: (item as unknown as { product?: { name?: { en: string } } }).product?.name?.en || 'Product',
      sku: '',
      qty: item.qty,
      unitPrice: item.price,
      discount: 0,
      vat: 0,
      total: item.total,
    }));

    // Find a default business and user for guest orders if not logged in
    let businessId = req.user?.businessId;
    let branchId = req.user?.branchId;
    let createdBy = req.user?._id;

    if (!businessId) {
      const defaultBusiness = await Product.findOne().select('businessId');
      businessId = defaultBusiness?.businessId;
      if (businessId) {
        const defaultBranch = await Order.findOne({ businessId }).select('branchId');
        branchId = defaultBranch?.branchId;
        const defaultUser = await Product.findOne({ businessId }).select('createdBy');
        createdBy = (defaultUser as any)?.createdBy;
      }
    }

    if (!businessId) {
      return res.status(400).json({ success: false, message: 'No business found to associate with order' });
    }

    const order = await Order.create({
      businessId,
      branchId: branchId || businessId, // Fallback to businessId if branchId missing
      orderNumber: `ORD-${Date.now()}`,
      type: 'sale',
      customer: {
        name: customer.name,
        phone: customer.phone,
      },
      items: orderItems,
      subtotal: total - (shipping || 0) - (vat || 0),
      discount: { type: 'fixed', value: 0, amount: 0 },
      vat: vat || 0,
      total,
      paid: 0,
      due: total,
      payments: [{ method: paymentMethod || 'cash', amount: total, reference: '' }],
      status: 'pending',
      note: '',
      createdBy: createdBy || businessId,
    });

    // Clear cart
    cartStore.delete(sessionId);

    res.status(201).json({ success: true, data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const query: Record<string, unknown> = {};
    if (req.user?.role !== 'super_admin') {
      query.businessId = req.user?.businessId;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: { orders } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findOne({
      _id: req.params['id'] as string,
      businessId: req.user?.businessId,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};