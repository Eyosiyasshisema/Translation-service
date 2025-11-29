import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url'; 
import { z } from 'zod';
import authMiddleware from '../middlewares/auth.js';
import { createJob } from '../models/job.js'; 
import { pool } from '../config/db.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads'); 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${req.user.id}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({ 
    storage,
    limits: { 
        fileSize: 1024 * 1024 * 5, 
        files: 1 
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDF, and DOCX files are allowed.'), false);
        }
    }
});

const JobMetadataSchema = z.object({
    sourceLang: z.string().min(2, "Source language is required."),
    targetLang: z.string().min(2, "Target language is required."),
    pagesEstimate: z.preprocess(
        (a) => parseInt(a),
        z.number().int().positive().optional().default(1)
    ),
    urgencyDays: z.preprocess(
        (a) => parseInt(a),
        z.number().int().positive().optional().default(3)
    ),
});

const router= express.Router();
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        const validationResult = JobMetadataSchema.safeParse(req.body);
        if (!validationResult.success) {
            if (req.file) {
                console.warn(`Validation failed, file uploaded to ${req.file.path} needs manual cleanup.`);
            }
            return res.status(400).json({ 
                error: 'Job metadata validation failed', 
                details: validationResult.error.issues 
            });
        }
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const { sourceLang, targetLang, pagesEstimate, urgencyDays } = validationResult.data;
        const newJob = await createJob({
            customerId: req.user.id,
            originalFileKey: req.file.path, 
            sourceLang,
            targetLang,
            pagesEstimate,
            urgencyDays,
        });
        res.json({ 
            success: true, 
            message: 'File uploaded and job created successfully', 
            job: {
                id: newJob.id,
                job_uuid: newJob.job_uuid,
                status: newJob.status,
            } 
        });
    } catch (err) {
        console.error('Upload and Job Creation error', err);
        res.status(500).json({ success: false, message: 'Upload and Job Creation failed', error: err.message });
    }
});

router.get('/download/:jobId', authMiddleware, async (req, res) => {
    try {
        const jobId = req.params.jobId;

        const { rows } = await pool.query(
            `SELECT translated_file_key, status
             FROM jobs
             WHERE job_uuid = $1 AND customer_id = $2`,
            [jobId, req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Job not found or access denied.' });
        }

        const job = rows[0];

        if (job.status !== 'completed') {
            return res.status(403).json({ error: 'Translation not yet completed or pending payment.' });
        }
        
        const filePath = job.translated_file_key;
        
        if (!filePath) {
            return res.status(404).json({ error: 'Translated file path missing.' });
        }

        res.download(filePath, (err) => {
            if (err) {
                console.error('Error serving file:', err);
                res.status(500).json({ error: 'Could not download the file.' });
            }
        });

    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Server error during download.' });
    }
});


export default router;