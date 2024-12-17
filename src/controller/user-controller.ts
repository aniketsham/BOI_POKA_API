import {Request, Response} from "express";
import User from "..models/user-model";

//? Get All users route
export const getAllUsers = async(req: Request, res: Response) => {
    try {
        const users = await User.find()
        res.status(200).json(users)
    } catch (error) {
        res.status(500).json({error: "Failed to fetch users"})
    }
}

//? Get user by id


