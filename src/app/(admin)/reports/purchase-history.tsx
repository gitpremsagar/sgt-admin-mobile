import { useInfiniteQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { subDays } from 'date-fns';
import { useState } from 'react';
import { View } from 'react-native';

import { ListScreen } from '@/components/list-screen';
import { PurchaseCard } from '@/components/purchase-card';
import { DateField, Row, SelectField } from '@/components/ui';
import { qk, useTransporters } from '@/hooks/api/lookups';
import { humanize, toYmd } from '@/lib/format';
import { purchaseService, TRANSPORT_STATUSES } from '@/services/purchases';

export default function PurchaseHistoryScreen() {
  const transporters = useTransporters();
  const [start, setStart] = useState<Date>(subDays(new Date(), 30));
  const [end, setEnd] = useState<Date>(new Date());
  const [transporterId, setTransporterId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const params = {
    startDate: toYmd(start),
    endDate: toYmd(end),
    transporterId: transporterId ?? undefined,
    status: status ?? undefined,
    limit: 30,
  };
  const query = useInfiniteQuery({
    queryKey: [...qk.purchases, 'history', params],
    queryFn: ({ pageParam }) => purchaseService.history({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination && last.pagination.currentPage < last.pagination.totalPages ? last.pagination.currentPage + 1 : undefined,
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Purchase history' }} />
      <ListScreen
        data={query.data?.pages.flatMap((p) => p.purchases)}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PurchaseCard purchase={item} />}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={query.refetch}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        loadingMore={query.isFetchingNextPage}
        emptyTitle="No purchases in this range"
        emptyIcon="local_shipping"
        header={
          <>
            <Row>
              <View style={{ flex: 1 }}>
                <DateField label="From" value={start} onChange={(d) => d && setStart(d)} />
              </View>
              <View style={{ flex: 1 }}>
                <DateField label="To" value={end} onChange={(d) => d && setEnd(d)} />
              </View>
            </Row>
            <Row>
              <View style={{ flex: 1 }}>
                <SelectField
                  value={transporterId}
                  options={(transporters.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
                  onChange={setTransporterId}
                  allowClear
                  placeholder="All transporters"
                />
              </View>
              <View style={{ flex: 1 }}>
                <SelectField
                  value={status}
                  options={TRANSPORT_STATUSES.map((s) => ({ value: s, label: humanize(s) }))}
                  onChange={setStatus}
                  allowClear
                  placeholder="Any status"
                />
              </View>
            </Row>
          </>
        }
      />
    </>
  );
}
