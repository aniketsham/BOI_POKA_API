import express from "express";
import dotenv from "dotenv";
const app = express();
dotenv.config();
const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello BOI POKA");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
