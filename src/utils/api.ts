// api.ts (GLOBAL FETCH WRAPPER)

const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE}/refresh-token`, {
    method: "POST",
    headers: {
      "x-refresh-token": refreshToken,
    },
  });

  if (!res.ok) return null;

  const data = await res.json();

  localStorage.setItem("token", data.token);
  return data.token;
}

export async function apiFetch(url: string, options: any = {}) {
  let token = getToken();

  const res = await fetch(API_BASE + url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: "Bearer " + token,
    },
  });

  // If token expired → refresh token
  if (res.status === 401) {
    console.warn("⛔ Token expired — refreshing...");

    const newToken = await refreshAccessToken();

    if (!newToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return;
    }

    // Retry the original request with new token
    return fetch(API_BASE + url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: "Bearer " + newToken,
      },
    });
  }

  return res;
}
