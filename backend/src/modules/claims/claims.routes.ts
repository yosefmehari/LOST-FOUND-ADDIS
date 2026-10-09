import { Router } from "express";
import {
  submitClaim,
  getMyClaims,
  getItemClaims,
  updateClaimStatus,
} from "./claims.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

// Submit claim on an item
router.post("/items/:itemId/claims", requireAuth, submitClaim);

// Get claims submitted by logged in user
router.get("/mine", requireAuth, getMyClaims);

// Get claims on an item (for item owner or admin)
router.get("/items/:itemId/claims", requireAuth, getItemClaims);

// Approve or reject a claim (for item owner or admin)
router.patch("/:id", requireAuth, updateClaimStatus);

export default router;
