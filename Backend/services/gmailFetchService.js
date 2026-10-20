import { google } from "googleapis";

function getHeader(headers, name) {
    return headers.find(
        (header) =>
            header.name?.toLowerCase() === name.toLowerCase()
    )?.value || "";
}

function extractBody(part) {
    if (!part) return "";

    if (
        part.mimeType === "text/plain" &&
        part.body?.data
    ) {
        return Buffer.from(
            part.body.data,
            "base64url"
        ).toString("utf8");
    }

    for (const child of part.parts || []) {
        const body = extractBody(child);

        if (body) {
            return body;
        }
    }

    // Fall back to HTML when no plain-text body is available
    if (
        part.mimeType === "text/html" &&
        part.body?.data
    ) {
        return Buffer.from(
            part.body.data,
            "base64url"
        ).toString("utf8");
    }

    return "";
}

export async function fetchGmailMessages({
    oauth2Client,
    emailAccountId,
    maxResults = 20
}) {
    const gmail = google.gmail({
        version: "v1",
        auth: oauth2Client
    });

    // 1. Get recent Gmail message IDs
    const listResponse = await gmail.users.messages.list({
        userId: "me",
        maxResults
    });

    const messages = listResponse.data.messages || [];
    const emails = [];

    // 2. Fetch each message's details
    for (const message of messages) {
        const response = await gmail.users.messages.get({
            userId: "me",
            id: message.id,
            format: "full"
        });

        const data = response.data;
        const headers = data.payload?.headers || [];
        const labelIds = data.labelIds || [];

        emails.push({
            emailAccountId,
            gmailMessageId: data.id,
            sender: getHeader(headers, "From"),
            subject: getHeader(headers, "Subject"),
            body: extractBody(data.payload),
            receivedAt: data.internalDate
                ? new Date(Number(data.internalDate))
                : null,
            isRead: !labelIds.includes("UNREAD")
        });
    }

    return emails;
}
