const API_URL = import.meta.env.VITE_API_URL || "";
const KEY_STORE = "signature_admin_key";

export const getKey = () => {
  try { return sessionStorage.getItem(KEY_STORE) || ""; } catch { return ""; }
};
export const setKey = (k) => {
  try {
    if (k) sessionStorage.setItem(KEY_STORE, k);
    else { sessionStorage.removeItem(KEY_STORE); sessionStorage.removeItem(FROM_ADMIN_KEY); }
  } catch { /* private mode */ }
};

// admin se website par gaye to website par "Back to Admin" button dikhe
export const FROM_ADMIN_KEY = "signature_from_admin";
export const markFromAdmin = () => {
  try { sessionStorage.setItem(FROM_ADMIN_KEY, "1"); } catch { /* private mode */ }
};

export class AuthError extends Error {}

// password badalna — purana password body mein jaata hai (header ki zaroorat nahi)
export async function changePassword(current, next) {
  const res = await fetch(`${API_URL}/api/admin/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current, next }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || "Could not change password");
  return data;
}

export async function adminFetch(path, { method = "GET", body, key = getKey() } = {}) {
  const res = await fetch(`${API_URL}/api/admin${path}`, {
    method,
    headers: { "x-admin-key": key, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new AuthError("Wrong password");
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
