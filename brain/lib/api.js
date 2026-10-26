// Thin fetch wrapper for Google REST APIs (and GitHub). No gapi.

export class ApiError extends Error {
  constructor(status, message, detail) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail || "";
  }
}

/** Build a query string, skipping undefined values; arrays repeat the key. */
export function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Returns fetchJson(url, { method, body }) that adds the bearer token.
 * `getToken()` returns the current access token (or null for unauthenticated calls).
 * `onUnauthorized()` is called on HTTP 401 so the app can drop the token.
 */
export function createClient({ getToken, onUnauthorized } = {}) {
  return async function fetchJson(url, { method = "GET", body, auth = true } = {}) {
    const headers = { Accept: "application/json" };
    if (auth) {
      const token = getToken && getToken();
      if (!token) throw new ApiError(401, "Not signed in");
      headers.Authorization = `Bearer ${token}`;
    }
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let res;
    try {
      res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch (err) {
      throw new ApiError(0, "Network error", err && err.message);
    }
    if (!res.ok) {
      let detail = "";
      try {
        const j = await res.json();
        detail = (j.error && (j.error.message || j.error)) || j.message || "";
      } catch {
        /* non-JSON error body */
      }
      if (res.status === 401 && auth && onUnauthorized) onUnauthorized();
      throw new ApiError(res.status, `HTTP ${res.status}`, typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    if (res.status === 204) return null;
    return res.json();
  };
}
