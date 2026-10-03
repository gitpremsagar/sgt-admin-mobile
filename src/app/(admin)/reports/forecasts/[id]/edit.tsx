import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';

import { ForecastForm } from '@/components/forecast-form';
import { QueryBoundary } from '@/components/query-boundary';
import { forecastService } from '@/services/reports';

export default function EditForecastScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ['forecasts', 'detail', id], queryFn: () => forecastService.get(id) });
  return (
    <>
      <Stack.Screen options={{ title: 'Edit forecast' }} />
      <QueryBoundary query={query}>{(f) => <ForecastForm forecast={f} />}</QueryBoundary>
    </>
  );
}
