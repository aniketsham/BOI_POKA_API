import { NextFunction, Request, Response } from 'express';
import User, { UserModel } from '../models/user-model';
import bcrypt from 'bcrypt';
import { CustomRequest } from '../types/types';
import innerCircle from '../models/inner-circle';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import UserBook from '../models/userbook-model';
import Genre from '../models/genre-model';
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
    await newUser.save();
    res.status(201).json({
      message: 'User registered successfully',
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

    const user = await User.findOne({ mobileNumber }).select('+password');

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
    });
  } catch (err) {
    next(err);
  }
};

//? Update password
export const updatePassword = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { _id: userId } = req.user as UserModel;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Password is required' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { _id: userId } = req.user as UserModel;
    const { innerCircleId } = req.body;

    const typedUserId = userId as mongoose.Types.ObjectId;

    const user = await User.findById(userId).session(session);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const invitationIndex = user.invites.findIndex((invite) => {
      return invite.toString() === innerCircleId;
    });

    if (invitationIndex === -1) {
      res.status(400).json({ message: 'Invitation not found in user invites' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    user.invites.splice(invitationIndex, 1);
    await user.save({ session });

    const InnerCircle = await innerCircle
      .findById(innerCircleId)
      .session(session);
    if (!InnerCircle) {
      res.status(404).json({ message: 'Circle not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const memberIndex = InnerCircle.members.findIndex((member) => {
      return typedUserId.toString() === member.userId.toString();
    });

    if (memberIndex !== -1) {
      InnerCircle.members[memberIndex].inviteStatus = 'Accept';
      InnerCircle.markModified('members');
      await InnerCircle.save({ session });
    } else {
      res.status(400).json({ message: 'User is not a member of the circle' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    user.innerCircle.push(innerCircleId);
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Invitation accepted successfully',
      innerCircle,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const rejectInvitation = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { _id: userId } = req.user as UserModel;
    const { innerCircleId } = req.body;

    const typedUserId = userId as mongoose.Types.ObjectId;

    const user = await User.findById(typedUserId).session(session);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const invitationIndex = user.invites.findIndex((invite) => {
      return invite.toString() === innerCircleId;
    });

    if (invitationIndex === -1) {
      res.status(400).json({ message: 'Invitation not found in user invites' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    user.invites.splice(invitationIndex, 1);
    await user.save({ session });

    const InnerCircle = await innerCircle
      .findById(innerCircleId)
      .session(session);
    if (!InnerCircle) {
      res.status(404).json({ message: 'Circle not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const memberIndex = InnerCircle.members.findIndex((member) => {
      return typedUserId.toString() === member.userId.toString();
    });

    if (memberIndex !== -1) {
      InnerCircle.members[memberIndex].inviteStatus = 'Reject';
      InnerCircle.markModified('members');
      await InnerCircle.save({ session });
    } else {
      res.status(400).json({ message: 'User is not a member of the circle' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Invitation rejected successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const leaveInnerCircle = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { circleId } = req.body;
    const userId = req.user?._id as mongoose.Types.ObjectId;

    const InnerCircle = await innerCircle.findById(circleId).session(session);
    if (!InnerCircle) {
      res.status(404).json({ error: 'Inner Circle not found' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const isMember = InnerCircle.members.some(
      (member) => member.userId.toString() === userId.toString()
    );
    if (!isMember) {
      res
        .status(403)
        .json({ error: 'You are not a member of this Inner Circle' });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    InnerCircle.members = InnerCircle.members.filter(
      (member) => member.userId.toString() !== userId.toString()
    );
    await InnerCircle.save({ session });

    const userUpdate = await User.findByIdAndUpdate(
      userId,
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
      message: 'You have successfully left the Inner Circle',
      innerCircle,
      // user: userUpdate,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getAnalytics = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id as mongoose.Types.ObjectId;

    // Get the number of books for the specific user
    const userBooksCount = await UserBook.aggregate([
      {
        $match: { user: userId },
      },
      {
        $unwind: '$libraries',
      },
      {
        $unwind: '$libraries.shelves',
      },
      {
        $unwind: '$libraries.shelves.books',
      },
      {
        $group: {
          _id: '$user',
          bookCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          fullName: '$user.fullName',
          bookCount: 1,
        },
      },
    ]);

    // Get the number of books for each source for the specific user
    const booksBySource = await UserBook.aggregate([
      {
        $match: { user: userId },
      },
      {
        $unwind: '$libraries',
      },
      {
        $unwind: '$libraries.shelves',
      },
      {
        $unwind: '$libraries.shelves.books',
      },
      {
        $group: {
          _id: '$libraries.shelves.books.source.sourceType',
          bookCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          sourceType: '$_id',
          bookCount: 1,
        },
      },
    ]);

    const booksByGenre = await UserBook.aggregate([
      {
        $match: { user: userId },
      },
      {
        $unwind: '$libraries',
      },
      {
        $unwind: '$libraries.shelves',
      },
      {
        $unwind: '$libraries.shelves.books',
      },
      {
        $lookup: {
          from: 'books',
          localField: 'libraries.shelves.books.bookId',
          foreignField: '_id',
          as: 'bookDetails',
        },
      },
      {
        $unwind: '$bookDetails',
      },
      {
        $unwind: '$bookDetails.genre',
      },
      {
        $group: {
          _id: '$bookDetails.genre',
          bookCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'genres',
          localField: '_id',
          foreignField: 'name',
          as: 'genreDetails',
        },
      },
      {
        $unwind: '$genreDetails',
      },
      {
        $project: {
          _id: 0,
          genre: '$_id',
          bookCount: 1,
          genreDetails: {
            name: '$genreDetails.name',
            category: '$genreDetails.category',
          },
        },
      },
    ]);

    const fictionNonFictionCount = booksByGenre
      .filter(
        (genre) =>
          genre.genreDetails.category === 'Fiction' ||
          genre.genreDetails.category === 'Non-Fiction'
      )
      .reduce((sum, genre) => sum + genre.bookCount, 0);
    const academicLeisureCount = booksByGenre
      .filter(
        (genre) =>
          genre.genreDetails.category === 'Academic' ||
          genre.genreDetails.category === 'Leisure'
      )
      .reduce((sum, genre) => sum + genre.bookCount, 0);

    const fictionBooksCount = booksByGenre
      .filter((genre) => genre.genreDetails.category === 'Fiction')
      .reduce((sum, genre) => sum + genre.bookCount, 0);
    const nonFictionBooksCount = booksByGenre
      .filter((genre) => genre.genreDetails.category === 'Non-Fiction')
      .reduce((sum, genre) => sum + genre.bookCount, 0);
    const academicBooksCount = booksByGenre
      .filter((genre) => genre.genreDetails.category === 'Academic')
      .reduce((sum, genre) => sum + genre.bookCount, 0);
    const leisureBooksCount = booksByGenre
      .filter((genre) => genre.genreDetails.category === 'Leisure')
      .reduce((sum, genre) => sum + genre.bookCount, 0);

    const fictionPercentage = fictionNonFictionCount
      ? (fictionBooksCount / fictionNonFictionCount) * 100
      : 0;
    const nonFictionPercentage = fictionNonFictionCount
      ? (nonFictionBooksCount / fictionNonFictionCount) * 100
      : 0;
    const academicPercentage = academicLeisureCount
      ? (academicBooksCount / academicLeisureCount) * 100
      : 0;
    const leisurePercentage = academicLeisureCount
      ? (leisureBooksCount / academicLeisureCount) * 100
      : 0;

    res.status(200).json({
      message: 'Analytics retrieved successfully',
      userBooksCount,
      booksBySource,
      booksByGenre,
      fictionPercentage,
      nonFictionPercentage,
      academicPercentage,
      leisurePercentage,
    });
  } catch (error) {
    next(error);
  }
};
