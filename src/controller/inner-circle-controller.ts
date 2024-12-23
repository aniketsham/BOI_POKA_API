import { Request, Response, NextFunction } from "express";
import InnerCircle from "../models/inner-circle";
import mongoose from "mongoose";

export const createInnerCircle = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try{
        const {userId, circleName, circleGenre, ISBN} = req.body;
        if(!userId || !circleName || !circleGenre || !ISBN){
            res.status(400).json({error: "Please provide all the required fields"});
            return;
        }

        const newInnerCircle = new InnerCircle({
            userId: mongoose.Schema.Types.ObjectId,
            circleName,
            circleGenre,
            members: [
                {
                    userId: mongoose.Types.ObjectId,
                    role: "Admin",
                    createdBy: userId,
                    addedBy: userId
                }
            ],
            ISBN: mongoose.Types.ObjectId
        })

        const savedInnerCircle = await newInnerCircle.save();

        res.status(201).json({
            message: "Inner Circle created successfully",
            innerCircle: savedInnerCircle
        })
    } catch(error){
        next(error);
    }
}