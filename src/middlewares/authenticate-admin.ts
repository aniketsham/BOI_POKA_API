import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin-model';

export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
    const token = req.body.token;
    console.log(req.body)

    if (!token) {
      res
        .status(401)
        .json({ error: 'No token provided, access denied, Please login as Admin' });
        return
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        const {id} = decoded as {id: string};

        const user = await Admin.findOne({
            _id: id
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        if(user.role !== "Admin"){
            res.status(400).json({error: "Restricted Access"});
            return
        }
        
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
        console.log(error)
    }
};