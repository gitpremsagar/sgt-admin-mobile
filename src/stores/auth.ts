import { create } from 'zustand';

import {
  publicApi,
  refreshSession,
  setAccessToken,
  setSessionListener,
} from '@/lib/api/client';
import { getErrorStatus } from '@/lib/api/errors';
import { clearRefreshToken, getRefreshToken, setRefreshToken } from '@/lib/api/token-storage';
import { ADMIN_ROLES } from '@/lib/config';
import { queryClient } from '@/lib/query-client';
import type { AuthResponse, AuthUser } from '@/types/auth';

type Status = 'loading' | 'authed' | 'guest' | 'forbidden';

type AuthState = {
  status: Status;
  user: AuthUser | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => void;
};

export function isAdmin(user: AuthUser | null | undefined) {
  return !!user && (ADMIN_ROLES as readonly string[]).includes(user.userType);
}

export function isSuperAdmin(user: AuthUser | null | undefined) {
  return user?.userType === 'SUPER_ADMIN';
}

/** Keeps the splash screen from hanging on a slow network during session restore. */
const BOOTSTRAP_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Session restore timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function revokeSession() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await publicApi.post('/auth/log-out', { refreshToken }).catch(() => undefined);
  }
  setAccessToken(null);
  await clearRefreshToken();
  queryClient.clear();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  user: null,

  bootstrap: async () => {
    setSessionListener({
      onRefreshed: (user) => set({ user }),
      onExpired: () => {
        queryClient.clear();
        set({ status: 'guest', user: null });
      },
    });
    const existing = await getRefreshToken();
    if (!existing) {
      set({ status: 'guest' });
      return;
    }
    try {
      const { user } = await withTimeout(refreshSession(), BOOTSTRAP_TIMEOUT_MS);
      if (!isAdmin(user)) {
        await revokeSession();
        set({ status: 'forbidden', user });
        return;
      }
      set({ status: 'authed', user });
    } catch (error) {
      const status = getErrorStatus(error);
      // Keep the token on network/server failures so the next launch can retry.
      if (status === 401 || status === 403) await clearRefreshToken();
      set({ status: 'guest', user: null });
    }
  },

  login: async (email, password) => {
    const { data } = await publicApi.post<AuthResponse>('/auth/log-in', { email, password });
    if (!isAdmin(data.user)) {
      setAccessToken(data.accessToken);
      await setRefreshToken(data.refreshToken);
      await revokeSession();
      set({ status: 'forbidden', user: data.user });
      return;
    }
    setAccessToken(data.accessToken);
    await setRefreshToken(data.refreshToken);
    set({ status: 'authed', user: data.user });
  },

  logout: async () => {
    await revokeSession();
    set({ status: 'guest', user: null });
  },

  setUser: (user) => set({ user: { ...get().user, ...user } }),
}));
