import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import { Badge, Button, Card, confirmAction, Divider, IconButton, KeyValue, Row, Screen, Section } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { customerName } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatNumber } from '@/lib/format';
import { forecastService } from '@/services/reports';

export default function ForecastReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ['forecasts', 'report', id], queryFn: () => forecastService.report(id) });
  const remove = useApiMutation(() => forecastService.remove(id), {
    invalidate: [['forecasts']],
    successMessage: 'Forecast deleted',
    onSuccess: () => router.back(),
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Forecast',
          headerRight: () => (
            <IconButton
              icon="edit"
              accessibilityLabel="Edit forecast"
              onPress={() => router.push({ pathname: '/reports/forecasts/[id]/edit', params: { id } })}
            />
          ),
        }}
      />
      <QueryBoundary query={query}>
        {(data) => {
          const totals = data.comparison.reduce(
            (t, r) => ({ f: t.f + r.forecastQty, b: t.b + r.billedQty }),
            { f: 0, b: 0 }
          );
          return (
            <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
              <Card>
                <ThemedText type="subtitle">{customerName(data.forecast.Distributor)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {format(new Date(data.monthYear.year, data.monthYear.month - 1, 1), 'MMMM yyyy')}
                </ThemedText>
                <Divider />
                <KeyValue label="Forecast" value={`${formatNumber(totals.f)} CB`} />
                <KeyValue label="Billed" value={`${formatNumber(totals.b)} CB`} emphasize />
                <KeyValue label="Balance" value={`${formatNumber(totals.f - totals.b)} CB`} />
              </Card>
              <Section title="Forecast vs billed">
                <View style={{ gap: Spacing.two }}>
                  {data.comparison.map((r) => (
                    <Card key={r.productId}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="heading" numberOfLines={1}>
                            {r.productName}
                          </ThemedText>
                          <ThemedText type="caption" themeColor="textSecondary">
                            {r.productCode}
                          </ThemedText>
                        </View>
                        <Badge label={`Bal ${r.balance}`} tone={r.balance <= 0 ? 'success' : 'warning'} />
                      </Row>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <ThemedText type="small">Forecast {r.forecastQty}</ThemedText>
                        <ThemedText type="small">Billed {r.billedQty}</ThemedText>
                      </Row>
                    </Card>
                  ))}
                </View>
              </Section>
              {data.productsNotInForecast.length ? (
                <Section title="Billed but not forecast">
                  <Card>
                    {data.productsNotInForecast.map((p) => (
                      <KeyValue key={p.id} label={`${p.name} (${p.productCode})`} value={`${p.billedQty} CB`} />
                    ))}
                  </Card>
                </Section>
              ) : null}
              <Button
                title="Delete forecast"
                icon="delete"
                variant="danger"
                loading={remove.isPending}
                onPress={async () => {
                  if (await confirmAction({ title: 'Delete forecast?', confirmLabel: 'Delete', destructive: true })) remove.mutate();
                }}
              />
            </Screen>
          );
        }}
      </QueryBoundary>
    </>
  );
}
