import { Response, NextFunction } from 'express';
import InnerCircle from '../models/inner-circle';
import User, { UserModel } from '../models/user-model';
import { CustomRequest } from '../types/types';
import mongoose from 'mongoose';

export const createInnerCircle = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserModel;
    const { _id: userId } = user;
    const { circleName, circleGenre, ISBN } = req.body;
    if (!userId || !circleName || !circleGenre) {
      res.status(400).json({ error: 'Please provide all the required fields' });
      return;
    }

    const newInnerCircle = new InnerCircle({
      circleName,
      circleGenre,
      members: [
        {
          userId,
          role: 'ICAdmin',
          createdBy: userId.toString(),
          addedBy: userId,
        },
      ],
      ISBN,
    });

    const savedInnerCircle = await newInnerCircle.save();

    res.status(201).json({
      message: 'Inner Circle created successfully',
      innerCircle: savedInnerCircle,
    });
  } catch (error) {
    next(error);
  }
};

//? Send Invitation

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
        member.role === 'Admin'
    );
    if (!isAdmin) {
      res.status(403).json({ error: 'Only admins can send invitations' });
      return;
    }

    // Check if the invitee is already a member of the inner circle
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

    // Check if an invitation is already pending
    const isPending = innerCircle.members.some(
      (member) =>
        member.userId.toString() === inviteeId.toString() &&
        member.inviteStatus === 'Pending'
    );
    if (isPending) {
      res.status(400).json({ error: 'Invitation already sent and pending' });
      return;
    }

    // Check if the invitee exists in the database
    const invitee = await User.findById(inviteeId);
    if (!invitee) {
      res.status(404).json({ error: 'Invitee not found' });
      return;
    }

    // Add the invitation to the inner circle
    innerCircle.members.push({
      userId: inviteeId,
      role: 'Member',
      createdBy: userId as string,
      addedBy: userId as mongoose.Schema.Types.ObjectId,
      inviteStatus: 'Pending',
      createdAt: new Date(),
      addedAt: new Date(),
      isRemoved: false,
    });
    await innerCircle.save();

    // Add the invitation to the invitee's invites
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
