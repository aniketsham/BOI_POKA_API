import mongoose, {Schema, Document} from "mongoose";

interface Member {
    userId: mongoose.Schema.Types.ObjectId;
    role: string;
    createdAt: Date;
    createdBy: string;
    addedAt: Date;
    addedBy: mongoose.Schema.Types.ObjectId;
    removedAt?: Date
}

export interface InnerCircleInterface extends Document {
    userId: mongoose.Schema.Types.ObjectId;
    circleName: string;
    circleDescription: string;
    circleGenre: string[]
    members: Member[];
    ISBN: string;
}

const MemberSchema: Schema = new Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    role: {type:String, required: true, enum: ["Admin", "Member"], default: "Member"},
    createdAt: {type: Date, default: Date.now},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    addedAt: {type: Date, default: Date.now},
    addedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    removedAt: {type: Date}
})

const InnerCircleSchema: Schema = new Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    circleName: {type: String, required: true, unique: true},
    circleDescription: {type: String},
    circleGenre: {type: [String], required: true},
    members: {type: [MemberSchema], required: true},
    ISBN: {type: String, 
    ref: "UserBook", required: true}
})

export default mongoose.model<InnerCircleInterface>("InnerCircle", InnerCircleSchema);