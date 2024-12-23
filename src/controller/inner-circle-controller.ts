import {  Response, NextFunction } from "express";
import InnerCircle from "../models/inner-circle";
import { UserModel } from "../models/user-model";
import { CustomRequest } from "../types/types";

export const createInnerCircle = async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
) => {
    try{
        const {_id:userId}= req.user  as UserModel;
        const {circleName, circleGenre, ISBN} = req.body;
        if(!userId || !circleName || !circleGenre){
            res.status(400).json({error: "Please provide all the required fields"});
            return;
        }

        const newInnerCircle = new InnerCircle({
            circleName,
            circleGenre,
            members: [
                {
                    userId,
                    role: "Admin",
                    createdBy: userId,
                    addedBy: userId
                }
            ],
            ISBN
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