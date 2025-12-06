import { supabase } from '../config/supabase.js';

export async function getJobByUuid(jobUuid) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('job_uuid', jobUuid)
    .single();

  if (error) return null;
  return data;
}

export async function getJobsByStatus(status) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', status) 
    .order('created_at', { ascending: true }); 

  if (error) {
    console.error("Error fetching jobs by status:", error);
    throw error; 
  }
  return data; 
}

export async function getAvailableJobs() {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'created') 
        .is('assigned_company_id', null) 
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching available jobs:", error);
        throw error;
    }
    
    return data;
}

export async function updateJobSubmission(jobId, price, translatedFileKey) {
  const { data, error } = await supabase
    .from('jobs')
    .update({
      status: 'awaiting_payment',
      price: price,
      translated_file_key: translatedFileKey
    })
    .eq('job_uuid', jobId) 
    .select()
    .single();

  if (error) throw error;
  return data;
}