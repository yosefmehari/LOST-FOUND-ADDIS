import { Router } from "express";
import { getAdminStats } from "./admin.controller.js";
import { getAdminReports, updateReportStatus } from "../reports/reports.controller.js";
import { requireAdmin } from "../../middleware/auth.js";

const router = Router();

router.get("/stats", requireAdmin, getAdminStats);
router.get("/reports", requireAdmin, getAdminReports);
router.patch("/reports/:id", requireAdmin, updateReportStatus);

export default router;
