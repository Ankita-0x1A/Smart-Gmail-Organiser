
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {assignCategories,removeCategoryFromEmail} from "../repositories/emailCategoryRepository.js";

const router = express.Router();

router.post("/assign", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { emailId, categoryIds } = req.body;

        if (
            !/^[1-9]\d*$/.test(String(emailId ?? "")) ||
            !Array.isArray(categoryIds) ||
            categoryIds.length === 0 ||
            categoryIds.some(
                id => !/^[1-9]\d*$/.test(String(id))
            ) ||
            new Set(categoryIds.map(String)).size !== categoryIds.length
        ) {
            return res.status(400).json({
                message:
                    "Provide a valid emailId and a non-empty array of unique categoryIds."
            });
        }

        const result = await assignCategories({
            userId,
            emailId,
            categoryIds
        });

        return res.status(200).json({
            message: "Categories assigned successfully.",
            ...result
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                message: error.message
            });
        }

        console.error("Failed to assign categories:", error.message);

        return res.status(500).json({
            message: "Failed to assign categories."
        });
    }
});


router.delete("/assign", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { emailId, categoryId } = req.body;

        if (
            !/^[1-9]\d*$/.test(String(emailId ?? "")) ||
            !/^[1-9]\d*$/.test(String(categoryId ?? ""))
        ) {
            return res.status(400).json({
                message: "Valid emailId and categoryId are required."
            });
        }

        const removed = await removeCategoryFromEmail({
            userId,
            emailId,
            categoryId
        });

        if (!removed) {
            return res.status(404).json({
                message: "Email category assignment not found."
            });
        }

        return res.status(200).json({
            message: "Category removed from email successfully.",
            assignment: removed
        });
    } catch (error) {
        console.error(
            "Failed to remove email category:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to remove category from email."
        });
    }
});


export default router;
