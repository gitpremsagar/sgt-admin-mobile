import { api, cleanParams, path } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import type { PaginationB, Product, ProductScheme, StockBatch } from '@/types/models';

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  productGroupId?: string;
  excludeDiscontinued?: boolean;
  hideZeroQuantity?: boolean;
}

export interface ProductBody {
  name: string;
  mrp: number;
  productCode: string;
  lowStockLimit: number;
  overStockLimit: number;
  categoryId: string;
  subCategoryId?: string | null;
  productGroupId: string;
  tagIds: string[];
  grammage?: number;
  lifeOfProduct?: number;
  plantId?: string;
  cartonsPerPallet?: number;
  packetsPerCarton?: number;
  gstPercentage?: number;
  schemePercentage?: number;
  costPricePerPacket?: number;
  costPricePerPacketWithGst?: number;
  costPricePerCarton?: number;
  costPricePerCartonWithGst?: number;
  sellingPricePerPacketForDb?: number;
  sellingPricePerPacketForDbWithGst?: number;
  sellingPricePerCartonForDb?: number;
  sellingPricePerCartonForDbWithGst?: number;
  marginPercentageForDb?: number;
  sellingPricePerPacketForRss?: number;
  sellingPricePerPacketForRssWithGst?: number;
  sellingPricePerCartonForRss?: number;
  sellingPricePerCartonForRssWithGst?: number;
  marginPercentageForRss?: number;
  marginDiff?: number;
  festivePricePerPacket?: number;
  isDiscontinued?: boolean;
}

export interface SchemeBody {
  productId: string;
  slab1MinCb: number;
  slab1MaxCb: number;
  slab1Percent: number;
  slab2MinCb?: number | null;
  slab2MaxCb?: number | null;
  slab2Percent?: number | null;
  slab3MinCb?: number | null;
  slab3MaxCb?: number | null;
  slab3Percent?: number | null;
  slab4MinCb?: number | null;
  slab4MaxCb?: number | null;
  slab4Percent?: number | null;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface StockBatchBody {
  productId: string;
  manufacturingDate: string;
  arrivalDate: string;
  stockQuantity?: number;
}

export interface ProductChange {
  id: string;
  changeType: 'CREATE' | 'UPDATE';
  changedAt: string;
  name?: string;
  mrp?: number;
  categoryName?: string | null;
  productGroupName?: string | null;
  tagNames?: string[];
  [key: string]: unknown;
}

export interface ProductOrderHistoryRow {
  id: string;
  orderId: string;
  quantity: number;
  orderDate: string;
  orderCompleted: boolean;
  Order?: { id: string; customeOrderId: string; orderDate: string };
  Customer?: { id: string; name: string; CustomerDetail: { dbName: string }[] };
}

export const productService = {
  list: async (p: ProductListParams) => {
    const { data } = await api.get<{ products: Product[]; pagination: PaginationB }>(EP.PRODUCTS.LIST, {
      params: cleanParams({
        ...p,
        view: 'list',
        excludeDiscontinued: p.excludeDiscontinued ? 'true' : undefined,
        hideZeroQuantity: p.hideZeroQuantity ? 'true' : undefined,
      }),
    });
    return data;
  },
  lookup: async () =>
    (await api.get<{ products: { id: string; name: string; productCode: string }[] }>(EP.PRODUCTS.LOOKUP)).data
      .products,
  get: async (id: string) => (await api.get<{ product: Product }>(path(EP.PRODUCTS.ONE, { id }))).data.product,
  create: async (body: ProductBody) => (await api.post<{ product: Product }>(EP.PRODUCTS.LIST, body)).data.product,
  update: async (id: string, body: ProductBody) =>
    (await api.put<{ product: Product }>(path(EP.PRODUCTS.ONE, { id }), body)).data.product,
  patch: async (id: string, body: Partial<ProductBody>) =>
    (await api.patch<{ product: Product }>(path(EP.PRODUCTS.ONE, { id }), body)).data.product,
  remove: async (id: string) => {
    await api.delete(path(EP.PRODUCTS.ONE, { id }));
  },
  changeHistory: async (productId: string, page = 1) =>
    (
      await api.get<{ history: ProductChange[]; pagination: PaginationB }>(
        path(EP.PRODUCTS.CHANGE_HISTORY, { productId }),
        { params: { page, limit: 50 } }
      )
    ).data,
  orderHistory: async (productId: string) =>
    (
      await api.get<{ productOrderHistory: ProductOrderHistoryRow[] }>(
        path(EP.PRODUCT_ORDER_HISTORY, { productId })
      )
    ).data.productOrderHistory,

  batches: async (productId: string) =>
    (
      await api.get<{ stockBatches: StockBatch[]; pagination: PaginationB }>(
        path(EP.STOCK_BATCHES.BY_PRODUCT, { id: productId }),
        { params: { page: 1, limit: 100 } }
      )
    ).data.stockBatches,
  createBatch: async (body: StockBatchBody) => {
    await api.post(EP.STOCK_BATCHES.LIST, body);
  },
  updateBatch: async (id: string, body: Partial<StockBatchBody>) => {
    await api.put(path(EP.STOCK_BATCHES.ONE, { id }), body);
  },
  deleteBatch: async (id: string) => {
    await api.delete(path(EP.STOCK_BATCHES.ONE, { id }));
  },

  schemes: async (productId: string) =>
    (
      await api.get<{ productSchemes: ProductScheme[] }>(EP.PRODUCT_SCHEMES.LIST, {
        params: { productId, page: 1, limit: 100 },
      })
    ).data.productSchemes,
  createScheme: async (body: SchemeBody) => {
    await api.post(EP.PRODUCT_SCHEMES.LIST, body);
  },
  updateScheme: async (id: string, body: Partial<SchemeBody>) => {
    await api.put(path(EP.PRODUCT_SCHEMES.ONE, { id }), body);
  },
  toggleScheme: async (id: string, isActive: boolean) => {
    await api.patch(path(EP.PRODUCT_SCHEMES.TOGGLE, { id }), { isActive });
  },
  deleteScheme: async (id: string) => {
    await api.delete(path(EP.PRODUCT_SCHEMES.ONE, { id }));
  },
};
