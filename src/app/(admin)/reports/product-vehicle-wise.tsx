import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { addDays } from 'date-fns';
import { useState } from 'react';
import { View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import { Card, DateField, EmptyState, IconButton, KeyValue, Row, Screen, Section, SegmentedControl } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { formatNumber, toYmd } from '@/lib/format';
import { productVehicleWiseService } from '@/services/reports';

export default function ProductVehicleWiseScreen() {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<'vehicle' | 'product'>('vehicle');
  const ymd = toYmd(date);
  const query = useQuery({ queryKey: ['product-vehicle-wise', ymd], queryFn: () => productVehicleWiseService.get(ymd) });

  return (
    <>
      <Stack.Screen options={{ title: 'Product vehicle-wise' }} />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        <Row>
          <IconButton icon="arrow_back" onPress={() => setDate((d) => addDays(d, -1))} accessibilityLabel="Previous day" />
          <View style={{ flex: 1 }}>
            <DateField value={date} onChange={(d) => d && setDate(d)} />
          </View>
          <IconButton icon="chevron_right" onPress={() => setDate((d) => addDays(d, 1))} accessibilityLabel="Next day" />
        </Row>
        <SegmentedControl
          options={[
            { value: 'vehicle', label: 'By vehicle' },
            { value: 'product', label: 'By product' },
          ]}
          value={view}
          onChange={setView}
        />
        <QueryBoundary query={query}>
          {(data) =>
            !data.columns.length ? (
              <EmptyState title="No dispatches" message={`Nothing loaded on ${data.dateLabel}.`} icon="local_shipping" />
            ) : (
              <>
                <Card>
                  <KeyValue label="Vehicles" value={data.columns.length} />
                  <KeyValue label="Total cartons" value={formatNumber(data.grandTotal)} emphasize />
                </Card>
                {view === 'vehicle'
                  ? data.columns.map((c) => (
                      <Section key={c.id} title={`${c.vehicleLabel} · ${formatNumber(data.columnTotals[c.id] ?? 0)} CB`}>
                        <Card>
                          <ThemedText type="small" themeColor="textSecondary">
                            {c.subtitle}
                          </ThemedText>
                          {data.products
                            .filter((p) => (p.quantities[c.id] ?? 0) > 0)
                            .map((p) => (
                              <KeyValue key={p.productId} label={p.name} value={p.quantities[c.id]} />
                            ))}
                        </Card>
                      </Section>
                    ))
                  : (
                    <View style={{ gap: Spacing.two }}>
                      {data.products.map((p) => (
                        <Card key={p.productId}>
                          <Row style={{ justifyContent: 'space-between' }}>
                            <View style={{ flex: 1 }}>
                              <ThemedText type="heading" numberOfLines={1}>
                                {p.name}
                              </ThemedText>
                              <ThemedText type="caption" themeColor="textSecondary">
                                {p.productCode}
                              </ThemedText>
                            </View>
                            <ThemedText type="heading">{formatNumber(p.rowTotal)} CB</ThemedText>
                          </Row>
                          {data.columns
                            .filter((c) => (p.quantities[c.id] ?? 0) > 0)
                            .map((c) => (
                              <KeyValue key={c.id} label={`${c.vehicleLabel} · ${c.subtitle}`} value={p.quantities[c.id]} />
                            ))}
                        </Card>
                      ))}
                    </View>
                  )}
              </>
            )
          }
        </QueryBoundary>
      </Screen>
    </>
  );
}
