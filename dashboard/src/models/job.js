import { pool } from '../config/db.js';

export async function getjobByStatus(status) {
  const { rows } = await pool.query(
    `SELECT id, job_uuid, status, source_lang, target_lang, pages_estimate, urgency_days, price, created_at
     FROM jobs
     WHERE status = $1
     ORDER BY created_at DESC`,
    [status]
  );
  return rows;
} 

export async function updateJobStatus(jobId, newStatus, price, translated_file_key) {
  const { rows } = await pool.query(
    `UPDATE jobs 
     SET status = $2, price = $3, translated_file_key = $4
     WHERE id = $1
     RETURNING id, job_uuid, status, price`,
    [jobId, newStatus, price, translated_file_key]
  );
  return rows[0];
}

export async function getJobById(id) {
  const { rows } = await pool.query(
    `SELECT id, job_uuid, original_file_key, assigned_company_id, status, price, created_at
     FROM jobs
     WHERE id = $1`,
    [id]
  );
  return rows;
}