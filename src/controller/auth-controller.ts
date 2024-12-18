import { Request, Response, NextFunction } from 'express';
import User from '../models/user-model';

export const handleGoogleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { displayName, email, phoneNumber, photoUrl, uid } = req.body;

    if (!email || !uid) {
      res.status(400).json({ error: 'Invalid Data Receieved' });
      return;
    }

    let user = await User.findOne({
      email,
      'socialProvider.provider': 'google',
    });

    if (!user) {
      user = await User.create({
        fullName: displayName,
        email,
        mobileNumber: phoneNumber || '',
        profileImage: photoUrl,
        password: 'default',
        userType: 'user',
        socialProvider: [{ id: uid, provider: 'google', email }],
        isVerified: true,
      });
    }

    res.status(200).json({
      message: 'Login successfull by Google',
      user,
    });
  } catch (error) {
    next(error);
  }
};


