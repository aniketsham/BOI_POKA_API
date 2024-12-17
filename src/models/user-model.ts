import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface User extends Document {
  fullName: string;
  mobileNumber: string;
  email: string;
  password: string;
  userType: string;
  genre: string[];
  friends: string[];

  createdAt: Date;
  updatedAt: Date;

  deactivatedBy?: string; 
  deactivatedAt?: Date; 

  isActive: boolean;
  isVerified: boolean;

  isDeleted: boolean;
  deletedAt?: Date; 
  deletedBy?: string; 

  notificationToken: string;
  favourites: string[];
}

const userSchema: Schema<User> = new mongoose.Schema({
  fullName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true }, 
  password: {
    type: String,
    required: true,
  },
  userType: { type: String, required: true },
  genre: [{ type: String }],
  friends: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  deactivatedBy: { type: String },
  deactivatedAt: { type: Date },

  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  isDeleted: { type: Boolean, default: false },

  deletedAt: { type: Date },
  deletedBy: { type: String },

  notificationToken: { type: String },

  favourites: [{ type: String }],
});

//? Pre-save middleware to handle updatedAt field
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<User>('User', userSchema);

export default User;
