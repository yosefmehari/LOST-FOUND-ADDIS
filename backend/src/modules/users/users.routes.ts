import { Router } from "express";
import { getProfile, updateProfile, markNotificationsAsRead } from "./users.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, getProfile);
router.patch("/me", requireAuth, updateProfile);
router.patch("/notifications/read", requireAuth, markNotificationsAsRead);

export default router;
