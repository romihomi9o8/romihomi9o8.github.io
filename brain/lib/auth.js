// Google Identity Services (GIS) token client. Browser-only; the access token
// lives in memory, mirrored to sessionStorage (this tab only) so a reload
// does not force a new consent popup. Never localStorage, never cookies.

const GIS_SRC = "https://accounts.google.com/gsi/client";
const STORE_KEY = "brain.token";

let token = null; // { access_token, expires_at }
let tokenClient = null;
let gisPromise = null;

function storeGet() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function storeSet(v) {
  try {
    if (v) sessionStorage.setItem(STORE_KEY, JSON.stringify(v));
    else sessionStorage.removeItem(STORE_KEY);
  } catch {
    /* storage blocked: memory only */
  }
}

/** Load the GIS script once. Rejects on network failure or after `timeoutMs`. */
export function loadGis(timeoutMs = 10000) {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    const timer = setTimeout(() => reject(new Error("Timed out loading Google sign-in")), timeoutMs);
    s.onload = () => {
      clearTimeout(timer);
      if (window.google && window.google.accounts && window.google.accounts.oauth2) resolve();
      else reject(new Error("Google sign-in loaded but is unavailable"));
    };
    s.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Could not load Google sign-in (offline or blocked)"));
    };
    document.head.appendChild(s);
  }).catch((err) => {
    gisPromise = null; // allow retry
    throw err;
  });
  return gisPromise;
}

/** A still-valid token from this tab's session, if any. */
export function restoreToken() {
  const t = storeGet();
  if (t && t.access_token && t.expires_at > Date.now() + 60000) {
    token = t;
    return true;
  }
  storeSet(null);
  return false;
}

export function getToken() {
  if (token && token.expires_at > Date.now()) return token.access_token;
  return null;
}

export function isSignedIn() {
  return Boolean(getToken());
}

/**
 * Create the token client. `onToken()` fires after a successful grant;
 * `onError(message)` on denial/popup failure.
 */
export function initAuth({ clientId, scope, onToken, onError }) {
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope,
    prompt: "",
    callback: (resp) => {
      if (!resp || resp.error) {
        onError && onError((resp && (resp.error_description || resp.error)) || "Sign-in failed");
        return;
      }
      const missing = scope.split(" ").filter((s) => !window.google.accounts.oauth2.hasGrantedAllScopes(resp, s));
      token = { access_token: resp.access_token, expires_at: Date.now() + (Number(resp.expires_in) || 3600) * 1000 };
      storeSet(token);
      onToken && onToken({ missingScopes: missing });
    },
    error_callback: (err) => {
      onError && onError((err && (err.message || err.type)) || "Sign-in popup was closed");
    },
  });
}

/** Open the consent popup (must be called from a click handler). */
export function requestToken() {
  if (!tokenClient) throw new Error("Sign-in is not ready yet");
  tokenClient.requestAccessToken();
}

/** Forget the token locally (e.g. after a 401). */
export function dropToken() {
  token = null;
  storeSet(null);
}

/** Revoke the token with Google and forget it. */
export function signOut() {
  const t = token && token.access_token;
  dropToken();
  return new Promise((resolve) => {
    if (t && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(t, () => resolve());
        return;
      } catch {
        /* fall through */
      }
    }
    resolve();
  });
}
