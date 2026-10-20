
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getAccountEmails } from "../controllers/emailController.js";

const router = express.Router();

router.get(
    "/accounts/:accountId",
    authMiddleware,
    getAccountEmails
);

export default router;
