import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, DateField, Input, MultiChips, Screen, SelectField } from '@/components/ui';
import { qk, useProductOptions } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/format';
import { productService } from '@/services/products';
import { allocationService } from '@/services/reports';

export default function NewAllocationScreen() {
  const productOptions = useProductOptions();
  const [productId, setProductId] = useState<string | null>(null);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');
  const batches = useQuery({
    queryKey: [...qk.products, 'batches', productId],
    queryFn: () => productService.batches(productId!),
    enabled: !!productId,
  });

  const save = useApiMutation(
    async () => {
      if (!productId) throw new Error('Select a product');
      if (!batchIds.length) throw new Error('Select at least one stock batch');
      return allocationService.create({
        productId,
        stockBatchIds: batchIds,
        allocationDate: (date ?? new Date()).toISOString(),
        notes: notes.trim() || null,
      });
    },
    {
      invalidate: [['allocations']],
      successMessage: 'Allocation created',
      onSuccess: (a) => router.replace({ pathname: '/reports/product-allocation/[id]', params: { id: a.id } }),
    }
  );

  return (
    <>
      <Stack.Screen options={{ title: 'New allocation' }} />
      <Screen footer={<Button title="Create" icon="check" onPress={() => save.mutate()} loading={save.isPending} />}>
        <Card>
          <SelectField
            label="Product"
            value={productId}
            options={productOptions}
            searchable
            onChange={(v) => {
              setProductId(v);
              setBatchIds([]);
            }}
          />
          {productId ? (
            batches.data?.length ? (
              <MultiChips
                label="Stock batches"
                options={batches.data.map((b) => ({
                  value: b.id,
                  label: `${b.stockQuantity} CB · arr ${formatDate(b.arrivalDate)}`,
                }))}
                value={batchIds}
                onChange={setBatchIds}
              />
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                {batches.isLoading ? 'Loading batches…' : 'No stock batches for this product.'}
              </ThemedText>
            )
          ) : null}
          <DateField label="Allocation date" value={date} onChange={setDate} />
          <Input label="Notes" value={notes} onChangeText={setNotes} multiline />
        </Card>
        <ThemedText type="caption" themeColor="textSecondary">
          After creating, set quantities per party on the allocation screen.
        </ThemedText>
      </Screen>
    </>
  );
}
