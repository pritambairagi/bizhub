import { Response } from 'express';
import { EMIRecord, DueRecord, Association } from '../models/Finance.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';

// ==========================================
// EMI / INSTALLMENT CONTROLLERS
// ==========================================

export const getEMIRecords = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const records = await EMIRecord.find({ businessId }).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    logger.error('Get EMIs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch EMI records' });
  }
};

export const createEMI = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const record = await EMIRecord.create({
      ...req.body,
      businessId,
      createdBy: req.user?._id
    });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    logger.error('Create EMI error:', error);
    res.status(500).json({ success: false, message: 'Failed to create EMI record' });
  }
};

export const payEMI = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;
    const { amount, note } = req.body;

    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const emi = await EMIRecord.findOne({ _id: id, businessId });
    if (!emi) return res.status(404).json({ success: false, message: 'EMI not found' });

    emi.paidAmount += Number(amount);
    emi.payments.push({
      date: new Date(),
      amount: Number(amount),
      note: note || 'Installment Payment'
    });

    // Increment paid installments
    const currentPaidInstallments = emi.paidInstallments;
    emi.paidInstallments = Math.min(emi.totalInstallments, currentPaidInstallments + 1);

    // Calculate next due date
    const currentDueDate = emi.nextDueDate ? new Date(emi.nextDueDate) : new Date(emi.startDate);
    if (emi.frequency === 'weekly') {
      currentDueDate.setDate(currentDueDate.getDate() + 7);
    } else if (emi.frequency === 'quarterly') {
      currentDueDate.setMonth(currentDueDate.getMonth() + 3);
    } else {
      // monthly
      currentDueDate.setMonth(currentDueDate.getMonth() + 1);
    }
    emi.nextDueDate = currentDueDate;

    await emi.save();

    res.json({ success: true, data: emi });
  } catch (error) {
    logger.error('Pay EMI error:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
};

export const deleteEMI = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;

    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const result = await EMIRecord.findOneAndDelete({ _id: id, businessId });
    if (!result) return res.status(404).json({ success: false, message: 'EMI not found' });

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    logger.error('Delete EMI error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete record' });
  }
};

// ==========================================
// DUES CONTROLLERS
// ==========================================

export const getDues = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const records = await DueRecord.find({ businessId }).sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    logger.error('Get Dues error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dues' });
  }
};

export const createDue = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const record = await DueRecord.create({
      ...req.body,
      businessId,
      createdBy: req.user?._id
    });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    logger.error('Create Due error:', error);
    res.status(500).json({ success: false, message: 'Failed to create due record' });
  }
};

export const payDue = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;
    const { amount, note } = req.body;

    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const record = await DueRecord.findOne({ _id: id, businessId });
    if (!record) return res.status(404).json({ success: false, message: 'Due record not found' });

    record.paidAmount += Number(amount);
    record.payments.push({
      date: new Date(),
      amount: Number(amount),
      note: note || 'Due Payment'
    });

    await record.save();
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('Pay Due error:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
};

export const deleteDue = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;

    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const result = await DueRecord.findOneAndDelete({ _id: id, businessId });
    if (!result) return res.status(404).json({ success: false, message: 'Due record not found' });

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    logger.error('Delete Due error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete record' });
  }
};

// ==========================================
// ASSOCIATION CONTROLLERS
// ==========================================

export const getAssociations = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const associations = await Association.find({ businessId }).sort({ createdAt: -1 });
    res.json({ success: true, data: associations });
  } catch (error) {
    logger.error('Get Associations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch associations' });
  }
};

export const createAssociation = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const assoc = await Association.create({
      ...req.body,
      businessId,
      createdBy: req.user?._id
    });
    res.status(201).json({ success: true, data: assoc });
  } catch (error) {
    logger.error('Create Association error:', error);
    res.status(500).json({ success: false, message: 'Failed to create association' });
  }
};

export const addAssociationMember = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;
    const { name, phone, shareAmount } = req.body;

    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const assoc = await Association.findOne({ _id: id, businessId });
    if (!assoc) return res.status(404).json({ success: false, message: 'Association not found' });

    assoc.members.push({
      name,
      phone: phone || '',
      shareAmount: Number(shareAmount) || 0,
      paidAmount: 0,
      joinDate: new Date()
    });
    assoc.memberCount = assoc.members.length;

    await assoc.save();
    res.json({ success: true, data: assoc });
  } catch (error) {
    logger.error('Add Assoc Member error:', error);
    res.status(500).json({ success: false, message: 'Failed to add member' });
  }
};

export const addAssociationTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;
    const { type, amount, description, member } = req.body;

    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const assoc = await Association.findOne({ _id: id, businessId });
    if (!assoc) return res.status(404).json({ success: false, message: 'Association not found' });

    assoc.transactions.push({
      date: new Date(),
      type,
      amount: Number(amount),
      description,
      member: member || undefined
    });

    if (type === 'credit') {
      assoc.totalFund += Number(amount);
      // If member is specified, also credit their paidAmount
      if (member) {
        const index = assoc.members.findIndex(m => m.name === member);
        if (index !== -1) {
          assoc.members[index].paidAmount += Number(amount);
        }
      }
    } else {
      assoc.totalFund = Math.max(0, assoc.totalFund - Number(amount));
    }

    await assoc.save();
    res.json({ success: true, data: assoc });
  } catch (error) {
    logger.error('Add Assoc Transaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to record transaction' });
  }
};

export const deleteAssociation = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId;
    const { id } = req.params;

    if (!businessId) return res.status(400).json({ success: false, message: 'No business' });

    const result = await Association.findOneAndDelete({ _id: id, businessId });
    if (!result) return res.status(404).json({ success: false, message: 'Association not found' });

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    logger.error('Delete Association error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete association' });
  }
};
