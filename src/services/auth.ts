import { api } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import type { AuthUser } from '@/types/auth';

export const authService = {
  async getProfile(): Promise<AuthUser> {
    const { data } = await api.get<{ user: AuthUser }>(EP.AUTH.PROFILE);
    return data.user;
  },
  async updateProfile(body: { name?: string; phone?: string | null; email?: string }): Promise<AuthUser> {
    const { data } = await api.patch<{ user: AuthUser }>(EP.AUTH.PROFILE, body);
    return data.user;
  },
  async changePassword(body: { oldPassword: string; newPassword: string; confirmNewPassword: string }) {
    const { data } = await api.post<{ message: string }>(EP.AUTH.CHANGE_PASSWORD, body);
    return data;
  },
};
