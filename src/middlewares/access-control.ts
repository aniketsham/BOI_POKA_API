import { NextFunction, Response, RequestHandler } from 'express';
import { CustomRequest } from '../types/types';
import { Admin } from '../models/admin-model';
export const accessControl = (access: string): RequestHandler => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user || !req.user.role) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (req.user.role === 'User') {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      if (req.user.role === 'SuperAdmin') {
        next();
        return;
      }

      if (req.user.role === 'Admin') {
        const admin = req.user as Admin;
        if (Array.isArray(admin.accessTo) && admin.accessTo.includes(access)) {
          next();
          return;
        }
      }

      res.status(403).json({ message: 'Access denied' });
    } catch (error) {
      next(error);
    }
  };
};
