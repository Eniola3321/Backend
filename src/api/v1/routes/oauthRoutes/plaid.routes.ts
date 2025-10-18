// routes/oauth/plaid.routes.ts
import express from "express";
import {
  createLinkToken,
  exchangePublicToken,
} from "../../controllers/plaid.controller";
import { authenticate } from "../../controllers/auth.middleware";

const router = express.Router();

router.get("/link-token", authenticate, createLinkToken);
router.post("/exchange-token", authenticate, exchangePublicToken);

export default router;
