// lib/api-client.js
// Client-side API utilities with authentication

/**
 * Gets the panel code from sessionStorage
 * @returns {string|null}
 */
export function getPanelCode() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('panelCode');
}

/**
 * Creates headers with panel authentication
 * @param {HeadersInit} additionalHeaders - Additional headers to include
 * @returns {Headers}
 */
export function createAuthHeaders(additionalHeaders = {}) {
  const headers = new Headers(additionalHeaders);
  const panelCode = getPanelCode();
  
  if (panelCode) {
    headers.set('x-panel-code', panelCode);
  }
  
  return headers;
}

/**
 * Authenticated fetch wrapper that automatically includes panel code
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}) {
  const authHeaders = createAuthHeaders(options.headers);
  
  return fetch(url, {
    ...options,
    headers: authHeaders,
  });
}

/**
 * Authenticated JSON fetch that handles common patterns
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<{ok: boolean, data?: any, error?: string}>}
 */
export async function authenticatedFetchJSON(url, options = {}) {
  try {
    const response = await authenticatedFetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    
    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : (data?.error || `HTTP ${response.status}`),
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Network error',
    };
  }
}