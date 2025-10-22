import { Router } from "express";
import { authenticate } from "../controllers/auth.middleware";
import {
  getUserUsage,
  upsertUsage,
  deleteUsage,
} from "../controllers/useage.controller";

const router = Router();

router.get("/", authenticate, getUserUsage);
router.post("/", authenticate, upsertUsage);
router.delete("/:usageId", authenticate, deleteUsage);

export default router;
