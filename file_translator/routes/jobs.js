import express from 'express';
import { 
    createJob, 
    getJobsByCustomer, 
    getJobForCustomer, 
} from '../models/job.js'; 
import authMiddleware from '../middlewares/auth.js';
import { supabase, BUCKET_NAME } from '../config/supabase.js';
import { z } from 'zod';

const router = express.Router();

const JobSchema = z.object({
  originalFileKey: z.string().min(1, "Original file key is required."), 

  sourceLang: z.string().min(2).optional().default('en'),
  targetLang: z.string().min(2).optional().default('am'),
  pagesEstimate: z.number().int().positive().optional().default(1),
  urgencyDays: z.number().int().positive().optional().default(3),
});

router.post('/upload-url', authMiddleware, async (req, res) => {
    try {
        const { fileExtension } = req.body;
        if (!fileExtension || typeof fileExtension !== 'string') {
            return res.status(400).json({ error: 'Missing fileExtension in body.' });
        }

        const userId = req.user.id;
        const fileKey = `${userId}/${Date.now()}.${fileExtension.replace('.', '')}`;
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUploadUrl(fileKey);

        if (error) {
            console.error('Supabase Signed Upload URL Error:', error);
            throw error;
        }
        return res.json({ 
            success: true, 
            fileKey: fileKey, 
            signedUploadUrl: data.signedUrl 
        });

    } catch (err) {
        console.error('Upload URL error', err);
        return res.status(500).json({ error: 'Failed to generate upload link.' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const validationResult = JobSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: validationResult.error.issues 
            });
        }

        const { 
            originalFileKey,
            sourceLang,
            targetLang,
            pagesEstimate,
            urgencyDays,
        } = validationResult.data; 
   
        const job = await createJob({
            customerId: req.user.id, 
            originalFileKey, 
            sourceLang, 
            targetLang, 
            pagesEstimate, 
            urgencyDays
        });

        return res.status(201).json({ 
            job: { 
                id: job.id, 
                job_uuid: job.job_uuid, 
                status: job.status, 
                createdAt: job.created_at 
            } 
        });
    } catch (err) {
        console.error('Create job error', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.get('/', authMiddleware , async (req, res) => {
    try {
        const jobs = await getJobsByCustomer(req.user.id);
        return res.json(jobs);
    } catch (err) {
        console.error('List jobs error', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', authMiddleware , async (req, res) => {
    try {
        const internalJobId = req.params.id; 
        const customerId = req.user.id;
        const job = await getJobForCustomer(internalJobId, customerId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found or access denied.' });
        }

        return res.json(job);
    } catch (err) {
        console.error('Get job error', err);
        return res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id/download', authMiddleware, async (req, res) => {
    try {
        const internalJobId = req.params.id;
        const customerId = req.user.id;
        const job = await getJobForCustomer(internalJobId, customerId);

        if (!job) return res.status(404).json({ error: 'Job not found or access denied.' });
        
        if (job.status !== 'completed' && job.status !== 'ready_for_review') {
            return res.status(403).json({ error: `File not yet available for download. Current status: ${job.status}` });
        }
        
        const fileKey = job.translated_file_key;
        if (!fileKey) {
            return res.status(404).json({ error: 'Translated file not found on job record.' });
        }
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(fileKey, 900);

        if (error) throw error;
        return res.redirect(data.signedUrl);

    } catch (err) {
        console.error('Download error', err);
        res.status(500).json({ error: 'File download failed' });
    }
});


export default router;