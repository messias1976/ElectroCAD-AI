const configuredApiUrl = (import.meta.env.VITE_API_URL ?? '').trim();
export const API_URL = (configuredApiUrl || 'http://127.0.0.1:3000').replace(/\/$/, '');

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token');
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: options.signal ?? controller.signal });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = body?.message || response.statusText || 'Erro na comunicação com o servidor.';
      throw new Error(message);
    }
    if (response.status === 204) return null;
    return response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('O servidor demorou para responder. Tente novamente em alguns segundos.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
