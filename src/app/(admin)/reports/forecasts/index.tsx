import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';

import { ListScreen } from '@/components/list-screen';
import { Badge, ListRow, SearchBar } from '@/components/ui';
import { customerName } from '@/hooks/api/lookups';
import { formatDate } from '@/lib/format';
import { forecastService } from '@/services/reports';

export default function ForecastDistributorsScreen() {
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['forecasts', 'distributors'], queryFn: forecastService.distributors });
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...(query.data ?? [])].sort((a, b) => customerName(a).localeCompare(customerName(b)));
    return q ? list.filter((d) => customerName(d).toLowerCase().includes(q)) : list;
  }, [query.data, search]);

  return (
    <>
      <Stack.Screen options={{ title: 'Forecasts' }} />
      <ListScreen
        data={rows}
        keyExtractor={(d) => d.id}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No distributors"
        fab={{ onPress: () => router.push('/reports/forecasts/new'), label: 'New forecast' }}
        header={<SearchBar value={search} onChangeText={setSearch} placeholder="Search distributor" />}
        renderItem={({ item }) => {
          const latest = [...item.Forecast].sort((a, b) => b.forecastDate.localeCompare(a.forecastDate))[0];
          return (
            <ListRow
              title={customerName(item)}
              subtitle={latest ? `Latest ${formatDate(latest.forecastDate)}` : 'No forecasts yet'}
              right={<Badge label={String(item.Forecast.length)} tone={item.Forecast.length ? 'primary' : 'neutral'} />}
              onPress={() =>
                router.push({ pathname: '/reports/forecasts/distributor/[distributorId]', params: { distributorId: item.id } })
              }
            />
          );
        }}
      />
    </>
  );
}
