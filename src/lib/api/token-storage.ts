import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REFRESH_KEY = 'sgt_admin_refresh_token';

// SecureStore is native-only; the web build (dev convenience) falls back to localStorage.
const webStorage = typeof localStorage !== 'undefined' ? localStorage : null;

export async function getRefreshToken(): Promise<string | null> {
  if (Platform.OS === 'web') return webStorage?.getItem(REFRESH_KEY) ?? null;
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage?.setItem(REFRESH_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(REFRESH_KEY, token);
}

export async function clearRefreshToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage?.removeItem(REFRESH_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
