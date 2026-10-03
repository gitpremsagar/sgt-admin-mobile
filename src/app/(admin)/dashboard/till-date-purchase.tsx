import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';

import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { ListRow, Row, StatCard } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { formatCompactCurrency, formatDate, formatNumber } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';

export default function TillDatePurchaseScreen() {
  const query = useQuery({
    queryKey: [...qk.dashboard, 'till-date-purchase'],
    queryFn: dashboardService.tillDatePurchase,
  });
  return (
    <>
      <Stack.Screen options={{ title: 'Till-date purchase' }} />
      <ListScreen
        data={query.data?.vehicles}
        keyExtractor={(v) => v.purchaseId}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No purchases this month"
        header={
          query.data ? (
            <Row>
              <StatCard label="Basic amount" value={formatCompactCurrency(query.data.tillDatePurchase)} icon="local_shipping" tone="info" />
              <StatCard label="Vehicles" value={formatNumber(query.data.vehicleCount)} icon="directions_car" />
            </Row>
          ) : null
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.vehicleNumber || 'No vehicle'}
            subtitle={[item.transporterName, item.invoiceNumbers.join(', ')].filter(Boolean).join(' · ')}
            meta={item.stockAddedAt ? `Stock added ${formatDate(item.stockAddedAt)}` : undefined}
            right={<ThemedText type="heading">{formatCompactCurrency(item.basicAmount)}</ThemedText>}
            onPress={() => router.push({ pathname: '/purchases/[id]', params: { id: item.purchaseId } })}
          />
        )}
      />
    </>
  );
}
