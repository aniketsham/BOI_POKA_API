import { Request, Response, NextFunction } from 'express';
import SuperAdmin from '../models/superadmin-model';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin-model';

//? Optional Register API Route
export const registerSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, mobileNumber, password } = req.body;

    const existingAdmin = await SuperAdmin.findOne({ email });
    if (existingAdmin) {
      res.status(400).json({ error: 'SuperAdmin already exists' });
      return;
    }

    const superAdmin = new SuperAdmin({
      email,
      mobileNumber,
      password,
    });

    await superAdmin.save();
    res.status(201).json({
      message: 'SuperAdmin registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

//? Login SuperAdmin Route
export const loginSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({ email }).select('+password');
    if (!superAdmin) {
      res.status(404).json({ error: 'Invalid Credentials' });
      return;
    }

    const isMatch = await superAdmin.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid Credentials' });
      return;
    }
    const token = jwt.sign(
      { id: superAdmin._id, role: superAdmin.role },
      process.env.JWT_SECRET || 'secret'
    );

    res.status(200).json({
      message: 'SuperAdmin logged in successfully',
      token,
    });
  } catch (error) {
    next(error);
  }
};

//? Get All Admins
export const getAllAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const admins = await Admin.find();

    res.status(200).json({
      message: 'Admins retrieved successfully',
      admins: admins,
    });
  } catch (error) {
    next(error);
  }
};

//? Get Admin By Id
export const getAdminById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const adminId = req.params.adminId;
    const admin = await Admin.findById(adminId);
    if (!admin || admin.isDeleted) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }
    res.status(200).json({
      message: 'Admin retrieved successfully',
      admin,
    });
  } catch (error) {
    next(error);
  }
};

//? Update Admin By Id

export const updateAdminById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { adminId } = req.params;
    const updateData = req.body;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        ...updateData,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedAdmin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    res.status(200).json({
      message: 'Admin updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

//? Delete Admin
export const deleteAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { adminId } = req.params;
    const { deletedBy } = req.body;

    if (!deletedBy) {
      res.status(400).json({ error: 'deletedBy is required' });
      return;
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedBy: deletedBy,
        deactivatedAt: new Date(),
        deactivatedBy: deletedBy,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedAdmin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    res.status(200).json({
      message: 'Admin marked as deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};
