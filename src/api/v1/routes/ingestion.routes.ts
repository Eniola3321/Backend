import express from "express";
import {
  ingestGmail,
  ingestPlaid,
  ingestApiUsage,
  uploadReceipt,
} from "../controllers/ingestion.controller";
import { authenticate } from "../controllers/auth.middleware";
import uploadMiddleware from "../utils/upload.receipt";

const router = express.Router();

router.use(authenticate);

router.post("/gmail", ingestGmail);
router.post("/plaid", ingestPlaid);
router.post("/api", ingestApiUsage);
router.post("/upload", uploadMiddleware, uploadReceipt);

export default router;
