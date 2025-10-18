import express from "express";
import multer from "multer";
import {
  ingestGmail,
  ingestPlaid,
  ingestApiUsage,
  uploadReceipt,
} from "../controllers/ingestion.controller";
import { authenticate } from "../controllers/auth.middleware";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/gmail", authenticate, ingestGmail);
router.post("/plaid", authenticate, ingestPlaid);
router.post("/api-usage", authenticate, ingestApiUsage);
router.post(
  "/upload-receipt",
  authenticate,
  upload.single("receipt"),
  uploadReceipt
);

export default router;
