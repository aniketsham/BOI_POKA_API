import { Response, Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserModel } from '../models/user-model';
import Admin from '../models/admin-model';
import { CustomRequest } from '../types/types';
import SuperAdmin from '../models/superadmin-model';
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
    const { id, role } = decoded as { id: string; role: string };

    if (role === 'User') {
      const user = await User.findOne({
        _id: id,
      });

      if (!user) {
        console.log('user');
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
      req.user = user;
    } else if (role === 'Admin') {
      const admin = await Admin.findOne({
        _id: id,
      });

      if (!admin) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
      req.user = admin;
    } else if (role === 'SuperAdmin') {
      const admin = await SuperAdmin.findOne({
        _id: id,
      });

      if (!admin) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
      req.user = admin;
    } else {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    console.log(error);
  }
};
