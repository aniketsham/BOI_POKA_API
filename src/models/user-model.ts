import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface SocialProvider {
  id: string;
  provider: string;
  email: string;
}

export interface UserModel extends Document {
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
  userType: string;
  role: string;
  genre: string[];
  friends: string[];
  innerCircle: string[];
  invites: string[];
  createdAt: Date;
  updatedAt: Date;

  deactivatedBy?: string;
  deactivatedAt?: Date;

  isActive: boolean;
  isVerified: boolean;

  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;

  notificationToken: string;
  favourites: string[];
  profileImage: string;
  socialProvider: SocialProvider[];

  comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema: Schema<UserModel> = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobileNumber: {
    type: String,
    required: function () {
      return !this.socialProvider || this.socialProvider.length === 0;
    },
  },
  email: { type: String, required: true },
  password: {
    type: String,
    required: function () {
      return !this.socialProvider || this.socialProvider.length === 0;
    },
    select: false,
  },
  innerCircle: [{ type: String }],
  invites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InnerCircle' }],
  userType: { type: String, required: true },
  role: { type: String, required: false, default: 'User' },
  genre: [{ type: String }],
  friends: [{ type: String }],
  profileImage: { type: String },

  createdAt: { type: Date, default: Date.now, select: false },
  updatedAt: { type: Date, default: Date.now, select: false },

  deactivatedBy: { type: String, select: false },
  deactivatedAt: { type: Date, select: false },

  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },

  notificationToken: { type: String, select: false },

  favourites: [{ type: String }],
  socialProvider: [
    {
      id: { type: String, required: true },
      provider: { type: String, required: true },
      email: { type: String, required: true },
    },
  ],
});

//? Pre-save middleware to handle updatedAt field
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Define the comparePassword method
userSchema.methods.comparePassword = function (
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<UserModel>('User', userSchema);

export default User;
