import express from "express";
import cors from "cors";
import authRouter from './routes/auth.js';
import jobRouter from './routes/jobManagement.js';

import dotenv from 'dotenv';
dotenv.config();

const app = express(); 

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', jobRouter);

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

export default app;
