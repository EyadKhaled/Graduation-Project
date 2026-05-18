import { mockRequest } from "./mock.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const IS_MOCK = import.meta.env.VITE_MOCK_API === "true";

// ─── Token Helpers ────────────────────────────────────────────────────────────

export const getToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

export const setTokens = (access, refresh) => {
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

// ─── Core Request ─────────────────────────────────────────────────────────────

async function request(method, endpoint, body) {
  if (IS_MOCK) {
    return mockRequest(method, endpoint, body);
  }

  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const config = { method, headers };

  if (body !== undefined) {
    if (body instanceof FormData) {
      delete headers["Content-Type"];
      config.body = body;
    } else {
      config.body = JSON.stringify(body);
    }
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      config.headers.Authorization = `Bearer ${getToken()}`;
      response = await fetch(`${BASE_URL}${endpoint}`, config);
    } else {
      clearTokens();
      window.location.href = "/signin";
      return;
    }
  }

  return handleResponse(response);
}

async function handleResponse(response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw {
      status: response.status,
      message:
        (isJson && (data.detail || data.message || data.error)) ||
        "Something went wrong. Please try again.",
      data,
    };
  }

  return data;
}

async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access, data.refresh);
    return true;
  } catch {
    return false;
  }
}

// ─── HTTP Methods ─────────────────────────────────────────────────────────────

export const api = {
  get:    (endpoint)        => request("GET",    endpoint),
  post:   (endpoint, body)  => request("POST",   endpoint, body),
  put:    (endpoint, body)  => request("PUT",    endpoint, body),
  patch:  (endpoint, body)  => request("PATCH",  endpoint, body),
  delete: (endpoint)        => request("DELETE", endpoint),
};
