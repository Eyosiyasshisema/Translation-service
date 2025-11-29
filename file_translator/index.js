import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js'; 
import authRoutes from './routes/auth.js';
import filesRoutes from './routes/files.js';
import jobsRoutes from './routes/jobs.js';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
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