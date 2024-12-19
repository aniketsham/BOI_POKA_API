import { Request, Response, NextFunction } from 'express';
import SuperAdmin from '../models/superadmin-model';
import jwt from 'jsonwebtoken';

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
    return
    }

    const superAdmin = new SuperAdmin({
      email,
      mobileNumber,
      password,
    });

    await superAdmin.save();
    res.status(201).json({
      message: 'SuperAdmin registered successfully',
      superAdmin,
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

    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) {
      res.status(404).json({ error: 'SuperAdmin not found' });
      return
    }

    const isMatch = await superAdmin.comparePassword(password);
    if (!isMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return
    }
    const token = jwt.sign(
      { id: superAdmin._id, role: superAdmin.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'SuperAdmin logged in successfully',
      token,
      superAdmin,
    });
  } catch (error) {
    next(error);
  }
};
