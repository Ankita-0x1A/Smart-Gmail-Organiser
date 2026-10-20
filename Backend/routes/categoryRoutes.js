import express from "express";
import pool from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    getEmailsByCategory
} from "../repositories/emailCategoryRepository.js";

const router = express.Router();

// GET: System categories + this user's custom categories
router.get("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT id, name, type
             FROM categories
             WHERE type = 'system'
                OR (type = 'custom' AND user_id = $1)
             ORDER BY name`,
            [userId]
        );

        return res.status(200).json(result.rows);

    } catch (error) {
        console.error("Failed to fetch categories:", error.message);

        return res.status(500).json({
            message: "Failed to fetch categories."
        });
    }
});




router.get("/:id/emails", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const categoryId = req.params.id;

        // 1. Validate category ID
        if (!/^[1-9]\d*$/.test(categoryId)) {
            return res.status(400).json({
                message: "Invalid category ID."
            });
        }

        // 2. Validate pagination
        const limit = Number(req.query.limit ?? 20);
        const offset = Number(req.query.offset ?? 0);

        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            limit > 100 ||
            !Number.isInteger(offset) ||
            offset < 0
        ) {
            return res.status(400).json({
                message: "Limit must be 1-100 and offset must be non-negative."
            });
        }

        // 3. Read search and unread filters
        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";

        const unread = req.query.unread === "true";

        // 4. Fetch filtered emails
        const emails = await getEmailsByCategory({
            userId,
            categoryId,
            limit,
            offset,
            search,
            unread
        });

        // 5. Send response LAST
        return res.status(200).json({
            categoryId,
            count: emails.length,
            limit,
            offset,
            search,
            unread,
            emails
        });

    } catch (error) {
        console.error(
            "Failed to fetch category emails:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to fetch category emails."
        });
    }
});



// POST: Create a custom category
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.userId;

        // 1. Validate category name
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Category name is required."
            });
        }

        const categoryName = name.trim();

        // 2. Check for a duplicate belonging to this user
        const existingCategory = await pool.query(
            `SELECT id
             FROM categories
             WHERE user_id = $1
               AND type = 'custom'
               AND LOWER(name) = LOWER($2)`,
            [userId, categoryName]
        );

        if (existingCategory.rowCount > 0) {
            return res.status(409).json({
                message: "You already have a category with this name."
            });
        }

        // 3. Insert the new custom category
        const result = await pool.query(
            `INSERT INTO categories (user_id, name, type)
             VALUES ($1, $2, 'custom')
             RETURNING id, name, type, user_id`,
            [userId, categoryName]
        );

        return res.status(201).json({
            message: "Custom category created successfully!",
            category: result.rows[0]
        });

    } catch (error) {
        console.error("Failed to create category:", error.message);

        return res.status(500).json({
            message: "Failed to create category."
        });
    }
});



 // PATCH: Rename a custom category
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const categoryId = req.params.id;
        const { name } = req.body;

        // 1. Validate category ID
        if (!/^\d+$/.test(categoryId) || Number(categoryId) < 1) {
            return res.status(400).json({
                message: "Invalid category ID."
            });
        }

        // 2. Validate new category name
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Category name is required."
            });
        }

        const categoryName = name.trim();

        if (categoryName.length > 100) {
            return res.status(400).json({
                message: "Category name cannot exceed 100 characters."
            });
        }

        // 3. Rename only a category owned by this user
        const result = await pool.query(
            `UPDATE categories
             SET name = $1
             WHERE id = $2
               AND user_id = $3
               AND type = 'custom'
               AND NOT EXISTS (
                   SELECT 1
                   FROM categories c
                   WHERE c.user_id = $3
                     AND c.type = 'custom'
                     AND LOWER(c.name) = LOWER($1)
                     AND c.id <> $2
               )
             RETURNING id, name, type, user_id`,
            [categoryName, categoryId, userId]
        );

        if (result.rowCount === 0) {
            const existing = await pool.query(
                `SELECT id
                 FROM categories
                 WHERE id = $1
                   AND user_id = $2
                   AND type = 'custom'`,
                [categoryId, userId]
            );

            if (existing.rowCount === 0) {
                return res.status(404).json({
                    message: "Custom category not found."
                });
            }

            return res.status(409).json({
                message: "You already have a category with this name."
            });
        }

        return res.status(200).json({
            message: "Category renamed successfully.",
            category: result.rows[0]
        });

    } catch (error) {
        console.error("Failed to rename category:", error.message);

        return res.status(500).json({
            message: "Failed to rename category."
        });
    }
});



 // DELETE: Delete a custom category owned by the logged-in user
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const categoryId = req.params.id;

        // 1. Validate category ID
        if (!/^\d+$/.test(categoryId) || Number(categoryId) < 1) {
            return res.status(400).json({
                message: "Invalid category ID."
            });
        }

        // 2. Delete only this user's custom category
        const result = await pool.query(
            `DELETE FROM categories
             WHERE id = $1
               AND user_id = $2
               AND type = 'custom'
             RETURNING id, name`,
            [categoryId, userId]
        );

        // 3. Check whether a category was deleted
        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Custom category not found or you do not have permission to delete it."
            });
        }

        return res.status(200).json({
            message: "Custom category deleted successfully!",
            category: result.rows[0]
        });

    } catch (error) {
        console.error("Failed to delete category:", error.message);

        return res.status(500).json({
            message: "Failed to delete category."
        });
    }
});


export default router;


