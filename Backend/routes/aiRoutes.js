
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { classifyAndSaveEmail } from "../services/aiClassificationService.js";

const router = express.Router();

router.post("/classify/:emailId", authMiddleware, async (req, res) => {
    try {
        const { emailId } = req.params;

        if (!/^[1-9]\d*$/.test(emailId)) {
            return res.status(400).json({
                message: "A valid email ID is required."
            });
        }

        const result = await classifyAndSaveEmail({
            userId: req.user.userId,
            emailId
        });

        return res.status(200).json({
            message: "Email classified successfully.",
            ...result
        });
    } catch (error) {
        if (error.message === "Email not found or not accessible.") {
            return res.status(404).json({ message: error.message });
        }

        if (error.message === "No categories are available.") {
            return res.status(400).json({ message: error.message });
        }

        console.error("AI classification failed:", error.message);

        return res.status(502).json({
            message: "AI classification failed. Please try again."
        });
    }
});

export default router;
