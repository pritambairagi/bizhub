import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { Role } from '../models/Role.js';
import { AppError } from '../middleware/errorHandler.js';
import { User } from '../models/User.js';

export const getRoles = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.role === 'super_admin' 
      ? (req.query.businessId as string || undefined) 
      : req.user?.businessId?.toString();

    if (!businessId) {
      throw new AppError('Business ID is required', 400);
    }

    const roles = await Role.find({ businessId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch roles', 500);
  }
};

export const createRole = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId?.toString();
    if (!businessId) {
      throw new AppError('Business ID is required', 400);
    }

    const { name, description, permissions } = req.body;

    if (!name) {
      throw new AppError('Role name is required', 400);
    }

    const existingRole = await Role.findOne({ businessId, name });
    if (existingRole) {
      throw new AppError('Role with this name already exists', 400);
    }

    const role = await Role.create({
      businessId,
      name,
      description,
      permissions: permissions || [],
      isSystem: false,
    });

    res.status(201).json({
      success: true,
      data: role,
      message: 'Role created successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create role', 500);
  }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId?.toString();
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findOne({ _id: id, businessId });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    if (role.isSystem) {
      throw new AppError('System roles cannot be modified', 400);
    }

    role.name = name || role.name;
    role.description = description !== undefined ? description : role.description;
    if (permissions) {
      role.permissions = permissions;
    }

    await role.save();

    res.json({
      success: true,
      data: role,
      message: 'Role updated successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update role', 500);
  }
};

export const deleteRole = async (req: AuthRequest, res: Response) => {
  try {
    const businessId = req.user?.businessId?.toString();
    const { id } = req.params;

    const role = await Role.findOne({ _id: id, businessId });

    if (!role) {
      throw new AppError('Role not found', 404);
    }

    if (role.isSystem) {
      throw new AppError('System roles cannot be deleted', 400);
    }

    // Check if any user is assigned to this role before deleting
    const usersWithRole = await User.countDocuments({ customRoleId: id });
    if (usersWithRole > 0) {
      throw new AppError(`Cannot delete role as it is assigned to ${usersWithRole} user(s)`, 400);
    }

    await Role.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to delete role', 500);
  }
};
