// Base API client for Smart Gmail Organizer
const API_BASE_URL = "";

export async function apiClient(endpoint, options = {}) {
  const { headers = {}, body, ...customConfig } = options;

  // Retrieve JWT token from localStorage
  const token = localStorage.getItem("token");

  const configHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    configHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method: body ? "POST" : "GET",
    ...customConfig,
    headers: configHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);

    // Parse JSON response body if available
    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorMessage =
        data?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // If unauthorized, token might be expired
    if (error.status === 401 && !endpoint.includes("/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    throw error;
  }
}
