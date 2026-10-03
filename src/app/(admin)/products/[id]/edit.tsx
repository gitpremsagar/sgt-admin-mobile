import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';

import { ProductForm } from '@/components/product-form';
import { QueryBoundary } from '@/components/query-boundary';
import { qk } from '@/hooks/api/lookups';
import { productService } from '@/services/products';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: [...qk.products, 'detail', id], queryFn: () => productService.get(id) });
  return (
    <>
      <Stack.Screen options={{ title: 'Edit product' }} />
      <QueryBoundary query={query} notFound="Product not found">
        {(product) => <ProductForm product={product} />}
      </QueryBoundary>
    </>
  );
}
