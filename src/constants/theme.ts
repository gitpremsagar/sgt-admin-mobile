import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    border: '#E2E8F0',
    primary: '#1E40AF',
    primaryText: '#FFFFFF',
    primarySoft: '#DBEAFE',
    success: '#15803D',
    successSoft: '#DCFCE7',
    warning: '#B45309',
    warningSoft: '#FEF3C7',
    danger: '#B91C1C',
    dangerSoft: '#FEE2E2',
    info: '#0E7490',
    infoSoft: '#CFFAFE',
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  dark: {
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    background: '#020617',
    card: '#0F172A',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    border: '#1E293B',
    primary: '#60A5FA',
    primaryText: '#0B1220',
    primarySoft: '#1E3A8A',
    success: '#4ADE80',
    successSoft: '#14532D',
    warning: '#FBBF24',
    warningSoft: '#78350F',
    danger: '#F87171',
    dangerSoft: '#7F1D1D',
    info: '#22D3EE',
    infoSoft: '#164E63',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const MaxContentWidth = 800;
