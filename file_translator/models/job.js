import { supabase } from '../config/supabase.js';

export async function fetchCompanies() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role','company' ) 
    .order('created_at', { ascending: true }); 

  if (error) {
    console.error("Error fetching companies:", error);
    throw error; 
  }
  return data; 
}

export async function createJob({ customerId, originalFileKey, sourceLang, targetLang, pagesEstimate, urgencyDays }) {
    const { data, error } = await supabase
        .from('jobs')
        .insert([{
            customer_id: customerId,
            original_file_key: originalFileKey,
            source_lang: sourceLang,
            target_lang: targetLang,
            pages_estimate: pagesEstimate,
            urgency_days: urgencyDays,
            status: 'created'
        }])
        .select() 
        .single(); 

    if (error) {
        console.error('Error creating job:', error);
        throw error;
    }
    return data;
}

export async function getJobsByCustomer(customerId) {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching jobs by customer:', error);
        throw error;
    }
    return data;
}

export async function getJobForCustomer(id, customerId) {
    const { data, error } = await supabase
        .from('jobs')
        .select(`
            id, 
            job_uuid, 
            status, 
            source_lang, 
            target_lang, 
            pages_estimate, 
            urgency_days, 
            price, 
            created_at, 
            original_file_key, 
            translated_file_key,
            assigned_company_id,
            updated_at 
        `)
        .eq('id', id)
        .eq('customer_id', customerId) 
        .single(); 

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error("Error fetching job for customer:", error);
        throw error;
    }

    return data;
}