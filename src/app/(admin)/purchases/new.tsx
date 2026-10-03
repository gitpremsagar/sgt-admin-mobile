import { Stack } from 'expo-router';

import { PurchaseForm } from '@/components/purchase-form';

export default function NewPurchaseScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'New purchase' }} />
      <PurchaseForm />
    </>
  );
}
