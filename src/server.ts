import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/connect-db';
import userRouter from './routes/user-route';
import bookRouter from './routes/book-route';
import adminRouter from './routes/admin-route';
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
app.use('/api/book', bookRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
