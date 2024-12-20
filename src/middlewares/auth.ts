import { Response, Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserModel } from '../models/user-model';
import { Admin } from '../models/admin-model';
import { CustomRequest } from '../types/types';
export const isAuthenticated = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.body.token;

  if (!token) {
    res.status(401).json({
      error: 'No token provided, access denied, Please login',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    const { id } = decoded as { id: string };

    const user = await User.findOne({
      _id: id,
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = user;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    console.log(error);
  }
};
