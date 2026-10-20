import { apiClient } from "./client";

/**
 * Classify an email using the backend's OpenRouter AI classification service
 * Backend POST /api/ai/classify/:emailId
 * Returns: { message, emailId, categoryIds, reason, addedCount, assignments }
 */
export async function classifyEmailAiApi(emailId) {
  if (!emailId) {
    throw new Error("A valid email ID is required for AI classification.");
  }

  return apiClient(`/api/ai/classify/${emailId}`, {
    method: "POST",
  });
}
