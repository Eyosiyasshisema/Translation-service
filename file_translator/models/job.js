import { pool } from '../config/db.js'; 

export async function createJob({ customerId, originalFileKey, sourceLang, targetLang, pagesEstimate, urgencyDays }) {
  const { rows } = await pool.query(
    `INSERT INTO jobs (
        customer_id, 
        original_file_key, 
        source_lang, 
        target_lang, 
        pages_estimate, 
        urgency_days
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, job_uuid, status, created_at, customer_id`,
    [customerId, originalFileKey, sourceLang, targetLang, pagesEstimate, urgencyDays]
  );
  return rows[0];
}

export async function getJobsByCustomer(customerId) {
  const { rows } = await pool.query(
    `SELECT 
        id, 
        job_uuid, 
        status, 
        source_lang, 
        target_lang, 
        pages_estimate, 
        urgency_days, 
        price, 
        created_at,
        translated_file_key -- Include translated file path for customer download
     FROM jobs
     WHERE customer_id = $1
     ORDER BY created_at DESC`,
    [customerId]
  );
  return rows;
}