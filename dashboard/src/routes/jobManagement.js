import express from "express";
import auth from "../middlewares/auth.js";
import * as jobController from "../controllers/jobs.js";

const jobRouter= express.Router();

jobRouter.get("/getjobs",auth,jobController.getJobs);
jobRouter.get("/:id/download",auth,jobController.downloadJobFile);
jobRouter.put("/:id/submit",auth,jobController.submitWork);

export default jobRouter;