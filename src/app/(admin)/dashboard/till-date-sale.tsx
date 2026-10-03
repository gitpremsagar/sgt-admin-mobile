import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';

import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { ListRow, Row, StatCard } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { formatCompactCurrency, formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';

export default function TillDateSaleScreen() {
  const query = useQuery({ queryKey: [...qk.dashboard, 'till-date-sale'], queryFn: dashboardService.tillDateSale });
  return (
    <>
      <Stack.Screen options={{ title: 'Till-date sale' }} />
      <ListScreen
        data={query.data?.orders}
        keyExtractor={(o) => o.orderId}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No sales this month"
        header={
          query.data ? (
            <Row>
              <StatCard label="Taxable sale" value={formatCompactCurrency(query.data.tillDateSale)} icon="trending_up" tone="success" />
              <StatCard label="Orders" value={formatNumber(query.data.orderCount)} icon="receipt_long" />
            </Row>
          ) : null
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.distributorName}
            subtitle={formatDate(item.orderDate)}
            right={<ThemedText type="heading">{formatCurrency(item.taxableAmount)}</ThemedText>}
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item.orderId } })}
          />
        )}
      />
    </>
  );
}
