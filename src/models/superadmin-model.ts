import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface SuperAdmin extends Document {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(enteredPassword: string): Promise<boolean>
}

const superAdminSchema: Schema<SuperAdmin> = new mongoose.Schema({
    fullName: { type: String, default: "Super Admin Sohail" },
    email: {type: String, default: "superadmin@digitalsalt.in", unique: true},
    mobileNumber: { type: String, default: "8976084230" },
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'SuperAdmin' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

superAdminSchema.pre("save", async function (next) {
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10)
    }
    next()
})

superAdminSchema.methods.comparePassword = function (
  enteredPassword: string
): Promise<boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

const SuperAdmin = mongoose.model<SuperAdmin>('SuperAdmin', superAdminSchema);

export default SuperAdmin