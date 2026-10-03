import { router } from 'expo-router';
import { startOfMonth } from 'date-fns';
import { useState } from 'react';

import { ProductPicker } from '@/components/product-picker';
import { QuantityLines, type QtyLine } from '@/components/quantity-lines';
import { Button, Card, DateField, Screen, Section, SelectField } from '@/components/ui';
import { useCustomerOptions } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { forecastService, type Forecast } from '@/services/reports';

export function ForecastForm({ forecast, distributorId: initialDistributor }: { forecast?: Forecast; distributorId?: string }) {
  const customerOptions = useCustomerOptions();
  const [distributorId, setDistributorId] = useState<string | null>(forecast?.distributorId ?? initialDistributor ?? null);
  const [month, setMonth] = useState<Date | null>(forecast ? new Date(forecast.forecastDate) : startOfMonth(new Date()));
  const [lines, setLines] = useState<QtyLine[]>(
    () =>
      forecast?.ForecastItem.map((i) => ({
        productId: i.productId,
        name: i.Product.name,
        code: i.Product.productCode,
        quantity: i.quantity,
      })) ?? []
  );
  const [picker, setPicker] = useState(false);

  const save = useApiMutation(
    async () => {
      if (!distributorId) throw new Error('Select a distributor');
      if (!lines.length) throw new Error('Add at least one product');
      const forecastItems = lines.map((l) => ({ productId: l.productId, quantity: l.quantity }));
      const forecastDate = startOfMonth(month ?? new Date()).toISOString();
      if (forecast) {
        await forecastService.update(forecast.id, { forecastDate, forecastItems });
        return forecast.id;
      }
      return (await forecastService.create({ distributorId, forecastDate, forecastItems })).id;
    },
    {
      invalidate: [['forecasts']],
      successMessage: forecast ? 'Forecast updated' : 'Forecast created',
      onSuccess: (id) => {
        if (forecast) router.back();
        else router.replace({ pathname: '/reports/forecasts/[id]', params: { id } });
      },
    }
  );

  return (
    <Screen footer={<Button title="Save forecast" icon="check" onPress={() => save.mutate()} loading={save.isPending} />}>
      <Card>
        <SelectField
          label="Distributor"
          value={distributorId}
          options={customerOptions}
          searchable
          disabled={!!forecast}
          onChange={setDistributorId}
        />
        <DateField label="Month (any day in the month)" value={month} onChange={setMonth} />
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
  );
}
