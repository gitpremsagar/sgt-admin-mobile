import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { ListRow, Row, StatCard } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { formatCompactCurrency, formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';

export default function MonthSalesDetailScreen() {
  const { fy, month } = useLocalSearchParams<{ fy: string; month: string }>();
  const query = useQuery({
    queryKey: [...qk.dashboard, 'month-wise-sales-detail', fy, month],
    queryFn: () => dashboardService.monthWiseSalesDetail(fy, Number(month)),
  });
  return (
    <>
      <Stack.Screen options={{ title: query.data ? `${query.data.monthLabel} · FY ${fy}` : 'Month sales' }} />
      <ListScreen
        data={query.data?.orders}
        keyExtractor={(o) => o.orderId}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No orders in this month"
        header={
          query.data ? (
            <Row>
              <StatCard label="Basic sale" value={formatCompactCurrency(query.data.totalSale)} icon="trending_up" tone="success" />
              <StatCard label="Orders" value={formatNumber(query.data.orderCount)} icon="receipt_long" />
            </Row>
          ) : null
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.partyName}
            subtitle={formatDate(item.orderDate)}
            right={<ThemedText type="heading">{formatCurrency(item.orderValueBasic)}</ThemedText>}
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item.orderId } })}
          />
        )}
      />
    </>
  );
}
