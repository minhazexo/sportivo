type QueryParams = Record<string, string | number | boolean> | undefined;

let cachedCsrfToken: string | null = null;

function buildUrl(path: string, params?: QueryParams) {
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Decide routing base path
  let base = '/api';
  const sportsEndpoints = ['/scores', '/fixtures', '/standings', '/teams', '/team', '/search-teams', '/match', '/news'];
  if (sportsEndpoints.some(endpoint => normalizedPath.startsWith(endpoint))) {
    base = '/api/sports';
  } else if (normalizedPath.startsWith('/api')) {
    // If it already has /api prefix, remove it to prevent duplication
    normalizedPath = normalizedPath.substring(4);
  }

  const url = new URL(base + normalizedPath, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== 'undefined') {
        url.searchParams.append(k, String(v));
      }
    });
  }

  return url.toString();
}

async function getCsrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;
  try {
    const url = buildUrl('/csrf-token');
    const res = await fetch(url, { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      cachedCsrfToken = data.csrfToken;
      return cachedCsrfToken || '';
    }
  } catch (err) {
    console.error('[CSRF] Failed to fetch CSRF token:', err);
  }
  return '';
}

async function request(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any,
  params?: QueryParams,
  timeout = 15000
): Promise<any> {
  const url = buildUrl(path, params);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {};

    // 1. Fetch and inject custom Bearer Authorization Token if logged in
    const token = localStorage.getItem('sportivo_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Fetch and inject CSRF token for mutating methods
    if (method !== 'GET') {
      const csrfToken = await getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      if (body) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'same-origin',
    });

    clearTimeout(timer);

    if (res.status === 403) {
      // CSRF token might have expired. Clear and retry once
      cachedCsrfToken = null;
      if (method !== 'GET') {
        const freshCsrfToken = await getCsrfToken();
        if (freshCsrfToken) {
          headers['X-CSRF-Token'] = freshCsrfToken;
          const retryRes = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
            credentials: 'same-origin',
          });
          if (retryRes.ok) {
            return await retryRes.json();
          }
        }
      }
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let errorMsg = `HTTP ${res.status} ${res.statusText}`;
      try {
        const errObj = JSON.parse(text);
        errorMsg = errObj.message || errObj.error || errorMsg;
      } catch {
        if (text) errorMsg = `${errorMsg}: ${text}`;
      }
      throw new Error(errorMsg);
    }

    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function get(path: string, params?: QueryParams, retries = 1, retryDelay = 500): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await request('GET', path, undefined, params);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
    }
  }
}

async function post(path: string, body: any): Promise<any> {
  return await request('POST', path, body);
}

async function put(path: string, body: any): Promise<any> {
  return await request('PUT', path, body);
}

async function del(path: string): Promise<any> {
  return await request('DELETE', path);
}

async function upload(path: string, file: File): Promise<any> {
  const token = localStorage.getItem('sportivo_auth_token');
  const url = buildUrl(path);

  // Get CSRF token first
  const csrfToken = await getCsrfToken();

  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let errorMsg = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errObj = JSON.parse(text);
      errorMsg = errObj.message || errObj.error || errorMsg;
    } catch {
      if (text) errorMsg = `${errorMsg}: ${text}`;
    }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export default { get, post, put, delete: del, upload };
export { get, post, put, del as delete, upload };
