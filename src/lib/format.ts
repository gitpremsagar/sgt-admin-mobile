import { format, isValid, parseISO } from 'date-fns';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const inrPrecise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export function formatCurrency(value: number | null | undefined, precise = false) {
  if (value == null || Number.isNaN(value)) return '—';
  return (precise ? inrPrecise : inr).format(value);
}

/** Compact Indian notation: 1.2 Cr, 3.4 L, 12.5 K. */
export function formatCompactCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)} K`;
  return `${sign}₹${abs.toFixed(0)}`;
}

export function formatNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—';
  return num.format(value);
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === 'string' ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

export function formatDate(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? format(d, 'dd MMM yyyy') : '—';
}

export function formatDateTime(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? format(d, 'dd MMM yyyy, hh:mm a') : '—';
}

export function formatTime(value: string | Date | null | undefined) {
  const d = toDate(value);
  return d ? format(d, 'hh:mm a') : '—';
}

/** yyyy-MM-dd in local time (backend treats these as IST calendar days). */
export function toYmd(value: Date) {
  return format(value, 'yyyy-MM-dd');
}

export function parseYmd(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
}

/** Indian financial year label like "2026-27" for the given date (FY starts 1 April). */
export function financialYearOf(date = new Date()) {
  const y = date.getFullYear();
  const start = date.getMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

export function recentFinancialYears(count = 4, date = new Date()) {
  const current = financialYearOf(date);
  const startYear = Number(current.slice(0, 4));
  return Array.from({ length: count }, (_, i) => {
    const s = startYear - i;
    return `${s}-${String((s + 1) % 100).padStart(2, '0')}`;
  });
}

export function toNumberOrNull(value: string | null | undefined): number | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function humanize(value: string | null | undefined) {
  if (!value) return '—';
  return value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
