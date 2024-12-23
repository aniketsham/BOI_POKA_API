import { Router } from 'express';
import {
  createInnerCircle,
  sendInvitation,
} from '../controller/inner-circle-controller';
import { isAuthenticated } from '../middlewares/auth';

const innerCircleRouter = Router();

innerCircleRouter.post('/create', isAuthenticated, createInnerCircle);
innerCircleRouter.post('/send-invitation', isAuthenticated, sendInvitation);

export default innerCircleRouter;
