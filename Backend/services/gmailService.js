import { google } from "googleapis";

import {
    saveEmailAccount,
    getEmailAccountWithTokens
} from "../repositories/emailAccountRepository.js";

import { saveEmails } from "../repositories/emailRepository.js";

import {
    encryptToken,
    decryptToken
} from "../utils/tokenCrypto.js";

import { fetchGmailMessages } from "./gmailFetchService.js";
import { classifyAndSaveEmail } from "./aiClassificationService.js";

function createOAuthClient() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

export async function connectGmailAccount({
    userId,
    oauth2Client,
    tokens
}) {
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({
        version: "v1",
        auth: oauth2Client
    });

    const profile = await gmail.users.getProfile({
        userId: "me"
    });

    const googleEmail = profile.data.emailAddress;

    if (!googleEmail) {
        throw new Error("Unable to identify the connected Gmail account.");
    }

    const googleAccountId = googleEmail;

    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = encryptToken(tokens.refresh_token);

    const tokenExpiry = tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null;

    const savedAccount = await saveEmailAccount({
        userId,
        googleEmail,
        googleAccountId,
        encryptedAccessToken,
        encryptedRefreshToken,
        tokenExpiry
    });

    return {
        id: savedAccount.id,
        userId: savedAccount.user_id,
        googleEmail: savedAccount.email_address,
        refreshTokenAvailable: Boolean(
            tokens.refresh_token
        )
    };
}


export async function syncGmailAccount({ userId, accountId, maxResults = 20 }) {
    const account = await getEmailAccountWithTokens({ userId, accountId });

    if (!account) {
        throw new Error("Connected Gmail account not found.");
    }

    if (!account.refresh_token) {
        throw new Error("No refresh token is saved. Reconnect Gmail.");
    }

    const refreshToken = decryptToken(account.refresh_token);

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    // 1. Fetch emails from Gmail.
    const emails = await fetchGmailMessages({
        oauth2Client,
        emailAccountId: account.id,
        maxResults
    });

    // 2. Save emails to PostgreSQL.
    const saveResult = await saveEmails(emails);

    let classifiedCount = 0;
    let classificationFailedCount = 0;

    // 3. Automatically classify newly inserted emails.
    for (const insertedEmail of saveResult.insertedEmails) {
        try {
            await classifyAndSaveEmail({
                userId,
                emailId: insertedEmail.id
            });

            classifiedCount++;
        } catch (error) {
            classificationFailedCount++;

            console.error(
                `AI classification failed for email ${insertedEmail.id}:`,
                error.message
            );
        }
    }

    // 4. Return the sync summary.
    return {
        accountId: account.id,
        emailAddress: account.email_address,
        fetchedCount: emails.length,
        insertedCount: saveResult.insertedCount,
        classifiedCount,
        classificationFailedCount
    };
}
