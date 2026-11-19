import type { AccountRole, AgentProfile, AuthUser } from './types';

const AUTH_TOKEN_KEY = 'ejen_bahasa_session_token_v1';
let memoryFallbackToken: string | null = null;

export function getClientAuthToken(): string | null {
  if (memoryFallbackToken) return memoryFallbackToken;
  try {
    const sess = window.sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (sess) {
      memoryFallbackToken = sess;
      return sess;
    }
  } catch {
    // ignore storage restriction
  }
  try {
    const loc = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (loc) {
      memoryFallbackToken = loc;
      return loc;
    }
  } catch {
    // ignore storage restriction
  }
  return null;
}

export function setClientAuthToken(token: string | undefined, rememberMe: boolean): void {
  if (!token) return;
  memoryFallbackToken = token;
  try {
    window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore storage restriction
  }
  try {
    if (rememberMe) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore storage restriction
  }
}

export function clearClientAuthToken(): void {
  memoryFallbackToken = null;
  try {
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore storage restriction
  }
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore storage restriction
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T }> {
  const token = getClientAuthToken();
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

export async function fetchAuthSession(): Promise<{ authenticated: boolean; user?: AuthUser }> {
  try {
    const res = await requestJson<{ authenticated?: boolean; user?: AuthUser }>('/api/auth/session');
    if (res.ok && res.data.authenticated && res.data.user) {
      return { authenticated: true, user: res.data.user };
    }
    clearClientAuthToken();
    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

export async function loginAgent(payload: {
  username: string;
  password: string;
  rememberMe: boolean;
}): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  const res = await requestJson<{
    authenticated?: boolean;
    token?: string;
    user?: AuthUser;
    error?: string;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.ok && res.data.user) {
    setClientAuthToken(res.data.token, payload.rememberMe);
    return { ok: true, user: res.data.user };
  }
  return { ok: false, error: res.data.error || 'Log masuk gagal. Sila cuba lagi.' };
}

export async function registerAgentAccount(payload: {
  username: string;
  password: string;
  rememberMe: boolean;
  accountRole?: AccountRole;
  teacherCode?: string;
  fullName?: string;
  className?: string;
}): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  const res = await requestJson<{
    authenticated?: boolean;
    token?: string;
    user?: AuthUser;
    error?: string;
  }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.ok && res.data.user) {
    setClientAuthToken(res.data.token, payload.rememberMe);
    return { ok: true, user: res.data.user };
  }
  return { ok: false, error: res.data.error || 'Pendaftaran akaun gagal. Sila cuba lagi.' };
}

export async function resetAgentPassword(payload: {
  username: string;
  recoveryCode: string;
  newPassword: string;
}): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await requestJson<{ ok?: boolean; message?: string; error?: string }>(
    '/api/auth/forgot-password',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  if (res.ok && res.data.ok) {
    return { ok: true, message: res.data.message };
  }
  return { ok: false, error: res.data.error || 'Tetapan semula kata laluan gagal.' };
}

export async function logoutAgent(): Promise<void> {
  try {
    await requestJson('/api/auth/logout', { method: 'POST' });
  } finally {
    clearClientAuthToken();
  }
}

export async function saveServerAgentIdentity(payload: {
  name: string;
  className: string;
  codenameBadge: string;
}): Promise<{ ok: boolean; user?: AuthUser; profile?: AgentProfile; error?: string }> {
  const res = await requestJson<{ user?: AuthUser; profile?: AgentProfile; error?: string }>(
    '/api/agent/profile',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  if (res.ok && res.data.profile) {
    return { ok: true, user: res.data.user, profile: res.data.profile };
  }
  return { ok: false, error: res.data.error || 'Pengesahan identiti gagal pada pelayan.' };
}
