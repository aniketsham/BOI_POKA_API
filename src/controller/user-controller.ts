import { NextFunction, Request, Response } from 'express';
import User, { UserModel } from '../models/user-model';
import bcrypt from 'bcrypt';
import { CustomRequest } from '../types/types';
import innerCircle from '../models/inner-circle';
import jwt from 'jsonwebtoken';

//? Register a user
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, email, mobileNumber, password, userType } = req.body;

    const existingUserByMobile = await User.findOne({
      mobileNumber,
      isDeleted: false,
    });

    if (existingUserByMobile) {
      res
        .status(400)
        .json({ error: 'User already exists with this mobile Number' });
      return;
    }
    const existingUserByEmail = await User.findOne({ email, isDeleted: false });

    if (existingUserByEmail) {
      res.status(400).json({ error: 'User already exists with this Email' });
      return;
    }

    const newUser = new User({
      fullName,
      email,
      mobileNumber,
      password,
      userType,
      isActive: true,
      isVerified: false,
    });
    const savedUser = await newUser.save();
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

//? Login user
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { mobileNumber, password } = req.body;

    const user = await User.findOne({ mobileNumber });

    if (!user) {
      res.status(400).json({ error: 'Invalid mobile number or password' });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(400).json({ error: 'Invalid mobile number or password' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, mobileNumber: user.mobileNumber, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;

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

export const fetchInvites = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;

    const user = await User.findById(userId).select('invites');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const circleDetails = await innerCircle
      .find({
        _id: { $in: user.invites },
      })
      .select('circleName circleDescription circleGenre members');

    const invites = circleDetails.map((circle) => ({
      circleId: circle._id,
      circleName: circle.circleName,
      circleDescription: circle.circleDescription,
      circleGenre: circle.circleGenre,
      members: circle.members,
    }));

    res.status(200).json({ invites });
  } catch (error) {
    next(error);
  }
};
