import { getAvailableJobs, getJobByUuid, updateJobSubmission } from '../models/job.js';
import { supabase, BUCKET_NAME } from '../config/supabase.js'; 

export const getJobs = async (req, res) => {
    try {
        const availableJobs = await getAvailableJobs();
        res.json({
            success: true,
            count: availableJobs.length,
            jobs: availableJobs
        });

    } catch (err) {
        console.error('Error in getJobs controller:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Could not fetch available jobs due to a server error.' 
        });
    }
};

export const downloadJobFile = async (req, res) => {
  try {
    const jobUuid = req.params.id;
    const job = await getJobByUuid(jobUuid);

    if (!job) return res.status(404).json({ error: 'Job not found' });

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(job.original_file_key, 900); 

    if (error) throw error;
    return res.redirect(data.signedUrl);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Download failed' });
  }
};

export const submitWork = async (req, res) => {
  try {
    if (!req.file || !req.body.price) return res.status(400).json({ error: 'Missing file or price' });

    const jobUuid = req.params.id;
    const filename = `${jobUuid}/translated_${Date.now()}.pdf`;
    const filePath = `translated/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) throw uploadError;
    const updatedJob = await updateJobSubmission(jobUuid, req.body.price, filePath);

    res.json({ success: true, job: updatedJob });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed' });
  }
};