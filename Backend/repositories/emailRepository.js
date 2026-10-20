import pool from "../db.js";
import * as cheerio from "cheerio";


export async function saveEmails(emails) {
    if (emails.length === 0) {
        return {
            insertedCount: 0,
            insertedEmails: []
        };
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const insertedEmails = [];

        for (const email of emails) {
            const result = await client.query(
                `INSERT INTO emails (
                    email_account_id,
                    gmail_message_id,
                    sender,
                    subject,
                    body,
                    received_at,
                    is_read
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (
                    email_account_id,
                    gmail_message_id
                )
                DO NOTHING
                RETURNING id, gmail_message_id`,
                [
                    email.emailAccountId,
                    email.gmailMessageId,
                    email.sender,
                    email.subject,
                    email.body,
                    email.receivedAt,
                    email.isRead
                ]
            );

            if (result.rowCount > 0) {
                insertedEmails.push({
                    id: result.rows[0].id,
                    gmailMessageId: result.rows[0].gmail_message_id
                });
            }
        }

        await client.query("COMMIT");

        return {
            insertedCount: insertedEmails.length,
            insertedEmails
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}




function cleanEmailPreview(body = "") {
    const $ = cheerio.load(body);

    // Remove elements that usually contain non-message content.
    $("style, script, head, img, svg, noscript").remove();

    // Remove hidden elements.
    $("[style]").each((_, element) => {
        const style = $(element).attr("style") || "";

        if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(style)) {
            $(element).remove();
        }
    });

    // Extract readable text.
    const text = $("body").length
        ? $("body").text()
        : $.root().text();

    return text
        .replace(/[\u200B-\u200D\uFEFF\u2060]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200);
}




export async function getEmailsByAccount({
    userId,
    accountId,
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
            e.body,
            e.received_at,
            e.is_read
         FROM emails e
         JOIN email_accounts ea
            ON ea.id = e.email_account_id
         WHERE ea.user_id = $1
           AND ea.id = $2
           AND (
                $3 = ''
                OR COALESCE(e.sender, '') ILIKE '%' || $3 || '%'
                OR COALESCE(e.subject, '') ILIKE '%' || $3 || '%'
           )
           AND ($4::boolean = FALSE OR e.is_read = FALSE)
         ORDER BY e.received_at DESC NULLS LAST
         LIMIT $5 OFFSET $6`,
        [userId, accountId, search, unread, limit, offset]
    );

    return result.rows.map(({ body, ...email }) => ({
        ...email,
        body_preview: cleanEmailPreview(body || "")
    }));
}



export async function getEmailById({
    userId,
    accountId,
    emailId
}) {
    const result = await pool.query(
        `SELECT
            e.id,
            e.email_account_id,
            e.gmail_message_id,
            e.sender,
            e.subject,
            e.body,
            e.received_at,
            e.is_read
         FROM emails e
         JOIN email_accounts ea
            ON ea.id = e.email_account_id
         WHERE ea.user_id = $1
           AND ea.id = $2
           AND e.id = $3
         LIMIT 1`,
        [userId, accountId, emailId]
    );

    return result.rows[0] || null;
}

export async function markEmailAsRead({
    userId,
    accountId,
    emailId
}) {
    const result = await pool.query(
        `UPDATE emails e
         SET is_read = TRUE
         FROM email_accounts ea
         WHERE ea.id = e.email_account_id
           AND ea.user_id = $1
           AND ea.id = $2
           AND e.id = $3
         RETURNING
            e.id,
            e.email_account_id,
            e.is_read`,
        [userId, accountId, emailId]
    );

    return result.rows[0] || null;
}

