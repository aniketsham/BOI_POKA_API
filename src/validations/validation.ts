import { body } from 'express-validator';

export const registerValidation = [
  body('fullName')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters long'),
  body('email').isEmail().withMessage('Invalid Email Format'),
  body('mobileNumber')
    .isString()
    .isLength({ min: 10 })
    .withMessage('Mobile Number must be at least 10 characters long'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

export const registerAdminValidator = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 3 })
    .withMessage('Full name should be at least 3 characters long'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),

  body('mobileNumber')
    .notEmpty()
    .withMessage('Mobile number is required')
    .withMessage('Please provide a valid mobile number'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password should be at least 6 characters long'),
];