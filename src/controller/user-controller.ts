import { NextFunction, Request, Response } from 'express';
import User from '../models/user-model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

//? Register a user
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, email, mobileNumber, password, userType } = req.body;

    const existingUserByMobile = await User.findOne({ mobileNumber });

    if (existingUserByMobile) {
      res
        .status(400)
        .json({ error: 'User already exists with this mobile Number' });
      return;
    }
    const existingUserByEmail = await User.findOne({ email });

    if (existingUserByEmail) {
      res
        .status(400)
        .json({ error: 'User already exists with this Email' });
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
    // console.log(user)

    if (!user) {
    //   console.log('User not found with mobile number:', mobileNumber);
      res.status(400).json({ error: 'Invalid mobile number or password' });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
    //   console.log('Invalid password for mobile number:', mobileNumber);
      res.status(400).json({ error: 'Invalid mobile number or password' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, mobileNumber: user.mobileNumber },
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
      },
    });
    return
  } catch (error) {
    next(error); 
  }
};

//? Get All users route
/*
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    next(error); 
  }
};
*/

//? Get user by id
/*
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
     res.status(404).json({ error: 'User not found' });
     return
    }
        
    res.status(200).json(user);
  } catch (err) {
    next(err); 
  }
};
*/

//? Update a user
/*
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return
    }
    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};
*/

//? Delete a user
/*
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
        res.status(404).json({ error: 'User not found' });
        return
    } 
        
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};
*/
