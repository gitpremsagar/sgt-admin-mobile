import { router, Stack } from 'expo-router';
import { useState } from 'react';

import { ProductPicker } from '@/components/product-picker';
import { QuantityLines, type QtyLine } from '@/components/quantity-lines';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, DateField, Input, Screen, Section, SelectField } from '@/components/ui';
import { useCustomerOptions, useVehicleOptions } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { salesHistoryService } from '@/services/reports';

export default function NewSalesHistoryScreen() {
  const customerOptions = useCustomerOptions();
  const vehicleOptions = useVehicleOptions();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(new Date());
  const [invoice, setInvoice] = useState('');
  const [lines, setLines] = useState<QtyLine[]>([]);
  const [picker, setPicker] = useState(false);

  const save = useApiMutation(
    async () => {
      if (!customerId) throw new Error('Select a distributor');
      if (!lines.length) throw new Error('Add at least one product');
      await salesHistoryService.create({
        customerId,
        vehicleId: vehicleId ?? undefined,
        orderDate: date?.toISOString(),
        tallyInvoiceId: invoice.trim() || null,
        orderItems: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      });
    },
    { invalidate: [['sales-history']], successMessage: 'Historical sale added', onSuccess: () => router.back() }
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Add historical sale' }} />
      <Screen footer={<Button title="Save" icon="check" onPress={() => save.mutate()} loading={save.isPending} />}>
        <ThemedText type="small" themeColor="textSecondary">
          Records a past sale for reporting. Stock is not changed.
        </ThemedText>
        <Card>
          <SelectField label="Distributor" value={customerId} options={customerOptions} searchable onChange={setCustomerId} />
          <DateField label="Order date" value={date} onChange={setDate} maximumDate={new Date()} />
          <SelectField label="Vehicle" value={vehicleId} options={vehicleOptions} allowClear onChange={setVehicleId} />
          <Input label="Tally invoice ID" value={invoice} onChangeText={setInvoice} autoCapitalize="characters" />
        </Card>
        <Section title={`Products (${lines.length})`}>
          <QuantityLines lines={lines} onChange={setLines} onAdd={() => setPicker(true)} />
        </Section>
        <ProductPicker
          visible={picker}
          onClose={() => setPicker(false)}
          showStock={false}
          selectedIds={lines.map((l) => l.productId)}
          onPick={(p) =>
            setLines((prev) =>
              prev.some((l) => l.productId === p.id)
                ? prev
                : [...prev, { productId: p.id, name: p.name, code: p.productCode, quantity: 1 }]
            )
          }
        />
      </Screen>
    </>
  );
}
