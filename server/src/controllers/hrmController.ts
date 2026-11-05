import { Request, Response } from 'express';
import { Employee } from '../models/index.js';
import type { AuthRequest } from '../types/index.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query: Record<string, unknown> = {};
    if (req.user?.role !== 'super_admin') {
      query.businessId = req.user?.businessId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(query)
      .populate('userId', 'email phone role permissions status')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Employee.countDocuments(query);

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get employees error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getEmployeeById = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findOne({
      _id: req.params['id'] as string,
      businessId: req.user?.businessId,
    }).populate('userId', 'email phone');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: { employee } });
  } catch (error) {
    logger.error('Get employee by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.businessId) {
      return res.status(400).json({ success: false, message: 'No business associated with your account' });
    }

    const { salary, roleId, email, password, ...rest } = req.body;

    // Enforce subscription plan limits for employees
    const { Business } = await import('../models/Business.js');
    const businessObj = await Business.findById(req.user.businessId);
    if (businessObj) {
      const plan = businessObj.subscription?.plan || 'free';
      let limitVal = 3;
      if (plan === 'standard') limitVal = 15;
      else if (plan === 'professional') limitVal = Infinity;

      if (limitVal !== Infinity) {
        const currentCount = await Employee.countDocuments({ businessId: req.user.businessId });
        if (currentCount >= limitVal) {
          return res.status(403).json({
            success: false,
            message: `Employee quota reached. Your subscription plan (${plan.toUpperCase()}) supports a maximum of ${limitVal} employees. Please upgrade your plan in settings to add more.`
          });
        }
      }
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const totalSalary = salary
      ? (salary.basic || 0) + (salary.houseRent || 0) + (salary.medical || 0) + (salary.transport || 0) + (salary.other || 0)
      : 0;

    const employeeData: any = {
      ...rest,
      businessId: req.user.businessId,
      employeeId: `EMP-${Date.now()}`,
      salary: { ...salary, total: totalSalary },
    };

    if (roleId && mongoose.Types.ObjectId.isValid(roleId)) {
      employeeData.roleId = roleId;
    }

    // Use provided email or generate a placeholder
    employeeData.email = email || `${rest.phone}@noemail.com`;

    const employee = await Employee.create(employeeData);

    // Create or link a User account for this employee
    const { User } = await import('../models/User.js');
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        { phone: rest.phone },
      ],
    });

    let linkedUser;
    if (!existingUser) {
      // Determine role from designation
      const validRoles = ['manager', 'accountant', 'cashier', 'delivery', 'salesman', 'vendor'];
      const assignedRole = rest.designation && validRoles.includes(rest.designation.toLowerCase())
        ? rest.designation.toLowerCase()
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

      linkedUser = await User.create({
        email: email || undefined,
        phone: rest.phone,
        password,
        role: assignedRole,
        businessId: req.user.businessId,
        profile: {
          firstName: rest.name,
          lastName: rest.surname || '',
        },
        permissions: defaultPermissions,
        status: 'active',
        failedLoginAttempts: 0,
      });
    } else {
      linkedUser = existingUser;
    }

    // Link userId back to employee
    employee.userId = linkedUser._id as any;
    await employee.save();

    res.status(201).json({ success: true, data: { employee } });
  } catch (error: any) {
    logger.error('Create employee error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An account with this email or phone already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message || error });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { salary, roleId, ...rest } = req.body;
    let updateData: any = { ...rest };

    if (salary) {
      const totalSalary =
        (salary.basic || 0) +
        (salary.houseRent || 0) +
        (salary.medical || 0) +
        (salary.transport || 0) +
        (salary.other || 0);
      updateData.salary = { ...salary, total: totalSalary };
    }

    if (roleId && mongoose.Types.ObjectId.isValid(roleId)) {
      updateData.roleId = roleId;
    } else {
      updateData.$unset = { roleId: 1 };
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: req.params['id'] as string, businessId: req.user?.businessId },
      updateData,
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, data: { employee } });
  } catch (error) {
    logger.error('Update employee error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const updateEmployeePermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // userId
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'permissions must be an array' });
    }

    const { User } = await import('../models/User.js');

    // Verify the target user belongs to the same business via their Employee record
    const employee = await Employee.findOne({
      userId: id,
      businessId: req.user?.businessId,
    });

    if (!employee) {
      // Fallback: check user's businessId directly
      const userCheck = await User.findOne({ _id: id, businessId: req.user?.businessId });
      if (!userCheck) {
        return res.status(404).json({ success: false, message: 'User not found or access denied' });
      }
    }

    // Use findByIdAndUpdate for a reliable atomic update (no pre-save hooks on permissions)
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { permissions } },
      { new: true, select: 'email phone role permissions status' }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    logger.info(`Permissions updated for user ${id} by owner ${req.user?._id}: ${JSON.stringify(permissions)}`);

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    logger.error('Update employee permissions error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findOneAndDelete({
      _id: req.params['id'] as string,
      businessId: req.user?.businessId,
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee deleted' });
  } catch (error) {
    logger.error('Delete employee error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { date, employeeId, startDate, endDate } = req.query;
    const { Attendance } = await import('../models/Attendance.js');
    
    const query: Record<string, any> = {
      businessId: req.user?.businessId
    };

    if (employeeId) query.employeeId = employeeId;
    if (date) query.date = new Date(date as string);
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const attendance = await Attendance.find(query).populate('employeeId', 'name employeeId');

    res.json({ success: true, data: { attendance } });
  } catch (error) {
    logger.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const recordAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, note, location } = req.body;
    const { Attendance } = await import('../models/Attendance.js');

    const attendanceDate = new Date(date || new Date().toISOString().split('T')[0]);
    
    let attendance = await Attendance.findOne({
      businessId: req.user?.businessId,
      employeeId,
      date: attendanceDate
    });

    if (attendance) {
      if (checkIn) attendance.checkIn = new Date(checkIn);
      if (checkOut) attendance.checkOut = new Date(checkOut);
      if (status) attendance.status = status;
      if (note) attendance.note = note;
      if (location) attendance.location = location;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        businessId: req.user?.businessId,
        employeeId,
        date: attendanceDate,
        checkIn: new Date(checkIn || new Date()),
        checkOut: checkOut ? new Date(checkOut) : undefined,
        status: status || 'present',
        note,
        location
      });
    }

    res.json({ success: true, data: { attendance } });
  } catch (error) {
    logger.error('Record attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const getPayroll = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, employeeId } = req.query;
    const { Payroll } = await import('../models/Payroll.js');

    const query: any = { businessId: req.user?.businessId };
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (employeeId) query.employeeId = employeeId;

    const payrolls = await Payroll.find(query).populate('employeeId', 'name employeeId salary');

    res.json({ success: true, data: { payrolls } });
  } catch (error) {
    logger.error('Get payroll error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const generatePayroll = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, employeeIds } = req.body;
    const { Payroll } = await import('../models/Payroll.js');
    const { Employee } = await import('../models/Employee.js');

    const query: any = { businessId: req.user?.businessId, status: 'active' };
    if (employeeIds && employeeIds.length > 0) {
      query._id = { $in: employeeIds };
    }

    const employees = await Employee.find(query);
    const createdPayrolls = [];

    for (const emp of employees) {
      const existing = await Payroll.findOne({
        businessId: req.user?.businessId,
        employeeId: emp._id,
        month,
        year
      });

      if (!existing) {
        const netSalary = emp.salary.total; // Simplified logic, can be expanded with attendance
        const payroll = await Payroll.create({
          businessId: req.user?.businessId,
          employeeId: emp._id,
          month,
          year,
          basicSalary: emp.salary.basic,
          allowances: {
            houseRent: emp.salary.houseRent,
            medical: emp.salary.medical,
            transport: emp.salary.transport,
            other: emp.salary.other,
          },
          deductions: { tax: 0, providentFund: 0, other: 0 },
          netSalary,
          status: 'pending'
        });
        createdPayrolls.push(payroll);
      }
    }

    res.json({ success: true, message: `Generated ${createdPayrolls.length} payroll records`, data: { payrolls: createdPayrolls } });
  } catch (error) {
    logger.error('Generate payroll error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

export const paySalary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId, note } = req.body;
    const { Payroll } = await import('../models/Payroll.js');

    const payroll = await Payroll.findOneAndUpdate(
      { _id: id, businessId: req.user?.businessId },
      {
        status: 'paid',
        paymentDate: new Date(),
        paymentMethod,
        transactionId,
        note
      },
      { new: true }
    );

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    res.json({ success: true, message: 'Salary marked as paid', data: { payroll } });
  } catch (error) {
    logger.error('Pay salary error:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};