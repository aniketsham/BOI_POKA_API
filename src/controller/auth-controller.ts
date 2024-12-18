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

export const handleLinkedinLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, email, name, picture, sub } = req.body;

    let user = await User.findOne({ email });

    if(!user) {
      user = await User.create({
        fullName: name,
        email,
        mobileNumber: '',
        profileImage: picture,
        userType: 'user',
        socialProvider: [
          {
            id: sub,
            provider: 'linkedin',
            email,
          },
        ],
        isVerified: true,
      });

      await user.save()
    } else {
        const providerExists = user.socialProvider.some(
          (provider) => provider.provider === 'linkedin'
        );

        if (!providerExists) {
        user.socialProvider.push({
          id: sub,
          provider: 'linkedin',
          email,
        });

        await user.save();
      }
    }

    res.status(200).json({
      message: 'Login successful by LinkedIn',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};
