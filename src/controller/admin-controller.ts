import { Request, Response, NextFunction } from 'express';
import Admin from '../models/admin-model';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { CustomRequest } from '../types/types';
import mongoose from 'mongoose';

import Book from '../models/book-model';
import User from '../models/user-model';
import InnerCircle from '../models/inner-circle';
import UserBook from '../models/userbook-model';
import Genre from '../models/genre-model';

export const registerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { fullName, email, mobileNumber, password, accessTo } = req.body;
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
      accessTo,
    });
    await newAdmin.save();

    res.status(201).json({
      message: 'Admin registered successfully',
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
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      res.status(401).json({ error: 'Invalid Credentials' });
      return;
    }
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid Credentials' });
      return;
    }
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );
    res.status(200).json({
      message: 'Login successful',
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
      user,
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
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userIds } = req.body; // Expecting an array of userIds
    const deletedBy = req.user?._id as mongoose.Types.ObjectId;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res
        .status(400)
        .json({ error: 'User IDs are required and should be an array' });
      return;
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedBy,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (result.modifiedCount === 0) {
      res.status(404).json({ error: 'No users found to delete' });
      return;
    }

    res
      .status(200)
      .json({ message: 'Users marked as deleted successfully', result });
  } catch (error) {
    next(error);
  }
};

export const getAllBooks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const books = await Book.find();
    res.status(200).json({
      message: 'Books retrieved successfully',
      books,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBookFromUserBook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const { libraryName, bookId } = req.body;

    if (!libraryName || !bookId) {
      res
        .status(400)
        .json({ message: 'Library name and book ID are required' });
      return;
    }

    // Update query to target any shelf within the library
    const updatedUserBook = await UserBook.findOneAndUpdate(
      {
        user: userId,
        'libraries.libraryName': libraryName,
      },
      {
        $pull: {
          'libraries.$[lib].shelves.$[].books': { bookId },
        },
      },
      {
        arrayFilters: [{ 'lib.libraryName': libraryName }],
        new: true,
      }
    );

    if (!updatedUserBook) {
      res.status(404).json({
        message: 'Book not found in any shelf of the specified library',
      });
      return;
    }

    res.status(200).json({
      message: 'Book deleted successfully from the user library',
      userBook: updatedUserBook,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserBookProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const { libraryName, bookId, readProgress } = req.body;

    if (!libraryName || !bookId || readProgress === undefined) {
      res
        .status(400)
        .json({ message: 'Library name, book ID, and progress are required' });
      return;
    }

    const userBook = await UserBook.findOneAndUpdate(
      {
        user: userId,
        'libraries.libraryName': libraryName,
      },
      {
        $set: {
          'libraries.$[lib].shelves.$[].books.$[book].readProgress':
            readProgress,
        },
      },
      {
        arrayFilters: [
          { 'lib.libraryName': libraryName },
          { 'book.bookId': bookId },
        ],
        new: true,
      }
    );

    if (!userBook) {
      res.status(404).json({ message: 'User book not found' });
      return;
    }

    res.status(200).json({
      message: 'Book progress updated successfully',
      userBook,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserBookStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const { libraryName, bookId, status } = req.body;

    if (!libraryName || !bookId || !status) {
      res
        .status(400)
        .json({ message: 'Library name, book ID, and status are required' });
      return;
    }

    const userBook = await UserBook.findOneAndUpdate(
      {
        user: userId,
        'libraries.libraryName': libraryName,
      },
      {
        $set: {
          'libraries.$[lib].shelves.$[].books.$[book].status': status,
        },
      },
      {
        arrayFilters: [
          { 'lib.libraryName': libraryName },
          { 'book.bookId': bookId },
        ],
        new: true,
      }
    );

    if (!userBook) {
      res.status(404).json({ message: 'User book not found' });
      return;
    }

    res.status(200).json({
      message: 'Book status updated successfully',
      userBook,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserLibrary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.userId;
    const { libraryName } = req.body;

    if (!libraryName) {
      res.status(400).json({ message: 'Library name is required' });
      return;
    }

    const userBook = await UserBook.findOneAndUpdate(
      { user: userId },
      {
        $pull: {
          libraries: { libraryName },
        },
      },
      { new: true }
    );

    if (!userBook) {
      res.status(404).json({ message: 'Library not found' });
      return;
    }

    res.status(200).json({
      message: 'Library deleted successfully',
      userBook,
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userIds } = req.body; // Expecting an array of userIds
    const deactivatedBy = req.user?._id as mongoose.Types.ObjectId;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res
        .status(400)
        .json({ error: 'User IDs are required and should be an array' });
      return;
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (result.modifiedCount === 0) {
      res.status(404).json({ error: 'No users found to deactivate' });
      return;
    }

    res.status(200).json({ message: 'Users deactivated successfully', result });
  } catch (error) {
    next(error);
  }
};

export const activateUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userIds } = req.body; // Expecting an array of userIds

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res
        .status(400)
        .json({ error: 'User IDs are required and should be an array' });
      return;
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      {
        isActive: true,
        deactivatedAt: null,
        deactivatedBy: null,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (result.modifiedCount === 0) {
      res.status(404).json({ error: 'No users found to activate' });
      return;
    }

    res.status(200).json({ message: 'Users activated successfully', result });
  } catch (error) {
    next(error);
  }
};

export const getDashboardData = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Total books from Book collection
    const totalBooks = await Book.countDocuments();

    // Total users from User collection
    const totalUsers = await User.countDocuments();

    // Number of Inner Circles from InnerCircle collection
    const totalInnerCircles = await InnerCircle.countDocuments();

    // Books added into Books in the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const booksAddedLastMonth = await Book.countDocuments({
      addedAt: { $gte: lastMonth },
    });

    // Pie Chart Data of Genre
    const genreDistribution = await Book.aggregate([
      { $unwind: '$genre' },
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 },
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
      { $unwind: '$genreDetails' },
      {
        $project: {
          _id: 0,
          genre: '$_id',
          count: 1,
          category: '$genreDetails.category',
        },
      },
    ]);

    const bookTypeDistribution = await UserBook.aggregate([
      { $unwind: '$libraries' },
      { $unwind: '$libraries.shelves' },
      { $unwind: '$libraries.shelves.books' },
      {
        $group: {
          _id: '$libraries.shelves.books.source.sourceType',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          type: '$_id',
          count: 1,
        },
      },
    ]);

    // Source name distribution from UserBook
    const sourceNameDistribution = await UserBook.aggregate([
      { $unwind: '$libraries' },
      { $unwind: '$libraries.shelves' },
      { $unwind: '$libraries.shelves.books' },
      {
        $group: {
          _id: '$libraries.shelves.books.source.sourceName',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          sourceName: '$_id',
          count: 1,
        },
      },
    ]);

    const topBooks = await UserBook.aggregate([
      { $unwind: '$libraries' },
      { $unwind: '$libraries.shelves' },
      { $unwind: '$libraries.shelves.books' },
      {
        $group: {
          _id: '$libraries.shelves.books.bookId',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookDetails',
        },
      },
      {
        $unwind: {
          path: '$bookDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          bookId: '$_id',
          title: '$bookDetails.title',
          author: '$bookDetails.author',
          count: 1,
        },
      },
    ]);

    const topBooksSet = new Set(topBooks.map((book) => book.bookId.toString()));
    while (topBooks.length < 5) {
      const randomBook = await Book.aggregate([{ $sample: { size: 1 } }]);
      const randomBookId = randomBook[0]._id.toString();
      if (!topBooksSet.has(randomBookId)) {
        topBooks.push({
          bookId: randomBook[0]._id,
          title: randomBook[0].title,
          author: randomBook[0].author,
          count: 0,
        });
        topBooksSet.add(randomBookId);
      }
    }

    // Mark the rest of the books as "Others"
    const knownGenres = genreDistribution.map((genre) => genre.genre);
    const otherBooksCount = await Book.countDocuments({
      genre: { $nin: knownGenres },
    });

    genreDistribution.push({
      genre: 'Others',
      count: otherBooksCount,
      category: 'Others',
    });

    res.status(200).json({
      totalBooks,
      totalUsers,
      totalInnerCircles,
      booksAddedLastMonth,
      genreDistribution,
      bookTypeDistribution,
      sourceNameDistribution,
      topBooks,
    });
  } catch (error) {
    next(error);
  }
};
