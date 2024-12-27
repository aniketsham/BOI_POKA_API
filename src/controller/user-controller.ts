import { NextFunction, Request, Response } from 'express';
import User, { UserModel } from '../models/user-model';
import bcrypt from 'bcrypt';
import { CustomRequest } from '../types/types';
import innerCircle from '../models/inner-circle';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
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
      res.status(400).json({ error: 'Invalid Credentials' });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(400).json({ error: 'Invalid Credentials' });
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
  req: CustomRequest,
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

export const acceptInvitation = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { innerCircleId } = req.body;

    const typedUserId = userId as mongoose.Types.ObjectId;
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const invitationIndex = user.invites.findIndex((invite) => {
      return invite.toString() === innerCircleId;
    });

    if (invitationIndex === -1) {
      res.status(400).json({ message: 'Invitation not found in user invites' });
      return;
    }

    // Remove the invitation from the user's invites list
    user.invites.splice(invitationIndex, 1);
    await user.save();

    const InnerCircle = await innerCircle.findById(innerCircleId);
    if (!InnerCircle) {
      res.status(404).json({ message: 'Circle not found' });
      return;
    }

    // Debugging: Check the userId and member.userId types and values
    console.log('userId:', userId);
    InnerCircle.members.forEach((member, index) => {
      console.log(`member[${index}] userId value:`, member.userId);
    });

    // Compare as string if .equals() is not working
    const memberIndex = InnerCircle.members.findIndex((member) => {
      console.log(
        'Comparing',
        typedUserId.toString(),
        member.userId.toString()
      );
      return typedUserId.toString() === member.userId.toString();
    });

    if (memberIndex !== -1) {
      // Update the inviteStatus to "Accept" in the InnerCircle members array
      InnerCircle.members[memberIndex].inviteStatus = 'Accept';
      InnerCircle.markModified('members'); // Mark the members array as modified
      await InnerCircle.save();
    } else {
      res.status(400).json({ message: 'User is not a member of the circle' });
      return;
    }

    // Add the innerCircleId to the user's innerCircle array
    user.innerCircle.push(innerCircleId);
    await user.save();

    res.status(200).json({
      message: 'Invitation accepted successfully',
      innerCircle: InnerCircle,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectInvitation = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel; // userId is extracted from req.user
    const { innerCircleId } = req.body;

    // Ensure userId is treated as an ObjectId
    const typedUserId = userId as mongoose.Types.ObjectId;

    // Find the user
    const user = await User.findById(typedUserId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const invitationIndex = user.invites.findIndex((invite) => {
      return invite.toString() === innerCircleId;
    });

    if (invitationIndex === -1) {
      res.status(400).json({ message: 'Invitation not found in user invites' });
      return;
    }

    // Remove the invitation from the user's invites list
    user.invites.splice(invitationIndex, 1);
    await user.save();

    const InnerCircle = await innerCircle.findById(innerCircleId);
    if (!InnerCircle) {
      res.status(404).json({ message: 'Circle not found' });
      return;
    }

    // Debugging: Check the userId and member.userId types and values
    console.log('typedUserId:', typedUserId);
    InnerCircle.members.forEach((member, index) => {
      console.log(`member[${index}] userId value:`, member.userId);
    });

    // Compare as string if .equals() is not working
    const memberIndex = InnerCircle.members.findIndex((member) => {
      // Compare userId and member.userId as strings
      console.log(
        'Comparing',
        typedUserId.toString(),
        member.userId.toString()
      );
      return typedUserId.toString() === member.userId.toString();
    });

    if (memberIndex !== -1) {
      // Update the inviteStatus to "Reject"
      InnerCircle.members[memberIndex].inviteStatus = 'Reject';

      // Mark the members array as modified
      InnerCircle.markModified('members');
      await InnerCircle.save();
    } else {
      res.status(400).json({ message: 'User is not a member of the circle' });
      return;
    }

    res.status(200).json({
      message: 'Invitation rejected successfully',
    });
  } catch (error) {
    next(error);
  }
};
