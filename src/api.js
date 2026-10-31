// Backend API ka address. Development mein Vite proxy "/api" ko localhost:5000 par bhejta hai.
// Website aur API alag domain par hon to .env mein VITE_API_URL likhein, jaise https://api.signatureevents.pk
const API_URL = import.meta.env.VITE_API_URL || "";

export async function postJSON(path, data) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    throw new Error(body.errors?.join(", ") || body.error || `Request failed (${res.status})`);
  }
  return body;
}
