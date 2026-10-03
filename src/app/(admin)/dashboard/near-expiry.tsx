import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { differenceInCalendarDays } from 'date-fns';

import { ListScreen } from '@/components/list-screen';
import { Badge, ListRow } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { formatDate, formatNumber } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';

export default function NearExpiryScreen() {
  const query = useQuery({ queryKey: [...qk.dashboard, 'near-expiry'], queryFn: dashboardService.nearExpiry });
  return (
    <>
      <Stack.Screen options={{ title: 'Near expiry' }} />
      <ListScreen
        data={query.data}
        keyExtractor={(b) => b.id}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="Nothing expiring soon"
        emptyIcon="event_available"
        renderItem={({ item }) => {
          const days = differenceInCalendarDays(new Date(item.expiryDate), new Date());
          return (
            <ListRow
              title={item.product.name}
              subtitle={`${item.product.productCode} · ${formatNumber(item.stockQuantity)} CB · ${formatDate(item.expiryDate)}`}
              right={<Badge label={days <= 0 ? 'Expired' : `${days}d`} tone={days <= 7 ? 'danger' : 'warning'} />}
            />
          );
        }}
      />
    </>
  );
}
