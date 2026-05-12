export async function authFetch(
  url: string,
  options: RequestInit = {}
) {
  const response = await fetch(url, {
    ...options,
    credentials: "include", // REQUIRED for session cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    // Session expired or not logged in
    localStorage.clear(); // optional
    window.location.href = "/signin";
    throw new Error("Session expired");
  }

  return response;
}
