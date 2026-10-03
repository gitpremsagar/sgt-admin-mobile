import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_URL } from '@/lib/config';
import type { AuthResponse, AuthUser } from '@/types/auth';

import { clearRefreshToken, getRefreshToken, setRefreshToken } from './token-storage';

type SessionListener = {
  onRefreshed?: (user: AuthUser, accessToken: string) => void;
  onExpired?: () => void;
};

let accessToken: string | null = null;
let listener: SessionListener = {};

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setSessionListener(next: SessionListener) {
  listener = next;
}

/** Unauthenticated instance used for login and refresh. */
export const publicApi = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

let refreshPromise: Promise<AuthResponse> | null = null;

/** Single-flight refresh: concurrent 401s share one call because the backend rotates refresh tokens. */
export function refreshSession(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await publicApi.post<AuthResponse>('/auth/refresh-access-token', { refreshToken });
      accessToken = data.accessToken;
      await setRefreshToken(data.refreshToken);
      listener.onRefreshed?.(data.user, data.accessToken);
      return data;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        await refreshSession();
        original.headers.set('Authorization', `Bearer ${accessToken}`);
        return api(original);
      } catch {
        accessToken = null;
        await clearRefreshToken();
        listener.onExpired?.();
      }
    }
    return Promise.reject(error);
  }
);

/** Replace `:param` placeholders in an endpoint path. */
export function path(template: string, params: Record<string, string | number>) {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, encodeURIComponent(String(value))),
    template
  );
}

/** Drop undefined, null, empty-string and "all" values from query params. */
export function cleanParams<T extends object>(params: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || v === 'all') continue;
    out[k] = v;
  }
  return out as Partial<T>;
}
