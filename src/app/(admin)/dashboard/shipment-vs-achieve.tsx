import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import { Badge, Card, FilterChips, KeyValue, Row, Screen, Section } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { qk } from '@/hooks/api/lookups';
import { financialYearOf, formatCompactCurrency, formatPercent, recentFinancialYears } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';

const money = (v: number | null) => (v == null ? '—' : formatCompactCurrency(v));
const pct = (v: number | null) => (v == null ? '—' : formatPercent(v));

export default function ShipmentVsAchieveScreen() {
  const [fy, setFy] = useState(financialYearOf());
  const query = useQuery({
    queryKey: [...qk.dashboard, 'shipment-vs-achieve', fy],
    queryFn: () => dashboardService.shipmentVsAchieve(fy),
  });
  return (
    <>
      <Stack.Screen options={{ title: 'Shipment vs achieve' }} />
      <QueryBoundary query={query}>
        {(data) => (
          <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
            <FilterChips
              options={recentFinancialYears(4).map((y) => ({ value: y, label: `FY ${y}` }))}
              value={fy}
              onChange={setFy}
            />
            <Card>
              <KeyValue label="Target (basic)" value={money(data.totals.targetBasic)} />
              <KeyValue label="Achieved (basic)" value={money(data.totals.achieveBasic)} emphasize />
              <KeyValue label="Achieved %" value={pct(data.totals.achPercent)} />
              <KeyValue label="Sale (basic)" value={money(data.totals.saleBasic)} />
              <KeyValue label="DMS (basic)" value={money(data.totals.dmsBasic)} />
              <KeyValue label="Incentive" value={money(data.totals.incentive)} />
              <ThemedText type="caption" themeColor="textSecondary">
                {data.mode === 'hardcoded' ? 'Historical figures' : 'Live figures'}. Edit targets on the web admin.
              </ThemedText>
            </Card>
            <Section title="Months">
              <View style={{ gap: Spacing.two }}>
                {data.rows.map((r) => (
                  <Card key={r.monthIndex}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <ThemedText type="heading">
                        {r.monthLabel}
                        {r.quarter ? ` · ${r.quarter}` : ''}
                      </ThemedText>
                      {r.achPercent != null ? (
                        <Badge label={pct(r.achPercent)} tone={r.achPercent >= 100 ? 'success' : 'warning'} />
                      ) : null}
                    </Row>
                    <KeyValue label="Target" value={money(r.targetBasic)} />
                    <KeyValue label="Achieved" value={money(r.achieveBasic)} />
                    <KeyValue label="Sale" value={money(r.saleBasic)} />
                    <KeyValue label="DMS" value={money(r.dmsBasic)} />
                    {r.avgSalePerDay != null ? <KeyValue label="Avg / day" value={money(r.avgSalePerDay)} /> : null}
                    {r.quarterAchPercent != null ? <KeyValue label="Quarter %" value={pct(r.quarterAchPercent)} /> : null}
                  </Card>
                ))}
              </View>
            </Section>
          </Screen>
        )}
      </QueryBoundary>
    </>
  );
}
