import { Router } from "express";
import { authenticate } from "../controllers/auth.middleware";
import {
  getUserUsage,
  upsertUsage,
  deleteUsage,
} from "../controllers/usage.controller";

const router = Router();
router.use(authenticate);
router.get("/", getUserUsage);
router.post("/", upsertUsage);
router.delete("/:usageId", deleteUsage);

export default router;
