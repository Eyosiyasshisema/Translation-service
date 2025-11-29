import express from 'express';
import { createJob, getJobsByCustomer } from '../models/job.js'; 
import authMiddleware from '../middlewares/auth.js';
import { z } from 'zod';
import { pool } from '../config/db.js'; 

const router = express.Router();
const JobSchema = z.object({
  originalFileKey: z.string().min(1, "Original file key is required."),
  sourceLang: z.string().min(2).optional().default('en'),
  targetLang: z.string().min(2).optional().default('am'),
  pagesEstimate: z.number().int().positive().optional().default(1),
  urgencyDays: z.number().int().positive().optional().default(3),
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
    const id = req.params.id; 
    const customerId = req.user.id;
    const { rows } = await pool.query(
        `SELECT id, job_uuid, status, source_lang, target_lang, pages_estimate, urgency_days, price, created_at, original_file_key, translated_file_key 
         FROM jobs 
         WHERE id = $1 AND customer_id = $2`, 
        [id, customerId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Job not found or access denied.' });
    }
    const job = rows[0];
    return res.json(job);
  } catch (err) {
    console.error('Get job error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;