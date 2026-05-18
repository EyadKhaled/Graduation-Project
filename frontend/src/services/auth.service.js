import { api, setTokens, clearTokens } from "./api.js";

export const authService = {
  // POST /auth/register/
  register: async ({ firstName, lastName, email, password }) => {
    const data = await api.post("/auth/register/", {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    });
    if (data.access) setTokens(data.access, data.refresh);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  // POST /auth/login/
  login: async ({ email, password }) => {
    const data = await api.post("/auth/login/", { email, password });
    if (data.access) setTokens(data.access, data.refresh);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  // POST /auth/logout/
  logout: async () => {
    try {
      await api.post("/auth/logout/");
    } finally {
      clearTokens();
    }
  },

  // GET /auth/me/
  getMe: () => api.get("/auth/me/"),

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!localStorage.getItem("access_token"),
};
