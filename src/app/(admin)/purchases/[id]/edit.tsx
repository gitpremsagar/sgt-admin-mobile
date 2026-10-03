import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';

import { PurchaseForm } from '@/components/purchase-form';
import { QueryBoundary } from '@/components/query-boundary';
import { qk } from '@/hooks/api/lookups';
import { purchaseService } from '@/services/purchases';

export default function EditPurchaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: [...qk.purchases, 'detail', id], queryFn: () => purchaseService.get(id) });
  return (
    <>
      <Stack.Screen options={{ title: 'Edit purchase' }} />
      <QueryBoundary query={query} notFound="Purchase not found">
        {(purchase) => <PurchaseForm purchase={purchase} />}
      </QueryBoundary>
    </>
  );
}
