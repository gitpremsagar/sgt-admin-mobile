import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';

import { ListScreen } from '@/components/list-screen';
import { Badge, ListRow, Row, SearchBar, SelectField, StatCard } from '@/components/ui';
import { useDebounced } from '@/hooks/use-debounced';
import { formatDateTime, formatNumber, humanize } from '@/lib/format';
import { stockRecordsService } from '@/services/masters';

const REASONS = [
  'ARRIVAL_FROM_SUPPLIER',
  'ASSIGNED_TO_ORDER',
  'RELEASED_FROM_ORDER',
  'RETURNED',
  'CREDIT_NOTE',
  'GIFTED',
  'DAMAGED',
  'CORRECTION_BY_ADMIN',
].map((r) => ({ value: r, label: humanize(r) }));

export default function StockRecordsScreen() {
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState<string | null>(null);
  const q = useDebounced(search.trim());
  const stats = useQuery({ queryKey: ['stock-records', 'stats'], queryFn: stockRecordsService.stats });
  const params = { search: q || undefined, reason: reason ?? undefined, limit: 30 };
  const query = useInfiniteQuery({
    queryKey: ['stock-records', 'list', params],
    queryFn: ({ pageParam }) => stockRecordsService.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination && last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined,
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Stock records' }} />
      <ListScreen
        data={query.data?.pages.flatMap((p) => p.stockRecords)}
        keyExtractor={(r) => r.id}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => {
          query.refetch();
          stats.refetch();
        }}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        loadingMore={query.isFetchingNextPage}
        emptyTitle="No stock records"
        emptyIcon="swap_horiz"
        header={
          <>
            {stats.data ? (
              <>
                <Row>
                  <StatCard label="Stock in" value={formatNumber(stats.data.totalStockIn)} tone="success" />
                  <StatCard label="Stock out" value={formatNumber(stats.data.totalStockOut)} tone="danger" />
                </Row>
                <Row>
                  <StatCard label="Records" value={formatNumber(stats.data.totalStockRecords)} />
                  <StatCard label="Last 30 days" value={formatNumber(stats.data.recentActivity)} tone="info" />
                </Row>
              </>
            ) : null}
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search product" />
            <SelectField value={reason} options={REASONS} onChange={setReason} allowClear placeholder="All reasons" />
          </>
        }
        renderItem={({ item }) => {
          const qty = item.changeInStock ?? 0;
          const down = item.changeType ? item.changeType === 'DECREASE' : qty < 0;
          return (
            <ListRow
              title={item.Product?.name ?? 'Product'}
              subtitle={`${item.Product?.productCode ?? ''} · ${humanize(item.reason)}`}
              meta={[formatDateTime(item.createdAt), item.User?.name].filter(Boolean).join(' · ')}
              chevron={false}
              right={<Badge label={`${down ? '−' : '+'}${formatNumber(Math.abs(qty))}`} tone={down ? 'danger' : 'success'} />}
            />
          );
        }}
      />
    </>
  );
}
