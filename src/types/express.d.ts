import { Request } from 'express';
import { Admin } from '../models/admin-model';
import User from '../models/user-model';
declare global {
  namespace Express {
    interface Request {
      admin?: Admin;
      user?: User;
    }
  }
}

export {};
