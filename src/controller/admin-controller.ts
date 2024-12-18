import { Request, Response, NextFunction } from 'express';
import Admin from '../models/admin-model';
import jwt from 'jsonwebtoken';

export const registerAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { fullName, email, mobileNumber, password } = req.body;
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
          res.status(400).json({ error: 'Admin already exists' });
          return;
        }
        const newAdmin = new Admin({
            fullName,
            email,
            mobileNumber,
            password,
        });
        await newAdmin.save();

        res.status(201).json({
          message: 'Admin registered successfully',
          admin: {
            id: newAdmin._id,
            fullName: newAdmin.fullName,
            email: newAdmin.email,
          },
        });
    } catch (error) {
        next(error);
    }
};

export const loginAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
          res.status(400).json({ error: 'Email and password are required' });
          return;
        }
        const admin = await Admin.findOne({ email });
        if (!admin) {
          res.status(401).json({ error: 'Invalid Credentials' });
          return;
        }
        const isPasswordValid = await admin.comparePassword(password);
        if (!isPasswordValid) {
          res.status(401).json({ error: 'Invalid Password' });
          return;
        }
        const token = jwt.sign(
          { id: admin._id, role: admin.role },
          process.env.JWT_SECRET as string,
          { expiresIn: '1h' }
        );
        res.status(200).json({
          message: 'Login successful',
          admin: {
            id: admin._id,
            fullName: admin.fullName,
            email: admin.email,
            role: admin.role,
          },
          token,
        });
    } catch (error) {
        next(error);    
    }
};