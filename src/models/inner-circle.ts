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
    circleGenre: string[]
    members: Member[];
    ISBN: mongoose.Schema.Types.ObjectId;
}

const MemberSchema: Schema = new Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    role: {type:String, required: true, enum: ["Admin", "Member"], default: "Member"},
    createdAt: {type: Date, default: Date.now},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    addedAt: {type: Date, default: Date.now},
    addedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    removedAt: {type: Date}
})

const InnerCircleSchema: Schema = new Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    circleName: {type: String, required: true},
    circleGenre: {type: [String], required: true},
    members: {type: [MemberSchema], required: true},
    ISBN: {type: mongoose.Schema.Types.ObjectId, ref: "UserBook", required: true}
})

export default mongoose.model<InnerCircleInterface>("InnerCircle", InnerCircleSchema);