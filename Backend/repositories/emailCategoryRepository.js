import pool from "../db.js";
import * as cheerio from "cheerio";

// Assign multiple categories to one email
export async function assignCategories({
    userId,
    emailId,
    categoryIds,
    assignedBy = "user"
}) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Verify that this email belongs to the logged-in user
        const emailResult = await client.query(
            `SELECT e.id
             FROM emails e
             JOIN email_accounts ea
               ON ea.id = e.email_account_id
             WHERE e.id = $1
               AND ea.user_id = $2`,
            [emailId, userId]
        );

        if (emailResult.rowCount === 0) {
            const error = new Error("Email not found.");
            error.statusCode = 404;
            throw error;
        }

        // Validate that all categories are available to this user
        const categoryResult = await client.query(
            `SELECT id
             FROM categories
             WHERE id = ANY($1::bigint[])
               AND (
                   type = 'system'
                   OR (type = 'custom' AND user_id = $2)
               )`,
            [categoryIds, userId]
        );

        if (categoryResult.rowCount !== categoryIds.length) {
            const error = new Error(
                "One or more categories are invalid or unavailable."
            );
            error.statusCode = 400;
            throw error;
        }

        // Insert assignments; existing assignments remain unchanged
        const result = await client.query(
            `INSERT INTO email_categories
                (email_id, category_id, assigned_by)
             SELECT $1, category_id, $3
             FROM UNNEST($2::bigint[]) AS category_id
             ON CONFLICT (email_id, category_id) DO NOTHING
             RETURNING email_id, category_id, assigned_by`,
            [emailId, categoryIds, assignedBy]
        );

        await client.query("COMMIT");

        return {
            assigned: result.rows,
            addedCount: result.rowCount
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}




// Get preview emails assigned to a category

export async function getEmailsByCategory({
    userId,
    categoryId,
    limit = 20,
    offset = 0,
    search = "",
    unread = false
}) {
    const result = await pool.query(
        `SELECT
            e.id,
            e.email_account_id,
            e.gmail_message_id,
            e.sender,
            e.subject,
            e.received_at,
            e.is_read,
            e.body
         FROM email_categories ec
         JOIN emails e
           ON e.id = ec.email_id
         JOIN email_accounts ea
           ON ea.id = e.email_account_id
         JOIN categories c
           ON c.id = ec.category_id
         WHERE ea.user_id = $1
           AND c.id = $2
           AND (
               c.type = 'system'
               OR (c.type = 'custom' AND c.user_id = $1)
           )
           AND (
               $3 = ''
               OR COALESCE(e.sender, '') ILIKE '%' || $3 || '%'
               OR COALESCE(e.subject, '') ILIKE '%' || $3 || '%'
           )
           AND ($4::boolean = FALSE OR e.is_read = FALSE)
         ORDER BY e.received_at DESC NULLS LAST
         LIMIT $5 OFFSET $6`,
        [userId, categoryId, search, unread, limit, offset]
    );

    return result.rows.map(({ body, ...email }) => {
        const $ = cheerio.load(body || "");
        $("style, script, head, img, svg, noscript").remove();

        const text = $("body").length
            ? $("body").text()
            : $.root().text();

        return {
            ...email,
            body_preview: text
                .replace(/[\u200B-\u200D\uFEFF\u2060]/g, "")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 200)
        };
    });
}



// Remove Category from Email API.
export async function removeCategoryFromEmail({
    userId,
    emailId,
    categoryId
}) {
    const result = await pool.query(
        `DELETE FROM email_categories ec
         USING emails e, email_accounts ea
         WHERE ec.email_id = e.id
           AND e.email_account_id = ea.id
           AND ea.user_id = $1
           AND e.id = $2
           AND ec.category_id = $3
         RETURNING ec.email_id, ec.category_id`,
        [userId, emailId, categoryId]
    );

    if (result.rowCount === 0) {
        return null;
    }

    return result.rows[0];
}

