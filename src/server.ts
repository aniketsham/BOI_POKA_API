import express from "express";
import dotenv from "dotenv";
import connectDB from './config/connect-db';
import userRouter from "./routes/user-route";

const app = express();
dotenv.config();
const PORT = process.env.PORT;
connectDB();

app.get("/", (req, res) => {
  res.send("Hello BOI POKA");
});

app.use('/api/users', userRouter); // Registering the router


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
