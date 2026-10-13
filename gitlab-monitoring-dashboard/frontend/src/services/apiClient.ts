/**
 * Centralized, typed API client using native browser fetch.
 * Handles base URL configuration, query serialization, error envelope parsing, and network safety.
 */

export interface ApiErrorDetail {
  field: string;
  reason: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | null;
    requestId?: string | null;
  };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[] | null;
  public readonly requestId?: string | null;

  constructor(
    message: string,
    status: number,
    code = 'unknown_error',
    details?: ApiErrorDetail[] | null,
    requestId?: string | null
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '/api/v1';
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${cleanPath}`;

  if (!params) {
    return url;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...restOptions } = options;
  const fullUrl = buildUrl(path, params);

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...restOptions,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? `Network request failed: ${error.message}`
        : 'Network connection failed. Please check backend server status.';
    throw new ApiError(message, 0, 'network_error');
  }

  // Handle non-2xx responses
  if (!response.ok) {
    let errorCode = 'http_error';
    let errorMessage = `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
    let errorDetails: ApiErrorDetail[] | null = null;
    let requestId: string | null = null;

    try {
      const errorJson = (await response.json()) as ApiErrorEnvelope;
      if (errorJson && typeof errorJson === 'object' && errorJson.error) {
        errorCode = errorJson.error.code || errorCode;
        errorMessage = errorJson.error.message || errorMessage;
        errorDetails = errorJson.error.details || null;
        requestId = errorJson.error.requestId || null;
      }
    } catch {
      // Non-JSON error payload (e.g., gateway 502/504 HTML page), fallback to status message
    }

    throw new ApiError(
      errorMessage,
      response.status,
      errorCode,
      errorDetails,
      requestId
    );
  }

  // Parse successful response
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError(
      'Failed to parse JSON response from backend.',
      response.status,
      'invalid_json'
    );
  }
}

export const apiClient = {
  get<T>(path: string, params?: RequestOptions['params'], options?: RequestInit): Promise<T> {
    return apiRequest<T>(path, { ...options, method: 'GET', params });
  },
};
