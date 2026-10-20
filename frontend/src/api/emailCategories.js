import { apiClient } from "./client";

/**
 * Assign one or more categories to an email
 * Backend POST /api/email-categories/assign
 * Payload: { emailId, categoryIds }
 */
export async function assignCategoriesApi({ emailId, categoryIds }) {
  if (!emailId || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    throw new Error("A valid email ID and a non-empty array of category IDs are required.");
  }

  return apiClient("/api/email-categories/assign", {
    method: "POST",
    body: {
      emailId: Number(emailId),
      categoryIds: categoryIds.map(Number),
    },
  });
}

/**
 * Remove a single category assignment from an email
 * Backend DELETE /api/email-categories/assign
 * Payload: { emailId, categoryId }
 */
export async function removeCategoryApi({ emailId, categoryId }) {
  if (!emailId || !categoryId) {
    throw new Error("Both email ID and category ID are required.");
  }

  return apiClient("/api/email-categories/assign", {
    method: "DELETE",
    body: {
      emailId: Number(emailId),
      categoryId: Number(categoryId),
    },
  });
}
