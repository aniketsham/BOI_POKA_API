import {body} from "express-validator"

export const registerValidation = [
    body('fullName').isLength({min: 3}).withMessage("Name must be at least 3 characters long"),
    body('email').isEmail().withMessage("Invalid Email Format"),
    body('mobileNumber').isString().isLength({min: 10}).withMessage("Mobile Number must be at least 10 characters long"),
    body('password').isLength({min: 8}).withMessage("Password must be at least 8 characters long"),
    
]

