import express from "express";
import { getAdminMetrics, testAllModels } from "../controller/admin.controller.js";

const router = express.Router();

router.get("/metrics", getAdminMetrics);
router.get("/test-models", testAllModels);

export default router;
