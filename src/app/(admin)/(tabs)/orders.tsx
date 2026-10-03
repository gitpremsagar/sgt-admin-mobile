import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';

import { ListScreen } from '@/components/list-screen';
import { OrderCard } from '@/components/order-card';
import { Button, DateField, FilterChips, Row, SearchBar, SelectField, Sheet, SwitchRow } from '@/components/ui';
import { customerName, qk, useCustomerOptions, useStatusTypes } from '@/hooks/api/lookups';
import { useDebounced } from '@/hooks/use-debounced';
import { toYmd } from '@/lib/format';
import { orderService, type OrderListParams } from '@/services/orders';

const PAGE_SIZE = 40;

export default function OrdersScreen() {
  const statusTypes = useStatusTypes();
  const customerOptions = useCustomerOptions();
  const [statusId, setStatusId] = useState<string>('open');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const debouncedSearch = useDebounced(search);

  const params: OrderListParams = {
    limit: PAGE_SIZE,
    orderStatusTypeId: statusId === 'open' ? undefined : statusId,
    customerId: customerId ?? undefined,
    startDate: startDate ? toYmd(startDate) : undefined,
    endDate: endDate ? toYmd(endDate) : undefined,
    includeAllStatuses: statusId === 'open' ? includeCompleted : undefined,
  };

  const query = useInfiniteQuery({
    queryKey: [...qk.orders, 'list', params],
    queryFn: ({ pageParam }) => orderService.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.currentPage < last.pagination.totalPages ? last.pagination.currentPage + 1 : undefined,
  });

  const orders = useMemo(() => {
    const all = query.data?.pages.flatMap((p) => p.orders) ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (o) =>
        customerName(o.Customer).toLowerCase().includes(q) ||
        o.customeOrderId?.toLowerCase().includes(q) ||
        o.tallyInvoiceId?.toLowerCase().includes(q) ||
        o.Vehicle?.vehicleNumber?.toLowerCase().includes(q)
    );
  }, [query.data, debouncedSearch]);

  const chipOptions = [
    { value: 'open', label: includeCompleted ? 'All' : 'Open' },
    ...(statusTypes.data ?? []).map((s) => ({ value: s.id, label: s.displayName || s.name })),
  ];
  const activeFilters = [customerId, startDate, endDate].filter(Boolean).length + (includeCompleted ? 1 : 0);

  return (
    <>
      <ListScreen
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={query.refetch}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        loadingMore={query.isFetchingNextPage}
        emptyTitle="No orders"
        emptyMessage="Try a different status or filter."
        emptyIcon="receipt_long"
        fab={{ onPress: () => router.push('/orders/new'), label: 'New order' }}
        header={
          <>
            <Row>
              <SearchBar value={search} onChangeText={setSearch} placeholder="Party, order #, invoice, vehicle" />
            </Row>
            <Row>
              <Button
                title={activeFilters ? `Filters (${activeFilters})` : 'Filters'}
                icon="filter_list"
                variant="secondary"
                size="sm"
                onPress={() => setFiltersOpen(true)}
              />
            </Row>
            <FilterChips options={chipOptions} value={statusId} onChange={setStatusId} />
          </>
        }
      />
      <Sheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter orders"
        footer={
          <Row>
            <Button
              title="Reset"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => {
                setCustomerId(null);
                setStartDate(null);
                setEndDate(null);
                setIncludeCompleted(false);
              }}
            />
            <Button title="Apply" style={{ flex: 1 }} onPress={() => setFiltersOpen(false)} />
          </Row>
        }>
        <SelectField
          label="Distributor"
          value={customerId}
          options={customerOptions}
          onChange={setCustomerId}
          allowClear
          placeholder="All distributors"
        />
        <DateField label="From" value={startDate} onChange={setStartDate} allowClear />
        <DateField label="To" value={endDate} onChange={setEndDate} allowClear />
        <SwitchRow
          label="Include completed"
          description="Only applies when no status is selected"
          value={includeCompleted}
          onChange={setIncludeCompleted}
        />
      </Sheet>
    </>
  );
}
