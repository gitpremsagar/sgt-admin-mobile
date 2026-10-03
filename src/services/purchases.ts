import { api, cleanParams, path } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import type { PaginationA, Purchase, PurchaseTransportStatus } from '@/types/models';

export interface PurchaseBody {
  transporterId: string;
  vehicleNumber?: string | null;
  driverContact?: string | null;
  purchaseTransportStatus?: PurchaseTransportStatus;
  markedArrivedAt?: string | null;
  invoices: {
    invoiceID: string;
    invoiceDate?: string | null;
    invoiceAmount?: number | null;
    items: { productId: string; quantity: number }[];
  }[];
}

export type ManualDatetimePatch = Partial<{
  purchaseDate: string;
  markedArrivedAt: string | null;
  TargetUnloadingDate: string | null;
  markedUnloadedAt: string | null;
  VehicleExitedAt: string | null;
}>;

export const TRANSPORT_STATUSES: PurchaseTransportStatus[] = [
  'PENDING',
  'LOADING',
  'LOADED',
  'IN_TRANSIT',
  'ARRIVED',
  'UNLOADING',
  'UNLOADED',
  'EXITED',
  'COMPLETED',
];

export type BoardColumn = 'loading' | 'transit' | 'unloaded';

export function boardColumnOf(status: PurchaseTransportStatus): BoardColumn {
  if (status === 'PENDING' || status === 'LOADING' || status === 'LOADED') return 'loading';
  if (status === 'UNLOADED' || status === 'EXITED' || status === 'COMPLETED') return 'unloaded';
  return 'transit';
}

type PurchaseRes = { purchase: Purchase };

export const purchaseService = {
  active: async () => (await api.get<{ purchases: Purchase[] }>(EP.PURCHASES.ACTIVE)).data.purchases ?? [],
  history: async (p: { page?: number; limit?: number; startDate: string; endDate: string; transporterId?: string; status?: string }) =>
    (
      await api.get<{ purchases: Purchase[]; pagination: PaginationA }>(EP.PURCHASES.LIST, {
        params: cleanParams(p),
      })
    ).data,
  get: async (id: string) => (await api.get<PurchaseRes>(path(EP.PURCHASES.ONE, { id }))).data.purchase,
  create: async (body: PurchaseBody) => (await api.post<PurchaseRes>(EP.PURCHASES.LIST, body)).data.purchase,
  update: async (id: string, body: PurchaseBody) =>
    (await api.put<PurchaseRes>(path(EP.PURCHASES.ONE, { id }), body)).data.purchase,
  remove: async (id: string) => {
    await api.delete(path(EP.PURCHASES.ONE, { id }));
  },
  setStatus: async (id: string, purchaseTransportStatus: PurchaseTransportStatus) =>
    (await api.patch<PurchaseRes>(path(EP.PURCHASES.STATUS, { id }), { purchaseTransportStatus })).data.purchase,
  setManualDatetimes: async (id: string, body: ManualDatetimePatch) =>
    (await api.patch<PurchaseRes>(path(EP.PURCHASES.MANUAL_DATETIMES, { id }), body)).data.purchase,
  setGrn: async (id: string, grnNumber: string | null) =>
    (await api.patch<PurchaseRes>(path(EP.PURCHASES.GRN, { id }), { grnNumber })).data.purchase,
  addToStock: async (id: string) =>
    (await api.post<PurchaseRes>(path(EP.PURCHASES.ADD_TO_STOCK, { id }))).data.purchase,
  syncPricing: async (id: string) =>
    (
      await api.post<{ purchase: Purchase; updatedItemCount: number; message: string }>(
        path(EP.PURCHASES.SYNC_PRICING, { id })
      )
    ).data,
};
