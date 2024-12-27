import { Response, NextFunction } from 'express';
import InnerCircle from '../models/inner-circle';
import User, { UserModel } from '../models/user-model';
import { CustomRequest } from '../types/types';
import mongoose from 'mongoose';

export const createInnerCircle = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user as UserModel;
    const { _id: userId } = user;
    const { circleName, circleGenre, ISBN } = req.body;

    if (!userId || !circleName || !circleGenre) {
      res.status(400).json({ error: 'Please provide all the required fields' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const newInnerCircle = new InnerCircle({
      circleName,
      circleGenre,
      members: [
        {
          userId,
          role: 'ICAdmin',
          inviteStatus: 'Accept',
          createdBy: userId.toString(),
          addedBy: userId,
        },
      ],
      ISBN,
    });

    const savedInnerCircle = await newInnerCircle.save({ session });

    const userUpdate = await User.findByIdAndUpdate(
      userId,
      { $push: { innerCircle: savedInnerCircle._id } },
      { new: true, session }
    );

    if (!userUpdate) {
      res.status(404).json({ message: 'User not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Inner Circle created successfully',
      innerCircle: savedInnerCircle,
      user: userUpdate,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const sendInvitation = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { inviteeId, circleId } = req.body;
    const user = req.user as UserModel;
    if (!user || !user._id) {
      res.status(400).json({ error: 'User not found or invalid user type' });
      return;
    }
    const { _id: userId } = user;

    if (!inviteeId) {
      res.status(400).json({ error: 'inviteeId is required' });
      return;
    }

    // Check if the inner circle exists
    const innerCircle = await InnerCircle.findById(circleId);
    if (!innerCircle) {
      res.status(404).json({ error: 'Inner Circle not found' });
      return;
    }

    // Check if the user sending the invite is an admin
    const isAdmin = innerCircle.members.some(
      (member) =>
        member.userId.toString() === userId.toString() &&
        member.role === 'ICAdmin'
    );
    if (!isAdmin) {
      res.status(403).json({ error: 'Only admins can send invitations' });
      return;
    }

    const isMember = innerCircle.members.some(
      (member) =>
        member.userId.toString() === inviteeId.toString() &&
        member.inviteStatus === 'Accept'
    );
    if (isMember) {
      res
        .status(400)
        .json({ error: 'User is already a member of the inner circle' });
      return;
    }

    const isPending = innerCircle.members.some(
      (member) =>
        member.userId.toString() === inviteeId.toString() &&
        member.inviteStatus === 'Pending'
    );
    if (isPending) {
      res.status(400).json({ error: 'Invitation already sent and pending' });
      return;
    }

    const invitee = await User.findById(inviteeId);
    if (!invitee) {
      res.status(404).json({ error: 'Invitee not found' });
      return;
    }

    innerCircle.members.push({
      userId: inviteeId,
      role: 'Member',
      addedBy: userId as mongoose.Schema.Types.ObjectId,
      inviteStatus: 'Accept',

      addedAt: new Date(),
      isRemoved: false,
    });
    await innerCircle.save();

    invitee.invites.push(circleId);
    await invitee.save();

    res.status(200).json({
      message: 'Invitation sent successfully',
      innerCircle,
    });
  } catch (error) {
    next(error);
  }
};

export const addGenreToInnerCircle = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { circleId, newGenre } = req.body;
    const user = req.user as UserModel;

    if (!circleId || !newGenre) {
      res.status(400).json({ error: 'Circle ID and new genre are required' });
      return;
    }

    const innerCircle = await InnerCircle.findById(circleId);
    if (!innerCircle) {
      res.status(404).json({ error: 'Inner Circle not found' });
      return;
    }

    const isAdmin = innerCircle.members.some(
      (member) => member.userId === user._id && member.role === 'ICAdmin'
    );
    if (!isAdmin) {
      res.status(403).json({ error: 'Only admins can add genres' });
      return;
    }

    if (!innerCircle.circleGenre.includes(newGenre)) {
      innerCircle.circleGenre.push(newGenre);
      await innerCircle.save();
    } else {
      res
        .status(400)
        .json({ error: 'Genre already exists in the inner circle' });
      return;
    }

    res.status(200).json({
      message: 'Genre added successfully',
      innerCircle,
    });
  } catch (error) {
    next(error);
  }
};

export const removeUserFromInnerCircle = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { circleId, userIdToRemove } = req.body;
    const userId = req.user?._id as UserModel;

    const innerCircle = await InnerCircle.findById(circleId).session(session);
    if (!innerCircle) {
      res.status(404).json({ error: 'Inner Circle not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const isAdmin = innerCircle.members.some(
      (member) =>
        member.userId.toString() === userId.toString() &&
        member.role === 'ICAdmin'
    );
    if (!isAdmin) {
      res.status(403).json({ error: 'Only admins can remove members' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    innerCircle.members = innerCircle.members.filter(
      (member) => member.userId.toString() !== userIdToRemove.toString()
    );
    await innerCircle.save({ session });

    const userUpdate = await User.findByIdAndUpdate(
      userIdToRemove,
      { $pull: { innerCircle: circleId } },
      { new: true, session }
    );

    if (!userUpdate) {
      res.status(404).json({ message: 'User not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'User removed from Inner Circle successfully',
      innerCircle,
      user: userUpdate,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const fetchInnerCircleMembers = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { circleId } = req.params;

    const innerCircle = await InnerCircle.findById(circleId);
    if (!innerCircle) {
      res.status(404).json({ error: 'Inner Circle not found' });
      return;
    }

    const admin = innerCircle.members.find(
      (member) => member.role === 'ICAdmin'
    );

    const members = innerCircle.members.filter(
      (member) => member.role !== 'ICAdmin'
    );

    res.status(200).json({
      message: 'Inner Circle members retrieved successfully',
      admin,
      members,
    });
  } catch (error) {
    next(error);
  }
};
