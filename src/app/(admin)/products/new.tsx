import { Stack } from 'expo-router';

import { ProductForm } from '@/components/product-form';

export default function NewProductScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'New product' }} />
      <ProductForm />
    </>
  );
}
