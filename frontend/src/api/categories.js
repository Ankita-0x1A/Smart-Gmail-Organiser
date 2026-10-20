import { apiClient } from "./client";

/**
 * Fetch emails assigned to a specific category
 * Backend GET /api/categories/:id/emails?limit=20&offset=0&search=&unread=false
 */
export async function getCategoryEmailsApi({
  categoryId,
  limit = 20,
  offset = 0,
  search = "",
  unread = false,
}) {
  const queryParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    search: search.trim(),
    unread: unread ? "true" : "false",
  });

  return apiClient(`/api/categories/${categoryId}/emails?${queryParams.toString()}`, {
    method: "GET",
  });
}

/**
 * Fetch all categories (system + user's custom categories)
 * Backend GET /api/categories
 */
export async function getCategoriesApi() {
  return apiClient("/api/categories", {
    method: "GET",
  });
}

/**
 * Create a new custom category
 * Backend POST /api/categories
 * Payload: { name }
 */
export async function createCategoryApi(name) {
  return apiClient("/api/categories", {
    method: "POST",
    body: { name },
  });
}

/**
 * Rename a custom category
 * Backend PATCH /api/categories/:id
 * Payload: { name }
 */
export async function renameCategoryApi(id, name) {
  return apiClient(`/api/categories/${id}`, {
    method: "PATCH",
    body: { name },
  });
}

/**
 * Delete a custom category
 * Backend DELETE /api/categories/:id
 */
export async function deleteCategoryApi(id) {
  return apiClient(`/api/categories/${id}`, {
    method: "DELETE",
  });
}
