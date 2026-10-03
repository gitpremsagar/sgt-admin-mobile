import { api, cleanParams, path } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import type { Order, PaginationA, PaginationB } from '@/types/models';

/* ---------- Forecasts ---------- */

export interface DistributorWithForecasts {
  id: string;
  name: string;
  email: string;
  CustomerDetail: { id: string; dbName: string }[];
  Forecast: { id: string; forecastDate: string }[];
}

export interface ForecastItem {
  id: string;
  productId: string;
  quantity: number;
  Product: { id: string; name: string; productCode: string; mrp: number };
}

export interface Forecast {
  id: string;
  distributorId: string;
  forecastDate: string;
  Distributor?: { id: string; name: string; CustomerDetail?: { dbName?: string; dbCategory: string }[] };
  ForecastItem: ForecastItem[];
}

export interface ForecastReport {
  forecast: Forecast;
  comparison: {
    productId: string;
    productName: string;
    productCode: string;
    mrp: number;
    forecastQty: number;
    billedQty: number;
    balance: number;
  }[];
  productsNotInForecast: { id: string; name: string; productCode: string; billedQty: number }[];
  monthYear: { year: number; month: number };
}

export const forecastService = {
  distributors: async () =>
    (
      await api.get<{ distributors: DistributorWithForecasts[]; pagination: PaginationA }>(
        EP.CUSTOMERS.WITH_FORECASTS,
        { params: { page: 1, limit: 1000 } }
      )
    ).data.distributors,
  byDistributor: async (distributorId: string) =>
    (
      await api.get<{ forecasts: { id: string; forecastDate: string }[]; distributor: { id: string; name: string } }>(
        path(EP.ORDER_FORECASTS.BY_DISTRIBUTOR, { distributorId }),
        { params: { page: 1, limit: 1000 } }
      )
    ).data,
  get: async (id: string) =>
    (await api.get<{ forecast: Forecast }>(path(EP.ORDER_FORECASTS.ONE, { id }))).data.forecast,
  report: async (id: string) => (await api.get<ForecastReport>(path(EP.ORDER_FORECASTS.REPORT, { id }))).data,
  create: async (body: {
    distributorId: string;
    forecastDate?: string;
    forecastItems: { productId: string; quantity: number }[];
  }) => (await api.post<{ forecast: Forecast }>(EP.ORDER_FORECASTS.LIST, body)).data.forecast,
  update: async (
    id: string,
    body: { forecastDate?: string; forecastItems?: { productId: string; quantity: number }[] }
  ) => {
    await api.put(path(EP.ORDER_FORECASTS.ONE, { id }), body);
  },
  remove: async (id: string) => {
    await api.delete(path(EP.ORDER_FORECASTS.ONE, { id }));
  },
};

/* ---------- Sales history ---------- */

export interface SalesHistoryParams {
  page?: number;
  limit?: number;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  vehicleNumber?: string;
  driverName?: string;
}

export const salesHistoryService = {
  list: async (p: SalesHistoryParams) =>
    (
      await api.get<{ orders: Order[]; pagination: PaginationA }>(EP.ORDERS.SALES_HISTORY, {
        params: cleanParams(p),
      })
    ).data,
  create: async (body: {
    customerId: string;
    orderItems: { productId: string; quantity: number }[];
    vehicleId?: string;
    orderDate?: string;
    tallyInvoiceId?: string | null;
  }) => {
    await api.post(EP.ORDERS.SALES_HISTORY, body);
  },
};

/* ---------- Party-wise sales ---------- */

export interface PartyRow {
  lastBillingDate: string | null;
  avgMonthlyVehicles: number;
  vehiclesSoldTillDate: number;
  dailySales: number[];
  monthTotals: { current: number; prev1: number; prev2: number };
  targetAmount: number | null;
  targetVehicles: number | null;
  balanceAmountTarget: number | null;
  balanceVehicleTarget: number | null;
}

export interface PartyWiseSales {
  monthLabel: string;
  year: number;
  month: number;
  monthLabels: { current: string; prev1: string; prev2: string };
  tags: {
    id: string;
    name: string;
    headerColor: string;
    parties: (PartyRow & { customerId: string; partyName: string })[];
    subtotal: PartyRow;
  }[];
  grandTotal: PartyRow;
  compare: { prev1Percent: number | null; prev2Percent: number | null; vehicleSoldPercent: number | null };
}

export const partyWiseSalesService = {
  get: async (year: number, month: number) =>
    (
      await api.get<PartyWiseSales>(EP.REPORTS.PARTY_WISE_SALES, {
        params: { year, month, timeZone: 'Asia/Kolkata' },
      })
    ).data,
  setTarget: async (body: {
    customerId: string;
    year: number;
    month: number;
    targetAmount?: number | null;
    targetVehicles?: number | null;
  }) => {
    await api.put(EP.REPORTS.PARTY_WISE_SALES_TARGETS, body);
  },
};

/* ---------- Product vehicle-wise ---------- */

export interface ProductVehicleWise {
  date: string;
  dateLabel: string;
  columns: { id: string; vehicleLabel: string; subtitle: string; vehicleId: string; customerId: string }[];
  products: {
    productId: string;
    mrp: number;
    name: string;
    productCode: string;
    quantities: Record<string, number>;
    rowTotal: number;
  }[];
  columnTotals: Record<string, number>;
  grandTotal: number;
}

export const productVehicleWiseService = {
  get: async (date: string) =>
    (
      await api.get<ProductVehicleWise>(EP.REPORTS.PRODUCT_VEHICLE_WISE, {
        params: { date, includeZeroProducts: 'false' },
      })
    ).data,
};

/* ---------- Opening stock / stock status ---------- */

export interface DailyFields {
  allocation: number | null;
  dip: number | null;
  pendingQuantity: number | null;
  arsQuantity: number | null;
  manualOrderQuantity: number | null;
  requirement: number | null;
  tallyQuantity: number | null;
  dmsQuantity: number | null;
  tallyRemark: string | null;
  dmsRemark: string | null;
}

export interface StockStatusRow extends DailyFields {
  productId: string;
  productName: string;
  productCode: string;
  mrp: number | null;
  openingStock: number;
  inwardQuantity: number;
  outwardQuantity: number;
  closingStock: number;
  onPassageQuantity: number;
}

export interface StockMovement {
  id: string;
  changeType: 'INCREASE' | 'DECREASE' | null;
  changeInStock: number;
  reason: string;
  changeDate: string;
  userName: string;
  orderCustomId: string | null;
  orderDbName: string | null;
}

export const openingStockService = {
  report: async (date: string) =>
    (await api.get<{ date: string; rows: StockStatusRow[] }>(EP.OPENING_STOCK.REPORT, { params: { date } })).data
      .rows,
  movements: async (date: string, productId: string) =>
    (
      await api.get<{ productName: string; inward: StockMovement[]; outward: StockMovement[] }>(
        EP.OPENING_STOCK.MOVEMENTS,
        { params: { date, productId } }
      )
    ).data,
  updateDailyFields: async (body: { date: string; productId: string } & Partial<DailyFields>) => {
    await api.patch(EP.OPENING_STOCK.DAILY_FIELDS, body);
  },
};

/* ---------- Product allocations ---------- */

export interface AllocationBatch {
  id: string;
  stockQuantity: number;
  arrivalDate: string;
  expiryDate: string;
  invoice: { id: string; invoiceID: string | null; invoiceDate: string | null } | null;
}

export interface AllocationHeader {
  id: string;
  productId: string;
  stockBatchIds: string[];
  allocationDate: string;
  receivedQty: number;
  notes: string | null;
  product: { id: string; name: string; productCode: string };
  stockBatches: AllocationBatch[];
  createdBy: { id: string; name: string };
  allocatedTotal: number;
  remainingToAllocate: number;
  partyCount: number;
  billedTotal: number;
}

export interface AllocationParty {
  customerId: string;
  dbName: string;
  name: string;
  dbCategory: string | null;
  partyReportTag: { id: string; name: string } | null;
  lineId: string | null;
  allocatedQty: number;
  avgSaleLast3Months: number;
  lastBillDate: string | null;
  bills: { billDate: string; billQty: number }[];
  billedQty: number;
  balanceQty: number;
}

export const allocationService = {
  list: async (p: { page?: number; limit?: number; productId?: string }) =>
    (
      await api.get<{ allocations: AllocationHeader[]; pagination: PaginationB }>(EP.PRODUCT_ALLOCATIONS.LIST, {
        params: cleanParams({ page: 1, limit: 50, ...p }),
      })
    ).data,
  get: async (id: string) =>
    (
      await api.get<{ allocation: AllocationHeader & { parties: AllocationParty[] } }>(
        path(EP.PRODUCT_ALLOCATIONS.ONE, { id })
      )
    ).data.allocation,
  create: async (body: {
    productId: string;
    stockBatchIds: string[];
    allocationDate: string;
    notes?: string | null;
    lines?: { customerId: string; allocatedQty: number }[];
  }) => (await api.post<{ allocation: AllocationHeader }>(EP.PRODUCT_ALLOCATIONS.LIST, body)).data.allocation,
  update: async (
    id: string,
    body: { allocationDate?: string; notes?: string | null; lines?: { customerId: string; allocatedQty: number }[] }
  ) => {
    await api.patch(path(EP.PRODUCT_ALLOCATIONS.ONE, { id }), body);
  },
  remove: async (id: string) => {
    await api.delete(path(EP.PRODUCT_ALLOCATIONS.ONE, { id }));
  },
  addFulfillment: async (id: string, lineId: string, body: { billDate: string; billQty: number }) => {
    await api.post(path(EP.PRODUCT_ALLOCATIONS.FULFILLMENTS, { id, lineId }), body);
  },
  updateFulfillment: async (fulfillmentId: string, body: { billDate?: string; billQty?: number }) => {
    await api.patch(path(EP.PRODUCT_ALLOCATIONS.FULFILLMENT, { fulfillmentId }), body);
  },
  deleteFulfillment: async (fulfillmentId: string) => {
    await api.delete(path(EP.PRODUCT_ALLOCATIONS.FULFILLMENT, { fulfillmentId }));
  },
};

/* ---------- Fuel consumption ---------- */

export type FuelField =
  | 'actualFuelFirstHalf'
  | 'actualFuelSecondHalf'
  | 'meterReadingDay1'
  | 'meterReadingDay16'
  | 'meterReadingLastDay';

export interface FuelRow {
  vehicleId: string;
  vehicleNumber: string;
  mileage: number | null;
  meterReadingDay1: number | null;
  meterReadingDay16: number | null;
  meterReadingLastDay: number | null;
  estimatedTravelMonth: number;
  actualTravelMonth: number | null;
  totalFuelLiters: number | null;
  actualFuelFirstHalf: number | null;
  actualFuelSecondHalf: number | null;
  actualMonthlyFuel: number | null;
  actualMileageMonth: number | null;
}

export const fuelService = {
  report: async (year: number, month: number) =>
    (await api.get<{ rows: FuelRow[] }>(EP.FUEL.REPORT, { params: { year, month } })).data.rows,
  updateEntry: async (body: { year: number; month: number; vehicleId: string; field: FuelField; value: number | null }) =>
    (await api.patch<FuelRow>(EP.FUEL.ENTRY, body)).data,
};
