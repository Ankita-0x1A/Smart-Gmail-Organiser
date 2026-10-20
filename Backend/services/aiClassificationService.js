
import pool from "../db.js";
import { assignCategories } from "../repositories/emailCategoryRepository.js";

const AI_SERVICE_URL = "http://localhost:5001";

export async function classifyAndSaveEmail({ userId, emailId }) {
    // 1. Fetch the email and verify ownership.
    const emailResult = await pool.query(
        `SELECT e.id, e.sender, e.subject, e.body
         FROM emails e
         JOIN email_accounts ea ON ea.id = e.email_account_id
         WHERE e.id = $1 AND ea.user_id = $2`,
        [emailId, userId]
    );

    if (emailResult.rowCount === 0) {
        throw new Error("Email not found or not accessible.");
    }

    const email = emailResult.rows[0];

    // 2. Fetch categories available to this user.
    const categoryResult = await pool.query(
        `SELECT id, name
         FROM categories
         WHERE type = 'system'
            OR (type = 'custom' AND user_id = $1)
         ORDER BY id`,
        [userId]
    );

    const categories = categoryResult.rows;

    if (categories.length === 0) {
        throw new Error("No categories are available.");
    }

    // 3. Send a limited email excerpt to the AI service.
    const response = await fetch(`${AI_SERVICE_URL}/classify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: {
                sender: email.sender || "",
                subject: email.subject || "",
                body: (email.body || "").slice(0, 2000)
            },
            categories
        }),
        signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
        throw new Error(`AI service failed with status ${response.status}.`);
    }

    const result = await response.json();

    // 4. Validate the returned category IDs.
    if (
        !Array.isArray(result.categoryIds) ||
        result.categoryIds.length === 0 ||
        result.categoryIds.some(
            id => !Number.isSafeInteger(id) || id <= 0
        ) ||
        new Set(result.categoryIds).size !== result.categoryIds.length
    ) {
        throw new Error("AI returned invalid category IDs.");
    }

    const allowedIds = new Set(
        categories.map(category => Number(category.id))
    );

    if (result.categoryIds.some(id => !allowedIds.has(id))) {
        throw new Error("AI returned an unavailable category.");
    }

    // 5. Save assignments as AI-generated.
    const saved = await assignCategories({
        userId,
        emailId,
        categoryIds: result.categoryIds,
        assignedBy: "ai"
    });

    return {
        emailId: Number(emailId),
        categoryIds: result.categoryIds,
        reason: result.reason || "",
        addedCount: saved.addedCount,
        assignments: saved.assigned
    };
}
