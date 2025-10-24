import express from "express";
import {
  redirectToNotion,
  notionCallback,
} from "../../controllers/notion.controller";
import { authenticate } from "../../controllers/auth.middleware";

const router = express.Router();

router.get("/", authenticate, redirectToNotion);
router.get("/callback", notionCallback);

export default router;
