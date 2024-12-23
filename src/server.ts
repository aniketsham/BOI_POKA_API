import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connect-db';
import userRouter from './routes/user-route';
import bookRouter from './routes/book-route';
import adminRouter from './routes/admin-route';
import userBookRouter from './routes/user-book-route';
import superAdminRouter from './routes/superadmin-route';
import innerCircleRouter from './routes/inner-circle-route';

const app = express();
dotenv.config();
const PORT = process.env.PORT;
connectDB();

app.get('/', (req, res) => {
  res.send('Hello BOI POKA');
});

app.use(express.json());

app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/superadmin', superAdminRouter);
app.use('/api/book', bookRouter);
app.use('/api/userbook', userBookRouter);
app.use('/api/innercircle', innerCircleRouter);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
