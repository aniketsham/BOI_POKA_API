import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface Admin extends Document {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
  role: string;
  isActive: boolean;
  isDeleted: boolean;
  verifiedBy: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  deactivatedBy?: string;
  deactivatedAt?: Date;
  deletedAt?: Date;
  deletedBy?: string;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

const adminSchema: Schema<Admin> = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'Admin' },
  isActive: { type: Boolean, default: true },
  isDeleted: {type: Boolean, default: false},
  verifiedBy: { type: String },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deactivatedBy: { type: String },
  deactivatedAt: { type: Date },
  deletedAt: { type: Date },
  deletedBy: { type: String },
});

adminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});


adminSchema.methods.comparePassword = function (
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model<Admin>('Admin', adminSchema);

export default Admin;