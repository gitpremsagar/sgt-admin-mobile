import { api, path } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import type { DispatchTrip, PendingDistributor } from '@/types/models';

export interface DispatchTripBody {
  tripNumber?: number;
  tripDate?: string;
  distributorId?: string | null;
  orderId?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
  remarks?: string | null;
  vehiclePosition?: number | null;
}

export const dispatchService = {
  list: async (date: string) =>
    (await api.get<{ dispatchTrips: DispatchTrip[] }>(EP.DISPATCH_TRIPS.LIST, { params: { date } })).data
      .dispatchTrips,
  get: async (id: string) =>
    (await api.get<{ dispatchTrip: DispatchTrip }>(path(EP.DISPATCH_TRIPS.ONE, { id }))).data.dispatchTrip,
  create: async (body: DispatchTripBody) =>
    (await api.post<{ dispatchTrip: DispatchTrip }>(EP.DISPATCH_TRIPS.LIST, body)).data.dispatchTrip,
  update: async (id: string, body: DispatchTripBody) =>
    (await api.put<{ dispatchTrip: DispatchTrip }>(path(EP.DISPATCH_TRIPS.ONE, { id }), body)).data.dispatchTrip,
  remove: async (id: string) => {
    await api.delete(path(EP.DISPATCH_TRIPS.ONE, { id }));
  },
  pending: async () =>
    (await api.get<{ pendingDistributors: PendingDistributor[] }>(EP.DISPATCH_TRIPS.PENDING)).data
      .pendingDistributors,
  addPending: async (distributorId: string, remarks?: string | null) => {
    await api.post(EP.DISPATCH_TRIPS.PENDING, { distributorId, remarks: remarks ?? null });
  },
  updatePending: async (id: string, remarks: string | null) => {
    await api.patch(path(EP.DISPATCH_TRIPS.PENDING_ONE, { id }), { remarks });
  },
  removePending: async (id: string) => {
    await api.delete(path(EP.DISPATCH_TRIPS.PENDING_ONE, { id }));
  },
};
