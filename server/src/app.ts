import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/authRoute";

export const app = express();

// Middlewares:
app.use(json());
app.use(cors({
    credentials: true,
    origin: process.env.URL
}));
app.use(cookieParser());

// Routes:
app.use('/users', authRouter());