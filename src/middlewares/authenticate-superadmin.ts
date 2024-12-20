import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import SuperAdmin from '../models/superadmin-model';

export const authenticateSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.body.token;
  console.log(req.body);

  if (!token) {
    res
      .status(401)
      .json({
        error: 'No token provided, access denied, Please login as SuperAdmin',
      });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    const { role } = decoded as { role: string };


    if (role !== 'SuperAdmin') {
      res.status(400).json({ error: 'Restricted Access' });
      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    console.log("Authentication Error:", error);
  }
};
