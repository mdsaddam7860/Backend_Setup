// require("dotenv").config({ path: "/.env" });
import { app } from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.log("Error connecting to the database: ", err);
  });

/*
import express from "express";

const app = express();

(async () => {
  try {
    await mongoose.connect(`${processs.env.DATABASE_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("Error DB COnnection: ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log("Error : ", error);
    throw error;
  }
})(); // IIFE ()() execute the function immediately
*/
