import { api, path } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';

export interface MonthlyData {
  month: string;
  value: number;
}
export interface QuarterlyData {
  quarter: string;
  target: number;
  achieved: number;
}
export interface ForecastVsAchieve {
  distributorId: string;
  distributorName: string;
  category?: string;
  forecast: number;
  achieved: number;
}
export interface NearExpiryProduct {
  id: string;
  expiryDate: string;
  stockQuantity: number;
  product: { name: string; productCode: string };
}
export interface ActualStock {
  productName: string;
  productCode: string;
  quantity: number;
}
export interface ContactItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
}
export interface DocumentItem {
  id: string;
  title: string;
  fileUrl?: string;
  note?: string;
}
export interface DashboardSummary {
  currentMonth: { tillDateSale: number; tillDatePurchase: number };
  monthWiseSales: MonthlyData[];
  monthWisePurchases: MonthlyData[];
  currentFinancialYear: { year: string; quarterly: QuarterlyData[] };
  lastFinancialYear: { year: string; quarterly: QuarterlyData[] };
  ssForecastVsAchieve: { currentMonth: ForecastVsAchieve[]; yearly: ForecastVsAchieve[] };
  dbForecastVsAchieve: { currentMonth: ForecastVsAchieve[] };
  reports: { nearExpiryProducts: NearExpiryProduct[]; actualStock: ActualStock[] };
  contacts: ContactItem[];
  documents: DocumentItem[];
}
export interface TillDateSaleResponse {
  tillDateSale: number;
  orderCount: number;
  orders: { orderId: string; distributorName: string; orderDate: string; taxableAmount: number }[];
}
export interface TillDatePurchaseResponse {
  tillDatePurchase: number;
  vehicleCount: number;
  vehicles: {
    purchaseId: string;
    vehicleNumber: string;
    invoiceNumbers: string[];
    transporterName: string;
    stockAddedAt: string | null;
    basicAmount: number;
  }[];
}
export interface MonthWiseSalesRow {
  monthIndex: number;
  monthLabel: string;
  primaryTarget: number | null;
  tallyAchieved: number;
  isHistorical: boolean;
  dmsAchieved: number | null;
  achievePercent: number | null;
  qWiseTarget: number;
  qWiseAchieved: number;
  quarterAchievePercent: number | null;
  compareFromPreviousMonth: number | null;
  remark: string | null;
}
export interface MonthWiseSalesReport {
  endFinancialYear: string;
  years: {
    financialYear: string;
    rows: MonthWiseSalesRow[];
    totals: {
      primaryTarget: number;
      tallyAchieved: number;
      dmsAchieved: number;
      achievePercent: number | null;
      compareFromPreviousYear: number | null;
    };
  }[];
}
export interface MonthWiseSalesDetail {
  financialYear: string;
  monthIndex: number;
  monthLabel: string;
  totalSale: number;
  orderCount: number;
  orders: { orderId: string; orderDate: string; partyName: string; orderValueBasic: number }[];
}
export interface MonthWisePurchaseRow {
  monthIndex: number;
  monthLabel: string;
  target: number | null;
  achieved: number;
  qWiseTarget: number;
  qWiseAchieved: number;
  achievePercent: number | null;
  quarterAchievePercent: number | null;
  compareFromPreviousMonth: number | null;
  remark: string | null;
}
export interface MonthWisePurchaseReport {
  endFinancialYear: string;
  years: {
    financialYear: string;
    rows: MonthWisePurchaseRow[];
    totals: {
      target: number;
      achieved: number;
      balance: number;
      achievePercent: number | null;
      compareFromPreviousYear: number | null;
    };
  }[];
}
export interface ShipmentRow {
  monthIndex: number;
  monthLabel: string;
  quarter: string | null;
  targetBasic: number | null;
  achieveBasic: number | null;
  achPercent: number | null;
  quarterAchPercent: number | null;
  saleBasic: number | null;
  dmsBasic: number | null;
  incentive: number | null;
  avgSalePerDay: number | null;
  car: number | null;
}
export interface ShipmentVsAchieve {
  financialYear: string;
  mode: 'hardcoded' | 'live';
  editable: boolean;
  rows: ShipmentRow[];
  totals: {
    targetBasic: number | null;
    achieveBasic: number | null;
    achPercent: number | null;
    saleBasic: number | null;
    dmsBasic: number | null;
    incentive: number | null;
  };
}

function params(financialYear?: string) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  return { timeZone, nowIso: new Date().toISOString(), ...(financialYear ? { financialYear } : {}) };
}

export const dashboardService = {
  summary: async (fy?: string) =>
    (await api.get<DashboardSummary>(EP.DASHBOARD.SUMMARY, { params: params(fy) })).data,
  tillDateSale: async () =>
    (await api.get<TillDateSaleResponse>(EP.DASHBOARD.TILL_DATE_SALE, { params: params() })).data,
  tillDatePurchase: async () =>
    (await api.get<TillDatePurchaseResponse>(EP.DASHBOARD.TILL_DATE_PURCHASE, { params: params() })).data,
  monthWiseSalesReport: async (fy?: string) =>
    (await api.get<MonthWiseSalesReport>(EP.DASHBOARD.MONTH_WISE_SALES_REPORT, { params: params(fy) })).data,
  monthWiseSalesDetail: async (financialYear: string, monthIndex: number) =>
    (
      await api.get<MonthWiseSalesDetail>(EP.DASHBOARD.MONTH_WISE_SALES_DETAIL, {
        params: { timeZone: params().timeZone, financialYear, monthIndex },
      })
    ).data,
  upsertMonthWiseSalesReport: async (body: {
    financialYear: string;
    monthIndex: number;
    primaryTarget?: number | null;
    dmsAchieved?: number | null;
    remark?: string | null;
  }) => {
    await api.post(EP.DASHBOARD.MONTH_WISE_SALES_REPORT, body);
  },
  monthWisePurchaseReport: async (fy?: string) =>
    (await api.get<MonthWisePurchaseReport>(EP.DASHBOARD.MONTH_WISE_PURCHASE_REPORT, { params: params(fy) }))
      .data,
  upsertMonthWisePurchaseReport: async (body: {
    financialYear: string;
    monthIndex: number;
    target?: number | null;
    remark?: string | null;
  }) => {
    await api.post(EP.DASHBOARD.MONTH_WISE_PURCHASE_REPORT, body);
  },
  shipmentVsAchieve: async (fy?: string) =>
    (await api.get<ShipmentVsAchieve>(EP.DASHBOARD.SHIPMENT_VS_ACHIEVE, { params: params(fy) })).data,
  ssForecastCurrent: async () =>
    (
      await api.get<{ ssForecastCurrentMonth: ForecastVsAchieve[] }>(EP.DASHBOARD.SS_FORECAST_CURRENT, {
        params: params(),
      })
    ).data.ssForecastCurrentMonth,
  ssForecastYearly: async (fy?: string) =>
    (
      await api.get<{ ssForecastYearly: ForecastVsAchieve[] }>(EP.DASHBOARD.SS_FORECAST_YEARLY, {
        params: params(fy),
      })
    ).data.ssForecastYearly,
  dbForecastCurrent: async () =>
    (
      await api.get<{ dbForecastCurrentMonth: ForecastVsAchieve[] }>(EP.DASHBOARD.DB_FORECAST_CURRENT, {
        params: params(),
      })
    ).data.dbForecastCurrentMonth,
  nearExpiry: async () =>
    (await api.get<{ nearExpiryProducts: NearExpiryProduct[] }>(EP.DASHBOARD.NEAR_EXPIRY, { params: params() }))
      .data.nearExpiryProducts,
  actualStock: async () =>
    (await api.get<{ actualStock: ActualStock[] }>(EP.DASHBOARD.ACTUAL_STOCK, { params: params() })).data
      .actualStock,
  contacts: async () => (await api.get<{ contacts: ContactItem[] }>(EP.DASHBOARD.CONTACTS)).data.contacts,
  createContact: async (body: Omit<ContactItem, 'id'>) =>
    (await api.post<{ contact: ContactItem }>(EP.DASHBOARD.CONTACTS, body)).data.contact,
  deleteContact: async (id: string) => {
    await api.delete(path(EP.DASHBOARD.CONTACT, { id }));
  },
  documents: async () => (await api.get<{ documents: DocumentItem[] }>(EP.DASHBOARD.DOCUMENTS)).data.documents,
  createDocument: async (body: Omit<DocumentItem, 'id'>) =>
    (await api.post<{ document: DocumentItem }>(EP.DASHBOARD.DOCUMENTS, body)).data.document,
  deleteDocument: async (id: string) => {
    await api.delete(path(EP.DASHBOARD.DOCUMENT, { id }));
  },
};
