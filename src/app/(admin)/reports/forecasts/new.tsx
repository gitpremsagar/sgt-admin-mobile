import { Stack, useLocalSearchParams } from 'expo-router';

import { ForecastForm } from '@/components/forecast-form';

export default function NewForecastScreen() {
  const { distributorId } = useLocalSearchParams<{ distributorId?: string }>();
  return (
    <>
      <Stack.Screen options={{ title: 'New forecast' }} />
      <ForecastForm distributorId={distributorId} />
    </>
  );
}
