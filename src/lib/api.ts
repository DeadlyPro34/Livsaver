export const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const customKey = localStorage.getItem("lifesaver_api_key");
  const headers = new Headers(init?.headers);
  
  if (customKey) {
    headers.set("x-gemini-api-key", customKey);
  }

  return fetch(input, {
    ...init,
    headers,
  });
};
