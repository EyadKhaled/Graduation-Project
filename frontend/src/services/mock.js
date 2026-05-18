// ─── Mock Database (in-memory) ────────────────────────────────────────────────
const db = {
  users: [],
  medicalHistory: [],
  uploads: [],
};

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

const generateToken = () => Math.random().toString(36).substring(2) + Date.now();

// ─── Mock Handlers ────────────────────────────────────────────────────────────
export const mockHandlers = {
  // Auth
  "POST /auth/register/": async ({ first_name, last_name, email, password }) => {
    await delay();
    const existing = db.users.find((u) => u.email === email);
    if (existing) throw { status: 400, message: "An account with this email already exists." };

    const user = { id: Date.now(), first_name, last_name, email };
    db.users.push({ ...user, password });
    return {
      user,
      access: generateToken(),
      refresh: generateToken(),
    };
  },

  "POST /auth/login/": async ({ email, password }) => {
    await delay();
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (!user) throw { status: 401, message: "Invalid email or password." };
    const { password: _, ...safeUser } = user;
    return {
      user: safeUser,
      access: generateToken(),
      refresh: generateToken(),
    };
  },

  "POST /auth/logout/": async () => {
    await delay(200);
    return { detail: "Logged out." };
  },

  "GET /auth/me/": async () => {
    await delay(200);
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) throw { status: 401, message: "Not authenticated." };
    return user;
  },

  // Medical History
  "POST /medical/history/": async (body) => {
    await delay();
    const record = { id: Date.now(), ...body, created_at: new Date().toISOString() };
    db.medicalHistory.push(record);
    return record;
  },

  "GET /medical/history/": async () => {
    await delay(300);
    return db.medicalHistory;
  },

  // Uploads
  "POST /uploads/": async (formData) => {
    await delay(800);
    const file = formData.get("file");
    const record = {
      id: Date.now(),
      file_name: file.name,
      file_type: file.type.split("/")[1] || "file",
      size: file.size,
      created_at: new Date().toISOString(),
      url: URL.createObjectURL(file),
    };
    db.uploads.unshift(record);
    return record;
  },

  "GET /uploads/": async () => {
    await delay(300);
    return db.uploads;
  },

  // Helpdesk
  "POST /helpdesk/contact/": async () => {
    await delay();
    return { detail: "Message received." };
  },
};

// ─── Mock Request Router ──────────────────────────────────────────────────────
export async function mockRequest(method, endpoint, body) {
  const key = `${method} ${endpoint}`;
  const handler = mockHandlers[key];

  if (!handler) {
    console.warn(`[Mock] No handler for: ${key}`);
    throw { status: 404, message: `Mock handler not found for ${key}` };
  }

  try {
    return await handler(body);
  } catch (err) {
    // Re-throw structured errors as-is
    if (err.status) throw err;
    throw { status: 500, message: err.message || "Mock error" };
  }
}
