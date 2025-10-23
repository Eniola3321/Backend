import express from "express";
import {
  redirectToGoogle,
  googleCallback,
} from "../../controllers/gmail.controller";

const router = express.Router();

router.get("/", redirectToGoogle);
router.get("/callback", googleCallback);

export default router;
