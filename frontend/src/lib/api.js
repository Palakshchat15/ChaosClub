import { getAuth } from "./auth";

const API_BASE = "http://localhost:8000";

async function request(path, options = {}) {
  const auth = getAuth();

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload?.detail
        ? payload.detail
        : "Request failed";
    throw new Error(message);
  }

  return payload;
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    (path, body)  => request(path, { method: "PUT",    body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: "DELETE" }),
};

export { API_BASE };
