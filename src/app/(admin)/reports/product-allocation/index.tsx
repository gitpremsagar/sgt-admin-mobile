import { useInfiniteQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';

import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { Badge, Card, Row } from '@/components/ui';
import { formatDate, formatNumber } from '@/lib/format';
import { allocationService } from '@/services/reports';

export default function AllocationsScreen() {
  const query = useInfiniteQuery({
    queryKey: ['allocations', 'list'],
    queryFn: ({ pageParam }) => allocationService.list({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Product allocation' }} />
      <ListScreen
        data={query.data?.pages.flatMap((p) => p.allocations)}
        keyExtractor={(a) => a.id}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={query.refetch}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        loadingMore={query.isFetchingNextPage}
        emptyTitle="No allocations"
        emptyIcon="assignment"
        fab={{ onPress: () => router.push('/reports/product-allocation/new'), label: 'New allocation' }}
        renderItem={({ item }) => (
          <Card onPress={() => router.push({ pathname: '/reports/product-allocation/[id]', params: { id: item.id } })}>
            <Row style={{ justifyContent: 'space-between' }}>
              <ThemedText type="heading" style={{ flex: 1 }} numberOfLines={1}>
                {item.product.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(item.allocationDate)}
              </ThemedText>
            </Row>
            <Row style={{ flexWrap: 'wrap' }}>
              <Badge label={`Received ${formatNumber(item.receivedQty)}`} />
              <Badge label={`Allocated ${formatNumber(item.allocatedTotal)}`} tone="primary" />
              <Badge label={`Billed ${formatNumber(item.billedTotal)}`} tone="success" />
              {item.remainingToAllocate ? <Badge label={`Left ${formatNumber(item.remainingToAllocate)}`} tone="warning" /> : null}
            </Row>
          </Card>
        )}
      />
    </>
  );
}
