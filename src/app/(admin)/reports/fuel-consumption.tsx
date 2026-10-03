import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MonthNav } from '@/components/attendance';
import { EditSheet } from '@/components/edit-sheet';
import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import { Card, Divider, EmptyState, KeyValue, ListRow, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatNumber } from '@/lib/format';
import { fuelService, type FuelField, type FuelRow } from '@/services/reports';

const EDITABLE: { field: FuelField; label: string; unit: string }[] = [
  { field: 'meterReadingDay1', label: 'Meter reading · day 1', unit: 'km' },
  { field: 'meterReadingDay16', label: 'Meter reading · day 16', unit: 'km' },
  { field: 'meterReadingLastDay', label: 'Meter reading · last day', unit: 'km' },
  { field: 'actualFuelFirstHalf', label: 'Fuel · 1st–15th', unit: 'L' },
  { field: 'actualFuelSecondHalf', label: 'Fuel · 16th–end', unit: 'L' },
];

const num = (v: number | null, unit: string) => (v == null ? '—' : `${formatNumber(v)} ${unit}`);

export default function FuelConsumptionScreen() {
  const [month, setMonth] = useState(new Date());
  const [editing, setEditing] = useState<{ row: FuelRow; field: (typeof EDITABLE)[number] } | null>(null);
  const y = month.getFullYear();
  const m = month.getMonth() + 1;
  const query = useQuery({ queryKey: ['fuel', y, m], queryFn: () => fuelService.report(y, m) });
  const save = useApiMutation(
    (value: number | null) => fuelService.updateEntry({ year: y, month: m, vehicleId: editing!.row.vehicleId, field: editing!.field.field, value }),
    { invalidate: [['fuel']], successMessage: 'Saved', onSuccess: () => setEditing(null) }
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Fuel consumption' }} />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        <MonthNav value={month} onChange={setMonth} />
        <QueryBoundary query={query}>
          {(rows) =>
            rows.length ? (
              <View style={{ gap: Spacing.three }}>
                {rows.map((r) => (
                  <Card key={r.vehicleId}>
                    <ThemedText type="subtitle">{r.vehicleNumber}</ThemedText>
                    <KeyValue label="Estimated travel" value={num(r.estimatedTravelMonth, 'km')} />
                    <KeyValue label="Actual travel" value={num(r.actualTravelMonth, 'km')} />
                    <KeyValue label="Fuel used" value={num(r.actualMonthlyFuel, 'L')} />
                    <KeyValue label="Mileage (actual / rated)" value={`${r.actualMileageMonth ?? '—'} / ${r.mileage ?? '—'} km/L`} emphasize />
                    <Divider />
                    {EDITABLE.map((f) => (
                      <ListRow
                        key={f.field}
                        title={f.label}
                        subtitle={num(r[f.field], f.unit)}
                        onPress={() => setEditing({ row: r, field: f })}
                      />
                    ))}
                  </Card>
                ))}
              </View>
            ) : (
              <EmptyState title="No vehicles" icon="local_gas_station" />
            )
          }
        </QueryBoundary>
      </Screen>
      <EditSheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.row.vehicleNumber}` : ''}
        label={editing ? `${editing.field.label} (${editing.field.unit})` : ''}
        kind="number"
        initial={editing ? editing.row[editing.field.field] : null}
        saving={save.isPending}
        onSave={(v) => save.mutate(v as number | null)}
      />
    </>
  );
}
