import pool from "../db.js";

export async function saveEmailAccount({
    userId,
    googleEmail,
    googleAccountId,
    encryptedAccessToken,
    encryptedRefreshToken,
    tokenExpiry
}) {
    const result = await pool.query(
        `INSERT INTO email_accounts (
            user_id,
            email_address,
            provider,
            google_account_id,
            access_token,
            refresh_token,
            token_expiry
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, email_address)
        DO UPDATE SET
            access_token = EXCLUDED.access_token,
            refresh_token = COALESCE(
                EXCLUDED.refresh_token,
                email_accounts.refresh_token
            ),
            token_expiry = EXCLUDED.token_expiry
        RETURNING id, user_id, email_address`,
        [
            userId,
            googleEmail,
            "google",
            googleAccountId,
            encryptedAccessToken,
            encryptedRefreshToken,
            tokenExpiry
        ]
    );

    return result.rows[0];
}


export async function getEmailAccountWithTokens({
    userId,
    accountId
}) {
    const result = await pool.query(
        `SELECT
            id,
            user_id,
            email_address,
            access_token,
            refresh_token,
            token_expiry
         FROM email_accounts
         WHERE id = $1
           AND user_id = $2`,
        [accountId, userId]
    );

    return result.rows[0] || null;
}

export async function getEmailAccountsByUser(userId) {
    const result = await pool.query(
        `SELECT id, email_address
         FROM email_accounts
         WHERE user_id = $1
           AND provider = $2
         ORDER BY id DESC`,
        [userId, "google"]
    );

    return result.rows;
}
