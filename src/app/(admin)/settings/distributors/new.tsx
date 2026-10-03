import { Stack } from 'expo-router';

import { DistributorForm } from '@/components/distributor-form';
import { Screen } from '@/components/ui';

export default function NewDistributorScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'New distributor' }} />
      <Screen>
        <DistributorForm />
      </Screen>
    </>
  );
}
