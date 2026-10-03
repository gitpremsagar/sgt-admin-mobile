import { api, cleanParams, path } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import type { Order, OrderItemScheme, PaginationA } from '@/types/models';

export const PENDING_STATUS_TYPE_ID = '699f1bcc58a2f2472223b361';
export const COMPLETED_STATUS_TYPE_ID = '699fac111dcdb78a50623ee9';

export interface OrderListParams {
  page?: number;
  limit?: number;
  orderStatusTypeId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  includeAllStatuses?: boolean;
}

export interface OrderLineInput {
  productId: string;
  quantity: number;
  itemDiscountPercent?: number | null;
  isFestivePrice?: boolean;
}

export interface CreateOrderBody {
  customerId: string;
  orderItems: OrderLineInput[];
  vehicleId?: string;
  driverId?: string;
  deliveryAddressId?: string;
  orderDate?: string;
  orderStatusTypeId?: string;
  isVerifiedByAdmin?: boolean;
  tallyInvoiceId?: string | null;
  narration?: string | null;
}

export interface UpdateOrderBody {
  orderStatusTypeId?: string | null;
  customerId?: string;
  vehicleId?: string;
  driverId?: string | null;
  deliveryAddressId?: string;
  orderDate?: string;
  tallyInvoiceId?: string | null;
  orderItems?: OrderLineInput[];
}

export interface AdminUnverifiedBody {
  orderItems: OrderLineInput[];
  vehicleId?: string | null;
  driverId?: string | null;
  deliveryAddressId?: string | null;
  orderDate?: string;
  orderStatusTypeId?: string | null;
  customerId?: string;
  tallyInvoiceId?: string | null;
}

type OrderRes = { order: Order };

const patch = async (template: string, id: string, body: object) =>
  (await api.patch<OrderRes>(path(template, { id }), body)).data.order;

export const orderService = {
  list: async (p: OrderListParams) => {
    const { includeAllStatuses, ...rest } = p;
    const { data } = await api.get<{ orders: Order[]; pagination: PaginationA }>(EP.ORDERS.LIST, {
      params: cleanParams({ ...rest, includeAllStatuses: includeAllStatuses ? 'true' : undefined }),
    });
    return data;
  },
  get: async (id: string) => (await api.get<{ order: Order | null }>(path(EP.ORDERS.ONE, { id }))).data.order,
  create: async (body: CreateOrderBody) => (await api.post<OrderRes>(EP.ORDERS.LIST, body)).data.order,
  update: async (id: string, body: UpdateOrderBody) =>
    (await api.put<OrderRes>(path(EP.ORDERS.ONE, { id }), body)).data.order,
  updateUnverified: async (id: string, body: AdminUnverifiedBody) => patch(EP.ORDERS.ADMIN_UNVERIFIED, id, body),
  remove: async (id: string) => {
    await api.delete(path(EP.ORDERS.ONE, { id }));
  },
  verifyStock: async (id: string) =>
    (await api.post<{ message: string; order: Order }>(path(EP.ORDERS.VERIFY_STOCK, { id }), {})).data,
  setStatus: (id: string, orderStatusTypeId: string) => patch(EP.ORDERS.STATUS, id, { orderStatusTypeId }),
  setVehicle: (id: string, vehicleId: string | null) => patch(EP.ORDERS.VEHICLE, id, { vehicleId }),
  setDriver: (id: string, driverId: string | null) => patch(EP.ORDERS.DRIVER, id, { driverId }),
  setDeliveryDate: (id: string, deliveryDate: string | null) =>
    patch(EP.ORDERS.DELIVERY_DATE, id, { deliveryDate }),
  setDiscount: (id: string, discountPercent: number) => patch(EP.ORDERS.DISCOUNT, id, { discountPercent }),
  setCashDiscount: (id: string, cashDiscountPercent: number) =>
    patch(EP.ORDERS.CASH_DISCOUNT, id, { cashDiscountPercent }),
  setLedgerBalance: (id: string, ledgerBalance: number | null) =>
    patch(EP.ORDERS.LEDGER_BALANCE, id, { ledgerBalance }),
  setNarration: (id: string, narration: string | null) => patch(EP.ORDERS.NARRATION, id, { narration }),
  setTallyInvoice: (id: string, tallyInvoiceId: string | null) =>
    patch(EP.ORDERS.TALLY_INVOICE, id, { tallyInvoiceId }),
  setReceivingStatus: (id: string, receivingStatus: 'PENDING' | 'RECEIVED') =>
    patch(EP.ORDERS.RECEIVING_STATUS, id, { receivingStatus }),
  schemes: async (id: string) =>
    (await api.get<{ schemes: OrderItemScheme[] }>(path(EP.ORDERS.SCHEMES, { id }))).data.schemes,
  setItemSchemeDiscount: async (orderId: string, itemId: string, schemeDiscountPercent: number) => {
    await api.patch(path(EP.ORDERS.ITEM_SCHEME_DISCOUNT, { orderId, itemId }), { schemeDiscountPercent });
  },
  setItemDiscount: async (orderId: string, itemId: string, itemDiscountPercent: number) => {
    await api.patch(path(EP.ORDERS.ITEM_DISCOUNT, { orderId, itemId }), { itemDiscountPercent });
  },
  setItemFestivePrice: async (orderId: string, itemId: string, isFestivePrice: boolean) => {
    await api.patch(path(EP.ORDERS.ITEM_FESTIVE_PRICE, { orderId, itemId }), { isFestivePrice });
  },
};
