import { Request, Response, NextFunction } from 'express';
import Admin from '../models/admin-model';
import jwt from 'jsonwebtoken';
import User from '../models/user-model';
import bcrypt from 'bcrypt';

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

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
    try {
      const users = await User.find();

      res.status(200).json({
        message: 'Users retrieved successfully',
        users: users, 
      });
    } catch (error) {
      next(error); 
    }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};


//? Delete a user

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { deletedBy } = req.body; 

    if (!deletedBy) {
      res.status(400).json({ error: 'deletedBy is required' });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
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
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    //? we no longer need delete functionality
    // const deletedUser = await User.findByIdAndDelete(userId);
    // if (!deletedUser) {
    //     res.status(404).json({ error: 'User not found' });
    //     return
    // } 
        
    res.status(200).json({
      message: 'User marked as deleted successfully',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

