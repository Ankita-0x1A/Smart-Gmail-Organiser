import { apiClient } from "./client";

/**
 * Fetch emails for a specific account
 * Backend GET /api/gmail/accounts/:accountId/emails?limit=20&offset=0&search=&unread=false
 */
export async function getGmailAccountsApi() {
  return apiClient("/api/gmail/accounts", {
    method: "GET",
  });
}
export async function getAccountEmailsApi({
  accountId,
  limit = 20,
  offset = 0,
  search = "",
  unread = false,
}) {
  if (!accountId) {
    throw new Error("A valid account ID is required to fetch account emails.");
  }

  const queryParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    search: search.trim(),
    unread: unread ? "true" : "false",
  });

  return apiClient(`/api/gmail/accounts/${accountId}/emails?${queryParams.toString()}`, {
    method: "GET",
  });
}

/**
 * Sync Gmail account
 * Backend GET /api/gmail/accounts/:accountId/emails/sync
 */
export async function syncGmailAccountApi(accountId) {
  if (!accountId) {
    throw new Error("A valid account ID is required to sync emails.");
  }

  return apiClient(`/api/gmail/accounts/${accountId}/emails/sync`, {
    method: "GET",
  });
}

/**
 * Fetch detailed email by ID
 * Backend GET /api/gmail/accounts/:accountId/emails/:emailId
 */
export async function getEmailDetailApi({ accountId, emailId }) {
  if (!accountId || !emailId) {
    throw new Error("Account ID and Email ID are required.");
  }

  return apiClient(`/api/gmail/accounts/${accountId}/emails/${emailId}`, {
    method: "GET",
  });
}

/**
 * Mark email as read
 * Backend PATCH /api/gmail/accounts/:accountId/emails/:emailId/read
 */
export async function markEmailAsReadApi({ accountId, emailId }) {
  if (!accountId || !emailId) {
    throw new Error("Account ID and Email ID are required.");
  }

  return apiClient(`/api/gmail/accounts/${accountId}/emails/${emailId}/read`, {
    method: "PATCH",
  });
}
