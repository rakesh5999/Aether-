import express from "express";
import { getAdminMetrics } from "../controller/admin.controller.js";

const router = express.Router();

router.get("/metrics", getAdminMetrics);

export default router;
