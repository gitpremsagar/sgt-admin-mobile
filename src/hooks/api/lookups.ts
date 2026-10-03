import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { Option } from '@/components/ui/sheet';
import {
  categoriesService,
  customersService,
  employeesService,
  orderStatusTypesService,
  partyReportTagsService,
  plantsService,
  productGroupsService,
  productTagsService,
  subCategoriesService,
  transportersService,
  vehiclesService,
  vehicleTypesService,
} from '@/services/masters';
import { productService } from '@/services/products';
const LOOKUP_STALE = 5 * 60_000;

export const qk = {
  customers: ['customers'] as const,
  vehicles: ['vehicles'] as const,
  vehicleTypes: ['vehicle-types'] as const,
  drivers: ['employees', 'DRIVER'] as const,
  employees: ['employees'] as const,
  statusTypes: ['order-status-types'] as const,
  transporters: ['transporters'] as const,
  categories: ['categories'] as const,
  subCategories: ['subcategories'] as const,
  productTags: ['product-tags'] as const,
  productGroups: ['product-groups'] as const,
  plants: ['plants'] as const,
  partyTags: ['party-report-tags'] as const,
  productLookup: ['products', 'lookup'] as const,
  orders: ['orders'] as const,
  products: ['products'] as const,
  purchases: ['purchases'] as const,
  dashboard: ['dashboard'] as const,
};

export function customerName(
  c: { name: string; CustomerDetail?: { dbName?: string | null }[] | null } | null | undefined
) {
  if (!c) return '—';
  return c.CustomerDetail?.[0]?.dbName || c.name;
}

export function useCustomers() {
  return useQuery({
    queryKey: qk.customers,
    queryFn: async () => (await customersService.list()).customers,
    staleTime: LOOKUP_STALE,
  });
}

export function useCustomerOptions(): Option[] {
  const { data } = useCustomers();
  return useMemo(
    () =>
      (data ?? [])
        .map((c) => ({
          value: c.id,
          label: customerName(c),
          description: [c.CustomerDetail?.[0]?.dbCategory, c.CustomerDetail?.[0]?.area].filter(Boolean).join(' · '),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [data]
  );
}

export function useVehicles() {
  return useQuery({ queryKey: qk.vehicles, queryFn: () => vehiclesService.list(), staleTime: LOOKUP_STALE });
}

export function useVehicleOptions(): Option[] {
  const { data } = useVehicles();
  return useMemo(
    () =>
      (data ?? []).map((v) => ({
        value: v.id,
        label: v.vehicleNumber,
        description: [v.vehicleName, v.VehicleType?.name].filter(Boolean).join(' · '),
      })),
    [data]
  );
}

export function useVehicleTypes() {
  return useQuery({ queryKey: qk.vehicleTypes, queryFn: () => vehicleTypesService.list(), staleTime: LOOKUP_STALE });
}

export function useDrivers() {
  return useQuery({
    queryKey: qk.drivers,
    queryFn: () => employeesService.list({ userType: 'DRIVER' }),
    staleTime: LOOKUP_STALE,
  });
}

export function useDriverOptions(): Option[] {
  const { data } = useDrivers();
  return useMemo(
    () => (data ?? []).map((d) => ({ value: d.id, label: d.name, description: d.phone ?? undefined })),
    [data]
  );
}

export function useStatusTypes() {
  return useQuery({
    queryKey: qk.statusTypes,
    queryFn: async () => {
      const list = await orderStatusTypesService.list();
      return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    },
    staleTime: LOOKUP_STALE,
  });
}

export function useStatusTypeOptions(): Option[] {
  const { data } = useStatusTypes();
  return useMemo(() => (data ?? []).map((s) => ({ value: s.id, label: s.displayName || s.name })), [data]);
}

export function useTransporters() {
  return useQuery({ queryKey: qk.transporters, queryFn: () => transportersService.list(), staleTime: LOOKUP_STALE });
}

export function useCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: () => categoriesService.list(), staleTime: LOOKUP_STALE });
}

export function useSubCategories() {
  return useQuery({ queryKey: qk.subCategories, queryFn: () => subCategoriesService.list(), staleTime: LOOKUP_STALE });
}

export function useProductTags() {
  return useQuery({ queryKey: qk.productTags, queryFn: () => productTagsService.list(), staleTime: LOOKUP_STALE });
}

export function useProductGroups() {
  return useQuery({ queryKey: qk.productGroups, queryFn: () => productGroupsService.list(), staleTime: LOOKUP_STALE });
}

export function usePlants() {
  return useQuery({ queryKey: qk.plants, queryFn: () => plantsService.list(), staleTime: LOOKUP_STALE });
}

export function usePartyTags() {
  return useQuery({ queryKey: qk.partyTags, queryFn: () => partyReportTagsService.list(), staleTime: LOOKUP_STALE });
}

export function useProductLookup() {
  return useQuery({ queryKey: qk.productLookup, queryFn: () => productService.lookup(), staleTime: LOOKUP_STALE });
}

export function useProductOptions(): Option[] {
  const { data } = useProductLookup();
  return useMemo(
    () => (data ?? []).map((p) => ({ value: p.id, label: p.name, description: p.productCode })),
    [data]
  );
}
