import { api, cleanParams, path } from '@/lib/api/client';
import { EP } from '@/lib/api/endpoints';
import type {
  Category,
  Customer,
  CustomerDetail,
  DeliveryAddress,
  Employee,
  NamedEntity,
  OrderStatusType,
  PaginationA,
  PaginationB,
  Transporter,
  Vehicle,
  VehicleType,
} from '@/types/models';

/** Generic CRUD for endpoints shaped `{ [listKey]: T[] }` / `{ [oneKey]: T }`. */
export function resource<T, Body = Partial<T>>(cfg: {
  list: string;
  one: string;
  listKey: string;
  oneKey: string;
  listParams?: Record<string, unknown>;
}) {
  return {
    list: async (params?: Record<string, unknown>): Promise<T[]> => {
      const { data } = await api.get<Record<string, T[]>>(cfg.list, {
        params: cleanParams({ ...cfg.listParams, ...params }),
      });
      return data[cfg.listKey] ?? [];
    },
    get: async (id: string): Promise<T> => {
      const { data } = await api.get<Record<string, T>>(path(cfg.one, { id }));
      return data[cfg.oneKey];
    },
    create: async (body: Body): Promise<T> => {
      const { data } = await api.post<Record<string, T>>(cfg.list, body);
      return data[cfg.oneKey];
    },
    update: async (id: string, body: Body): Promise<T> => {
      const { data } = await api.put<Record<string, T>>(path(cfg.one, { id }), body);
      return data[cfg.oneKey];
    },
    remove: async (id: string): Promise<void> => {
      await api.delete(path(cfg.one, { id }));
    },
  };
}

export const categoriesService = resource<Category>({
  list: EP.CATEGORIES.LIST,
  one: EP.CATEGORIES.ONE,
  listKey: 'categories',
  oneKey: 'category',
});
export const subCategoriesService = resource<NamedEntity & { description?: string; categoryId: string; Category?: NamedEntity }>({
  list: EP.SUBCATEGORIES.LIST,
  one: EP.SUBCATEGORIES.ONE,
  listKey: 'subCategories',
  oneKey: 'subCategory',
});
export const productTagsService = resource<NamedEntity>({
  list: EP.PRODUCT_TAGS.LIST,
  one: EP.PRODUCT_TAGS.ONE,
  listKey: 'productTags',
  oneKey: 'productTag',
  listParams: { page: 1, limit: 1000 },
});
export const productGroupsService = resource<NamedEntity & { _count?: { Product: number } }>({
  list: EP.PRODUCT_GROUPS.LIST,
  one: EP.PRODUCT_GROUPS.ONE,
  listKey: 'productGroups',
  oneKey: 'productGroup',
  listParams: { page: 1, limit: 1000 },
});
export const plantsService = resource<NamedEntity & { location?: string | null }>({
  list: EP.PLANTS.LIST,
  one: EP.PLANTS.ONE,
  listKey: 'plants',
  oneKey: 'plant',
  listParams: { page: 1, limit: 1000 },
});
export interface PartyReportTag extends NamedEntity {
  sortOrder: number;
  headerColor: string;
  salesOfficerId?: string | null;
  SalesOfficer?: { id: string; name: string } | null;
  _count?: { CustomerDetails: number };
}
export const partyReportTagsService = {
  ...resource<PartyReportTag>({
    list: EP.PARTY_REPORT_TAGS.LIST,
    one: EP.PARTY_REPORT_TAGS.ONE,
    listKey: 'partyReportTags',
    oneKey: 'partyReportTag',
    listParams: { page: 1, limit: 1000 },
  }),
  distributors: async (id: string) =>
    (
      await api.get<{
        distributors: { customerDetailId: string; customerId: string; dbName: string; area: string; state: string }[];
      }>(path(EP.PARTY_REPORT_TAGS.DISTRIBUTORS, { id }))
    ).data.distributors,
  assignDistributors: async (id: string, customerIds: string[]) => {
    await api.put(path(EP.PARTY_REPORT_TAGS.DISTRIBUTORS, { id }), { customerIds });
  },
};
export const vehicleTypesService = resource<VehicleType>({
  list: EP.VEHICLE_TYPES.LIST,
  one: EP.VEHICLE_TYPES.ONE,
  listKey: 'vehicleTypes',
  oneKey: 'vehicleType',
});
export const vehiclesService = resource<Vehicle>({
  list: EP.VEHICLES.LIST,
  one: EP.VEHICLES.ONE,
  listKey: 'vehicles',
  oneKey: 'vehicle',
});
export const transportersService = resource<Transporter>({
  list: EP.TRANSPORTERS.LIST,
  one: EP.TRANSPORTERS.ONE,
  listKey: 'transporters',
  oneKey: 'transporter',
});
export const orderStatusTypesService = resource<OrderStatusType>({
  list: EP.ORDER_STATUS_TYPES.LIST,
  one: EP.ORDER_STATUS_TYPES.ONE,
  listKey: 'orderStatusTypes',
  oneKey: 'orderStatusType',
});
export const employeesService = resource<Employee>({
  list: EP.EMPLOYEES.LIST,
  one: EP.EMPLOYEES.ONE,
  listKey: 'employees',
  oneKey: 'employee',
  listParams: { page: 1, limit: 1000 },
});

export type CustomerBody = Partial<Omit<CustomerDetail, 'id'>> & {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
};

export const customersService = {
  list: async (params: { search?: string; page?: number; limit?: number } = {}) =>
    (
      await api.get<{ customers: Customer[]; pagination: PaginationA }>(EP.CUSTOMERS.LIST, {
        params: cleanParams({ page: 1, limit: 1000, ...params }),
      })
    ).data,
  get: async (id: string) => (await api.get<{ customer: Customer }>(path(EP.CUSTOMERS.ONE, { id }))).data.customer,
  create: async (body: CustomerBody) => {
    await api.post(EP.CUSTOMERS.LIST, body);
  },
  update: async (id: string, body: CustomerBody) => {
    await api.put(path(EP.CUSTOMERS.ONE, { id }), body);
  },
  remove: async (id: string) => {
    await api.delete(path(EP.CUSTOMERS.ONE, { id }));
  },
};

export const deliveryAddressService = {
  list: async (userId: string) =>
    (
      await api.get<{ deliveryAddresses: DeliveryAddress[] }>(EP.DELIVERY_ADDRESSES.LIST, {
        params: { userId },
      })
    ).data.deliveryAddresses,
  create: async (body: Partial<DeliveryAddress> & { userId: string; address: string }) => {
    await api.post(EP.DELIVERY_ADDRESSES.LIST, body);
  },
  update: async (id: string, body: Partial<DeliveryAddress>) => {
    await api.put(path(EP.DELIVERY_ADDRESSES.ONE, { id }), body);
  },
  setDefault: async (id: string) => {
    await api.patch(path(EP.DELIVERY_ADDRESSES.DEFAULT, { id }));
  },
  remove: async (id: string) => {
    await api.delete(path(EP.DELIVERY_ADDRESSES.ONE, { id }));
  },
};

export interface SalesOfficer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export const salesOfficersService = {
  list: async () => (await api.get<SalesOfficer[]>(EP.SALES_OFFICERS.LIST)).data,
  get: async (id: string) =>
    (
      await api.get<
        SalesOfficer & {
          SalesOfficerAssignment?: {
            id: string;
            distributorId: string;
            Distributor: Customer;
          }[];
        }
      >(path(EP.SALES_OFFICERS.ONE, { id }))
    ).data,
  stats: async (id: string) =>
    (
      await api.get<{ assignedDistributors: number; totalOrders: number; pendingForecasts: number }>(
        path(EP.SALES_OFFICERS.STATS, { id })
      )
    ).data,
  create: async (body: { name: string; email: string; phone?: string; password?: string }) => {
    await api.post(EP.SALES_OFFICERS.LIST, body);
  },
  update: async (id: string, body: { name?: string; email?: string; phone?: string; password?: string }) => {
    await api.put(path(EP.SALES_OFFICERS.ONE, { id }), body);
  },
  remove: async (id: string) => {
    await api.delete(path(EP.SALES_OFFICERS.ONE, { id }));
  },
  assign: async (salesOfficerId: string, distributorId: string) => {
    await api.post(EP.SALES_OFFICERS.ASSIGN, { salesOfficerId, distributorId });
  },
  unassign: async (assignmentId: string) => {
    await api.delete(path(EP.SALES_OFFICERS.ASSIGNMENT, { id: assignmentId }));
  },
};

export interface TallyInvoiceSettings {
  financialYear: string;
  nextNumber: number;
  nextInvoiceIdPreview: string;
  timeZone: string;
}

export const tallyInvoiceService = {
  get: async () => (await api.get<TallyInvoiceSettings>(EP.TALLY_INVOICE_SETTINGS)).data,
  update: async (body: { nextNumber: number; financialYear?: string }) =>
    (await api.put<TallyInvoiceSettings>(EP.TALLY_INVOICE_SETTINGS, body)).data,
};

export interface StockRecord {
  id: string;
  reason: string;
  changeInStock?: number;
  changeType?: 'INCREASE' | 'DECREASE' | null;
  createdAt: string;
  Product?: { id: string; name: string; productCode: string };
  User?: { id: string; name: string } | null;
}

export const stockRecordsService = {
  list: async (params: { page?: number; limit?: number; search?: string; reason?: string }) =>
    (
      await api.get<{ stockRecords: StockRecord[]; pagination: PaginationB }>(EP.STOCK_RECORDS.LIST, {
        params: cleanParams(params),
      })
    ).data,
  stats: async () =>
    (
      await api.get<{
        stats: {
          totalStockRecords: number;
          arrivalRecords: number;
          deliveryRecords: number;
          correctionRecords: number;
          totalStockIn: number;
          totalStockOut: number;
          recentActivity: number;
        };
      }>(EP.STOCK_RECORDS.STATS)
    ).data.stats,
};
