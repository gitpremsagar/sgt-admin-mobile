import { Stack } from 'expo-router';

import { OrderForm } from '@/components/order-form';

export default function NewOrderScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'New order' }} />
      <OrderForm />
    </>
  );
}
