import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';

import { ListScreen } from '@/components/list-screen';
import { ListRow } from '@/components/ui';
import { forecastService } from '@/services/reports';

export default function DistributorForecastsScreen() {
  const { distributorId } = useLocalSearchParams<{ distributorId: string }>();
  const query = useQuery({
    queryKey: ['forecasts', 'by-distributor', distributorId],
    queryFn: () => forecastService.byDistributor(distributorId),
  });
  const rows = [...(query.data?.forecasts ?? [])].sort((a, b) => b.forecastDate.localeCompare(a.forecastDate));

  return (
    <>
      <Stack.Screen options={{ title: query.data?.distributor.name ?? 'Forecasts' }} />
      <ListScreen
        data={rows}
        keyExtractor={(f) => f.id}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No forecasts"
        emptyIcon="trending_up"
        fab={{
          onPress: () => router.push({ pathname: '/reports/forecasts/new', params: { distributorId } }),
          label: 'New forecast',
        }}
        renderItem={({ item }) => (
          <ListRow
            title={format(new Date(item.forecastDate), 'MMMM yyyy')}
            icon="event"
            onPress={() => router.push({ pathname: '/reports/forecasts/[id]', params: { id: item.id } })}
          />
        )}
      />
    </>
  );
}
