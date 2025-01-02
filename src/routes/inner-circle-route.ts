import { Router } from 'express';
import {
  createInnerCircle,
  removeUserFromInnerCircle,
  sendInvitation,
  fetchInnerCircleMembers,
  addGenreToInnerCircle,
  removeGenreFromInnerCircle,
  addBookToInnerCircle,
  removeBookFromInnerCircle,
  deleteInnerCircle,
  makeMemberAdmin,
  removeMemberAdmin,
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
innerCircleRouter.post('/add-genre', isAuthenticated, addGenreToInnerCircle);
innerCircleRouter.post(
  '/remove-genre',
  isAuthenticated,
  removeGenreFromInnerCircle
);
innerCircleRouter.post('/add-book', isAuthenticated, addBookToInnerCircle);
innerCircleRouter.post(
  '/remove-book',
  isAuthenticated,
  removeBookFromInnerCircle
);
innerCircleRouter.delete('/delete', isAuthenticated, deleteInnerCircle);
innerCircleRouter.post('/make-admin', isAuthenticated, makeMemberAdmin);
innerCircleRouter.post('/remove-admin', isAuthenticated, removeMemberAdmin);

export default innerCircleRouter;
