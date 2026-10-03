import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';

import { OrderForm } from '@/components/order-form';
import { QueryBoundary } from '@/components/query-boundary';
import { qk } from '@/hooks/api/lookups';
import { orderService } from '@/services/orders';

export default function EditOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: [...qk.orders, 'detail', id], queryFn: () => orderService.get(id) });
  return (
    <>
      <Stack.Screen options={{ title: query.data ? `Modify #${query.data.customeOrderId}` : 'Modify order' }} />
      <QueryBoundary query={query} notFound="Order not found">
        {(order) => <OrderForm order={order} />}
      </QueryBoundary>
    </>
  );
}
