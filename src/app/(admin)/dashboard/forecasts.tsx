import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';

import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { Badge, Card, KeyValue, Row, SegmentedControl } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { formatCompactCurrency, formatPercent } from '@/lib/format';
import { dashboardService, type ForecastVsAchieve } from '@/services/dashboard';

type Mode = 'ss-month' | 'ss-year' | 'db-month';

const FETCHERS: Record<Mode, () => Promise<ForecastVsAchieve[]>> = {
  'ss-month': dashboardService.ssForecastCurrent,
  'ss-year': () => dashboardService.ssForecastYearly(),
  'db-month': dashboardService.dbForecastCurrent,
};

export default function ForecastVsAchieveScreen() {
  const [mode, setMode] = useState<Mode>('ss-month');
  const query = useQuery({ queryKey: [...qk.dashboard, 'forecast', mode], queryFn: FETCHERS[mode] });
  const rows = [...(query.data ?? [])].sort((a, b) => b.forecast - a.forecast);
  const totals = rows.reduce((t, r) => ({ f: t.f + r.forecast, a: t.a + r.achieved }), { f: 0, a: 0 });

  return (
    <>
      <Stack.Screen options={{ title: 'Forecast vs achieve' }} />
      <ListScreen
        data={rows}
        keyExtractor={(r) => r.distributorId}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No forecasts"
        header={
          <>
            <SegmentedControl
              options={[
                { value: 'ss-month', label: 'SS month' },
                { value: 'ss-year', label: 'SS year' },
                { value: 'db-month', label: 'DB month' },
              ]}
              value={mode}
              onChange={setMode}
            />
            {rows.length ? (
              <Card>
                <KeyValue label="Forecast" value={formatCompactCurrency(totals.f)} />
                <KeyValue label="Achieved" value={formatCompactCurrency(totals.a)} emphasize />
                <KeyValue label="Achieved %" value={totals.f ? formatPercent((totals.a / totals.f) * 100) : '—'} />
              </Card>
            ) : null}
          </>
        }
        renderItem={({ item }) => {
          const p = item.forecast ? (item.achieved / item.forecast) * 100 : null;
          return (
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <ThemedText type="heading" style={{ flex: 1 }} numberOfLines={1}>
                  {item.distributorName}
                </ThemedText>
                {p != null ? <Badge label={formatPercent(p)} tone={p >= 100 ? 'success' : p >= 80 ? 'warning' : 'danger'} /> : null}
              </Row>
              <KeyValue label="Forecast" value={formatCompactCurrency(item.forecast)} />
              <KeyValue label="Achieved" value={formatCompactCurrency(item.achieved)} />
            </Card>
          );
        }}
      />
    </>
  );
}
