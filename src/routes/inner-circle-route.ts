import { Router } from 'express';
import { createInnerCircle } from '../controller/inner-circle-controller';
import { isAuthenticated } from '../middlewares/auth';

const innerCircleRouter = Router();

innerCircleRouter.post('/create', isAuthenticated, createInnerCircle);

export default innerCircleRouter;
