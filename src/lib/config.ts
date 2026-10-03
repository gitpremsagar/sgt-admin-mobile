const DEFAULT_API = 'https://api.srigopaltraders.com';
const DEFAULT_WEB = 'https://www.srigopaltraders.com';

export const BASE_API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API).replace(/\/+$/, '');
export const API_URL = `${BASE_API_URL}/api`;
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || DEFAULT_WEB).replace(/\/+$/, '');

export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const;
