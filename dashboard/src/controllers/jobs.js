import { getjobByStatus ,updateJobStatus ,getJobById } from "../models/job.js";
import path from "path";
import fs from "fs";

export const getJobs = async (req,res) =>{
try {
    const status = req.query.status || 'created';
    const result = await getjobByStatus(status);
    return res.json(result);
} catch (err) {
    console.error('get job error', err); 
    return res.status(500).json({ error: 'server error' });
}
}

export const downloadJobFile = async (req,res) =>{
    try {
        const id= req.params.id;
        const job= await getJobById(id);

        if (job.length===0) return res.status(404).json({message: 'job doesnt exist'});

        const originalFileKey= job[0].original_file_key;
        const absolutePath= path.resolve(process.cwd(),'uploads',originalFileKey,);

      if(fs.existsSync(absolutePath)){
        res.download(absolutePath);
      }
      else return res.status(404).json({message: 'path doesnt exist'});

    } catch (err) {
        console.error('file download error', err); 
    return res.status(500).json({ error: 'server error' });
    }
}

export const submitWork = async (req,res) =>{
    try {
        if(!req.file || !req.body.price) return res.status(400).json({message:'invalid request'})
          const price= req.body.price;
          const jobId= req.params.id;
          const translated_file_key= req.file.path;
          const newStatus=  'awaiting_payment' ;

          await updateJobStatus(jobId,newStatus,price,translated_file_key)

          return res.status(200).json({message:'job updated successfully'})

    } catch (err) {
        console.error('file update error', err); 
    return res.status(500).json({ error: 'server error' });
    }
}

