import { api, cleanParams, path } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import type { CreditNote, PaginationA, SalesReturn } from '@/types/models';

export interface ReturnLine {
  productId: string;
  quantity: number;
}

type ListParams = { customerId?: string; startDate?: string; endDate?: string; page?: number; limit?: number };

export const salesReturnService = {
  list: async (p: ListParams = {}) =>
    (
      await api.get<{ salesReturns: SalesReturn[]; pagination?: PaginationA }>(EP.SALES_RETURNS.LIST, {
        params: cleanParams(p),
      })
    ).data,
  get: async (id: string) =>
    (await api.get<{ salesReturn: SalesReturn }>(path(EP.SALES_RETURNS.ONE, { id }))).data.salesReturn,
  create: async (body: {
    customerId: string;
    orderId: string;
    returnDate: string;
    returnReason: string;
    items: ReturnLine[];
  }) => (await api.post<{ salesReturn: SalesReturn }>(EP.SALES_RETURNS.LIST, body)).data.salesReturn,
  update: async (id: string, body: { returnDate?: string; returnReason?: string; items?: ReturnLine[] }) =>
    (await api.patch<{ salesReturn: SalesReturn }>(path(EP.SALES_RETURNS.ONE, { id }), body)).data.salesReturn,
  remove: async (id: string) => {
    await api.delete(path(EP.SALES_RETURNS.ONE, { id }));
  },
};

export const creditNoteService = {
  list: async (p: ListParams = {}) =>
    (
      await api.get<{ creditNotes: CreditNote[]; pagination?: PaginationA }>(EP.CREDIT_NOTES.LIST, {
        params: cleanParams(p),
      })
    ).data,
  get: async (id: string) =>
    (await api.get<{ creditNote: CreditNote }>(path(EP.CREDIT_NOTES.ONE, { id }))).data.creditNote,
  create: async (body: {
    customerId: string;
    orderId: string;
    noteDate: string;
    noteReason: string;
    items: ReturnLine[];
  }) => (await api.post<{ creditNote: CreditNote }>(EP.CREDIT_NOTES.LIST, body)).data.creditNote,
  update: async (id: string, body: { noteDate?: string; noteReason?: string; items?: ReturnLine[] }) =>
    (await api.patch<{ creditNote: CreditNote }>(path(EP.CREDIT_NOTES.ONE, { id }), body)).data.creditNote,
  remove: async (id: string) => {
    await api.delete(path(EP.CREDIT_NOTES.ONE, { id }));
  },
};
