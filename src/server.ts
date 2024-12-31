import express from 'express';
import dotenv from 'dotenv';
import cron from 'node-cron';
import connectDB from './config/connect-db';
import userRouter from './routes/user-route';
import bookRouter from './routes/book-route';
import adminRouter from './routes/admin-route';
import userBookRouter from './routes/user-book-route';
import superAdminRouter from './routes/superadmin-route';
import innerCircleRouter from './routes/inner-circle-route';
import cors from 'cors';
import { deleteOutOfBoundsUsers } from './utils/cron-jobs';

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3333;
connectDB();

app.get('/', (req, res) => {
  res.send('Hello BOI POKA');
});
app.use(
  cors({
    origin: 'http://localhost:3000', // Replace with your frontend's origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    credentials: true, // If your frontend sends cookies
  })
);
app.use(express.json());

app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/superadmin', superAdminRouter);
app.use('/api/book', bookRouter);
app.use('/api/userbook', userBookRouter);
app.use('/api/innercircle', innerCircleRouter);

cron.schedule('0 0 * * *', deleteOutOfBoundsUsers);

console.log('Cron job scheduled to delete out-of-bounds users');

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
