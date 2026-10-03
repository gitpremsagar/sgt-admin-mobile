import { useInfiniteQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ListScreen } from '@/components/list-screen';
import { OrderCard } from '@/components/order-card';
import { DateField, Row, SelectField } from '@/components/ui';
import { useCustomerOptions } from '@/hooks/api/lookups';
import { toYmd } from '@/lib/format';
import { salesHistoryService } from '@/services/reports';

export default function SalesHistoryScreen() {
  const customerOptions = useCustomerOptions();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const params = {
    customerId: customerId ?? undefined,
    startDate: start ? toYmd(start) : undefined,
    endDate: end ? toYmd(end) : undefined,
    limit: 30,
  };
  const query = useInfiniteQuery({
    queryKey: ['sales-history', params],
    queryFn: ({ pageParam }) => salesHistoryService.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.currentPage < last.pagination.totalPages ? last.pagination.currentPage + 1 : undefined,
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Sales history' }} />
      <ListScreen
        data={query.data?.pages.flatMap((p) => p.orders)}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={query.refetch}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        loadingMore={query.isFetchingNextPage}
        emptyTitle="No historical sales"
        fab={{ onPress: () => router.push('/reports/sales-history/new'), label: 'Add historical sale' }}
        header={
          <>
            <SelectField
              value={customerId}
              options={customerOptions}
              onChange={setCustomerId}
              searchable
              allowClear
              placeholder="All distributors"
            />
            <Row>
              <View style={{ flex: 1 }}>
                <DateField value={start} onChange={setStart} placeholder="From" allowClear />
              </View>
              <View style={{ flex: 1 }}>
                <DateField value={end} onChange={setEnd} placeholder="To" allowClear />
              </View>
            </Row>
          </>
        }
      />
    </>
  );
}
