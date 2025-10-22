import express from "express";
import {
  redirectToGoogle,
  googleCallback,
} from "../../controllers/gmail.controller";
import { authenticate } from "../../controllers/auth.middleware";

const router = express.Router();

router.get("/", authenticate, redirectToGoogle);
router.get("/callback", authenticate, googleCallback);

export default router;
