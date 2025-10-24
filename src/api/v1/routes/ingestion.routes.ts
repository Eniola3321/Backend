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

/**
 * @route POST /api/ingest/gmail
 * @desc Ingest Gmail invoices via OAuth
 * @access Private
 */
router.use(authenticate);
router.post("/gmail", ingestGmail);

/**
 * @route POST /api/ingest/plaid
 * @desc Ingest Plaid transaction data
 * @access Private
 */
router.post("/plaid", ingestPlaid);

/**
 * @route POST /api/ingest/api
 * @desc Ingest usage data from API providers (OpenAI, Anthropic)
 * @access Private
 */
router.post("/api", ingestApiUsage);

/**
 * @route POST /api/ingest/upload
 * @desc Ingest receipts via manual upload and OCR
 * @access Private
 */
router.post("/upload", uploadMiddleware, uploadReceipt);

export default router;
