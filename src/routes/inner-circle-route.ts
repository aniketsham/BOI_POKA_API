import { Router } from 'express';
import {
  createInnerCircle,
  removeUserFromInnerCircle,
  sendInvitation,
  fetchInnerCircleMembers,
} from '../controller/inner-circle-controller';
import { isAuthenticated } from '../middlewares/auth';

const innerCircleRouter = Router();

innerCircleRouter.post('/create', isAuthenticated, createInnerCircle);
innerCircleRouter.post('/send-invitation', isAuthenticated, sendInvitation);
innerCircleRouter.post(
  '/remove-user',
  isAuthenticated,
  removeUserFromInnerCircle
);
innerCircleRouter.get(
  '/getMembers/:circleId',
  isAuthenticated,
  fetchInnerCircleMembers
);
export default innerCircleRouter;
