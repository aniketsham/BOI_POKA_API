import { Request, Response, NextFunction } from 'express';
import Admin from '../models/admin-model';


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