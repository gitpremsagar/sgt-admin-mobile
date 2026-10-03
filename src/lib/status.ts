import type { Tone } from '@/components/ui/feedback';
import type { AttendanceStatus } from '@/services/attendance';
import type { OrderStatusType, Product, PurchaseTransportStatus } from '@/types/models';

import { humanize } from './format';

export function orderStatusLabel(s: OrderStatusType | null | undefined) {
  if (!s) return 'No status';
  return s.displayName || humanize(s.name);
}

export function orderStatusTone(name: string | null | undefined): Tone {
  switch (name) {
    case 'PENDING':
    case 'MODIFYING':
      return 'warning';
    case 'FINALIZED':
    case 'PULLING':
    case 'LOADING':
    case 'LOADED':
      return 'primary';
    case 'OUT_FOR_DELIVERY':
    case 'REACHED_DESTINATION':
    case 'UNLOADING':
    case 'UNLOADED':
    case 'VEHICLE_COMING_BACK':
    case 'VEHICLE_CAME_BACK':
      return 'info';
    case 'COMPLETE':
    case 'COMPLETED':
      return 'success';
    default:
      return 'neutral';
  }
}

export function purchaseStatusTone(s: PurchaseTransportStatus): Tone {
  switch (s) {
    case 'PENDING':
      return 'neutral';
    case 'LOADING':
    case 'LOADED':
      return 'warning';
    case 'IN_TRANSIT':
    case 'ARRIVED':
    case 'UNLOADING':
      return 'info';
    case 'UNLOADED':
    case 'EXITED':
      return 'primary';
    case 'COMPLETED':
      return 'success';
  }
}

export function stockLevel(p: Pick<Product, 'stockQuantity' | 'lowStockLimit' | 'overStockLimit'>): {
  label: string;
  tone: Tone;
} {
  const qty = p.stockQuantity ?? 0;
  if (qty <= 0) return { label: 'Out of stock', tone: 'danger' };
  if (qty <= p.lowStockLimit) return { label: 'Low', tone: 'warning' };
  if (p.overStockLimit && qty >= p.overStockLimit) return { label: 'Overstock', tone: 'info' };
  return { label: 'Healthy', tone: 'success' };
}

export function attendanceTone(s: AttendanceStatus): Tone {
  switch (s) {
    case 'PRESENT':
      return 'success';
    case 'HALF_DAY':
      return 'warning';
    case 'ABSENT':
      return 'danger';
    case 'IN_PROGRESS':
      return 'info';
    case 'HOLIDAY':
      return 'primary';
    default:
      return 'neutral';
  }
}
