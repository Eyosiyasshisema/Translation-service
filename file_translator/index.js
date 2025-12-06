import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        message: 'Server is running smoothly ',
        timestamp: new Date(),
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(` Server listening on port ${PORT}`);
});