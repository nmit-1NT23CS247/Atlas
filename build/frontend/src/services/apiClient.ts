/**
 * Central API client configuration
 * Evaluates VITE_USE_MOCK to seamlessly toggle between mock store and real REST backend
 */
export const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === undefined
    ? true
    : import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === true;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://gitlab-ci.internal.corp/api/v1';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData?.message) {
        errorMsg = errorData.message;
      }
    } catch {
      // Keep default error message
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}
