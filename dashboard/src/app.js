import express from "express"; // Fixed typo: 'expres' -> 'express'
import cors from "cors";
import multer from "multer";
import path from 'path';
import authRouter from './routes/auth.js';
import jobRouter from './routes/jobManagement.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express(); 

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.DASHBOARD_UPLOAD_PATH || 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({ 
  storage,
  limits: { 
    fileSize: 1024 * 1024 * 5, 
    files: 1 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
    }
  }
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', jobRouter);

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

export default app;