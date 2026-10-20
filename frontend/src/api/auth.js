import { apiClient } from "./client";

/**
 * Register a new user
 * Backend POST /api/auth/register
 * Payload: { name, email, password }
 * Response: { message, user: { id, name, email, created_at } }
 */
export async function registerApi({ name, email, password }) {
  return apiClient("/api/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

/**
 * Authenticate user and obtain JWT token
 * Backend POST /api/auth/login
 * Payload: { email, password }
 * Response: { message, token, user: { id, name, email } }
 */
export async function loginApi({ email, password }) {
  return apiClient("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/**
 * Test authentication endpoint
 * Backend GET /api/auth-test
 * Response: { message, userId }
 */
export async function testAuthApi() {
  return apiClient("/api/auth-test", {
    method: "GET",
  });
}
