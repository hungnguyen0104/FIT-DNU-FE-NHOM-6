// Auth for static site:
// - Admin credentials: localStorage (demo)
// - User accounts: MockAPI (/users) ONLY (no local fallback)

const AUTH_KEYS = {
  session: "ag_session",
  adminCreds: "ag_admin_credentials",
  likesPrefix: "ag_likes_", // ag_likes_<userId>
};

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeUsername(username) {
  return (username || "").toString().trim();
}

function ensureAdminCredentials() {
  const existing = localStorage.getItem(AUTH_KEYS.adminCreds);
  if (existing) return;

  // Default admin credentials (change if needed)
  localStorage.setItem(
    AUTH_KEYS.adminCreds,
    JSON.stringify({ username: "admin", password: "admin123", createdAt: nowIso() })
  );
}

function requireUsersApi() {
  if (!window.api || typeof window.api.getUsers !== "function" || typeof window.api.createUser !== "function") {
    throw new Error("Thiếu API users. Hãy đảm bảo trang có nhúng js/api.js và MockAPI có resource /users.");
  }
}

async function getUsersRemote() {
  requireUsersApi();
  const remote = await window.api.getUsers();
  if (!Array.isArray(remote)) return [];
  return remote;
}

async function createUserRemote(user) {
  requireUsersApi();
  const created = await window.api.createUser(user);
  return created;
}

function getSession() {
  return safeJsonParse(localStorage.getItem(AUTH_KEYS.session), null);
}

function setSession(session) {
  localStorage.setItem(AUTH_KEYS.session, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(AUTH_KEYS.session);
}

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return session;
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function isAdmin() {
  const u = getCurrentUser();
  return !!u && u.role === "admin";
}

async function registerUser(username, password) {
  ensureAdminCredentials();
  const u = normalizeUsername(username);
  if (!u) throw new Error("Tên đăng nhập không hợp lệ");
  if (!password || password.length < 4) throw new Error("Mật khẩu phải từ 4 ký tự");

  const users = await getUsersRemote();
  const exists = Array.isArray(users) && users.some((x) => (x.username || "").toLowerCase() === u.toLowerCase());
  if (exists) throw new Error("Tên đăng nhập đã tồn tại");

  const newUser = {
    id: "u_" + Math.random().toString(16).slice(2) + Date.now().toString(16),
    username: u,
    password: password, // demo only
    role: "user",
    createdAt: nowIso(),
  };

  await createUserRemote(newUser);
  return { id: newUser.id, username: newUser.username, role: newUser.role };
}

async function login(username, password) {
  ensureAdminCredentials();
  const u = normalizeUsername(username);
  if (!u) throw new Error("Vui lòng nhập tên đăng nhập");
  if (!password) throw new Error("Vui lòng nhập mật khẩu");

  const adminCreds = safeJsonParse(localStorage.getItem(AUTH_KEYS.adminCreds), null);
  if (
    adminCreds &&
    adminCreds.username.toLowerCase() === u.toLowerCase() &&
    adminCreds.password === password
  ) {
    const session = { id: "admin", username: adminCreds.username, role: "admin", loggedInAt: nowIso() };
    setSession(session);
    return session;
  }

  const users = await getUsersRemote();
  const found = (users || []).find(
    (x) => (x.username || "").toLowerCase() === u.toLowerCase() && x.password === password
  );
  if (!found) throw new Error("Sai tài khoản hoặc mật khẩu");

  const session = { id: found.id, username: found.username, role: found.role, loggedInAt: nowIso() };
  setSession(session);
  return session;
}

function logout() {
  clearSession();
}

function getRedirectParam() {
  const url = new URL(window.location.href);
  return url.searchParams.get("redirect");
}

function navigateTo(url) {
  window.location.href = url;
}

function requireLogin(redirectTo) {
  if (isLoggedIn()) return true;
  const redirect = encodeURIComponent(redirectTo || window.location.pathname.split("/").pop() || "index.html");
  navigateTo(`auth.html?redirect=${redirect}`);
  return false;
}

function requireAdmin() {
  if (isAdmin()) return true;
  const redirect = encodeURIComponent("admin.html");
  navigateTo(`auth.html?redirect=${redirect}`);
  return false;
}

function getUserLikesKey(userId) {
  return `${AUTH_KEYS.likesPrefix}${userId}`;
}

function getCurrentUserLikesMap() {
  const u = getCurrentUser();
  if (!u || !u.id) return {};
  return safeJsonParse(localStorage.getItem(getUserLikesKey(u.id)), {});
}

function setCurrentUserLikesMap(map) {
  const u = getCurrentUser();
  if (!u || !u.id) return;
  localStorage.setItem(getUserLikesKey(u.id), JSON.stringify(map || {}));
}

// Expose small API globally
window.auth = {
  ensureAdminCredentials,
  getCurrentUser,
  isLoggedIn,
  isAdmin,
  registerUser,
  login,
  logout,
  requireLogin,
  requireAdmin,
  getRedirectParam,
  navigateTo,
  getCurrentUserLikesMap,
  setCurrentUserLikesMap,
};

