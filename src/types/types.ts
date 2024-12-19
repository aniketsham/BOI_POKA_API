import { Request } from 'express';
import { Admin } from '../models/admin-model';
import { UserModel } from '../models/user-model';
export interface CustomRequest extends Request {
  admin?: Admin;
  user?: UserModel;
}
