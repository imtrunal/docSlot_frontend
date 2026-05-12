import { forceLogout } from "./auth";

export const apiFetch = async (
  url: string,
  options: RequestInit = {}
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(options.headers || {}),
    },
  });

  // 🔥 AUTO LOGOUT ON TOKEN EXPIRY / 401
  if (response.status === 401) {
    forceLogout(undefined, "Session expired. Please login again.");
    throw new Error("Unauthorized");
  }

  return response;
};
