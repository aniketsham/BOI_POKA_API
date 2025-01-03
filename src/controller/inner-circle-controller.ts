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

    // Check if an Inner Circle with the same name already exists
    const existingCircle = await InnerCircle.findOne({ circleName }).session(
      session
    );
    if (existingCircle) {
      res
        .status(400)
        .json({ error: 'An Inner Circle with the same name already exists' });
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { innerCircleId, inviteeId } = req.body;
    const inviterId = req.user?._id as mongoose.Schema.Types.ObjectId;

    const innerCircle =
      await InnerCircle.findById(innerCircleId).session(session);
    if (!innerCircle) {
      res.status(404).json({ error: 'Inner circle not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const inviter = innerCircle.members.find(
      (member) => member.userId.toString() === inviterId.toString()
    );
    if (!inviter || inviter.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can send invitations' });
      await session.abortTransaction();
      session.endSession();
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
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const isPending = innerCircle.members.some(
      (member) =>
        member.userId.toString() === inviteeId.toString() &&
        member.inviteStatus === 'Pending'
    );
    if (isPending) {
      res.status(400).json({ error: 'Invitation already sent and pending' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    innerCircle.members.push({
      userId: inviteeId,
      inviteStatus: 'Pending',
      role: 'member',
      addedBy: inviterId as mongoose.Schema.Types.ObjectId,

      addedAt: new Date(),
      isRemoved: false,
    });

    await innerCircle.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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

export const removeGenreFromInnerCircle = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { circleId, genreToRemove } = req.body;
    const user = req.user as UserModel;

    if (!circleId || !genreToRemove) {
      res
        .status(400)
        .json({ error: 'Circle ID and genre to remove are required' });
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
      res.status(403).json({ error: 'Only admins can remove genres' });
      return;
    }

    const genreIndex = innerCircle.circleGenre.indexOf(genreToRemove);
    if (genreIndex === -1) {
      res.status(400).json({ error: 'Genre not found in the inner circle' });
      return;
    }

    innerCircle.circleGenre.splice(genreIndex, 1);
    await innerCircle.save();

    res.status(200).json({
      message: 'Genre removed successfully',
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

export const addBookToInnerCircle = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { circleId, bookId } = req.body;
    const id = req.user?._id as UserModel;

    if (!circleId || !bookId) {
      res.status(400).json({ error: 'Circle ID and book ID are required' });
      return;
    }

    const innerCircle = await InnerCircle.findById(circleId);
    if (!innerCircle) {
      res.status(404).json({ error: 'Inner Circle not found' });
      return;
    }

    const isAdmin = innerCircle.members.some(
      (member) =>
        member.userId.toString() === id.toString() && member.role === 'ICAdmin'
    );
    if (!isAdmin) {
      res.status(403).json({ error: 'Only admins can add books' });
      return;
    }

    if (innerCircle.ISBN.includes(bookId)) {
      res
        .status(400)
        .json({ error: 'Book already exists in the Inner Circle' });
      return;
    }

    innerCircle.ISBN.push(bookId);
    await innerCircle.save();

    res.status(200).json({
      message: 'Book added to Inner Circle successfully',
      innerCircle,
    });
  } catch (error) {
    next(error);
  }
};

export const removeBookFromInnerCircle = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { circleId, bookId } = req.body;
    const id = req.user?._id as UserModel;

    if (!circleId || !bookId) {
      res.status(400).json({ error: 'Circle ID and book ID are required' });
      return;
    }

    const innerCircle = await InnerCircle.findById(circleId);
    if (!innerCircle) {
      res.status(404).json({ error: 'Inner Circle not found' });
      return;
    }

    const isAdmin = innerCircle.members.some(
      (member) =>
        member.userId.toString() === id.toString() && member.role === 'ICAdmin'
    );
    if (!isAdmin) {
      res.status(403).json({ error: 'Only admins can remove books' });
      return;
    }

    if (!innerCircle.ISBN.includes(bookId)) {
      res
        .status(400)
        .json({ error: 'Book does not exist in the Inner Circle' });
      return;
    }

    innerCircle.ISBN = innerCircle.ISBN.filter((isbn) => isbn !== bookId);
    await innerCircle.save();

    res.status(200).json({
      message: 'Book removed from Inner Circle successfully',
      innerCircle,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInnerCircle = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { circleId } = req.body;
    const userId = req.user?._id as mongoose.Types.ObjectId;

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
      res
        .status(403)
        .json({ error: 'Only admins can delete the Inner Circle' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Remove the Inner Circle from all members' user tables
    const memberIds = innerCircle.members.map((member) => member.userId);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { innerCircle: circleId } },
      { session }
    );

    // Delete the Inner Circle
    await InnerCircle.findByIdAndDelete(circleId).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Inner Circle deleted successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const makeMemberAdmin = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { circleId, memberId } = req.body;
    const userId = req.user?._id as mongoose.Types.ObjectId;

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
      res.status(403).json({ error: 'Only admins can update member roles' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const member = innerCircle.members.find(
      (member) => member.userId.toString() === memberId.toString()
    );
    if (!member) {
      res.status(404).json({ error: 'Member not found in the Inner Circle' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    member.role = 'ICAdmin';
    await innerCircle.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Member role updated to ICAdmin successfully',
      innerCircle,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const removeMemberAdmin = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { circleId, memberId } = req.body;
    const userId = req.user?._id as mongoose.Types.ObjectId;

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
      res.status(403).json({ error: 'Only admins can update member roles' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const member = innerCircle.members.find(
      (member) => member.userId.toString() === memberId.toString()
    );
    if (!member) {
      res.status(404).json({ error: 'Member not found in the Inner Circle' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    member.role = 'Member';
    await innerCircle.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Member role updated to Member successfully',
      innerCircle,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
