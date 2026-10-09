import { Router } from "express";
import { getItems, getItemById, getItemMatches, createItem, updateItem, deleteItem } from "./items.controller.js";
import { submitReport } from "../reports/reports.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.get("/", getItems);
router.get("/:id", getItemById);
router.get("/:id/matches", getItemMatches);
router.post("/", requireAuth, createItem);
router.post("/:id/reports", requireAuth, submitReport);
router.patch("/:id", requireAuth, updateItem);
router.delete("/:id", requireAuth, deleteItem);

export default router;
