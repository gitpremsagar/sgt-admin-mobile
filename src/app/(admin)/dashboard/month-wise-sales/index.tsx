import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import { Badge, Button, Card, FilterChips, Input, KeyValue, Row, Screen, Section, Sheet } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { qk } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { financialYearOf, formatCompactCurrency, formatPercent, recentFinancialYears, toNumberOrNull } from '@/lib/format';
import { dashboardService, type MonthWiseSalesRow } from '@/services/dashboard';

export default function MonthWiseSalesScreen() {
  const [fy, setFy] = useState(financialYearOf());
  const [editing, setEditing] = useState<MonthWiseSalesRow | null>(null);
  const query = useQuery({
    queryKey: [...qk.dashboard, 'month-wise-sales', fy],
    queryFn: () => dashboardService.monthWiseSalesReport(fy),
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Month-wise sales' }} />
      <QueryBoundary query={query}>
        {(data) => {
          const year = data.years.find((y) => y.financialYear === fy) ?? data.years[data.years.length - 1];
          return (
            <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
              <FilterChips
                options={recentFinancialYears(4).map((y) => ({ value: y, label: `FY ${y}` }))}
                value={fy}
                onChange={setFy}
              />
              {year ? (
                <>
                  <Card>
                    <KeyValue label="Primary target" value={formatCompactCurrency(year.totals.primaryTarget)} />
                    <KeyValue label="Tally achieved" value={formatCompactCurrency(year.totals.tallyAchieved)} emphasize />
                    <KeyValue label="DMS achieved" value={formatCompactCurrency(year.totals.dmsAchieved)} />
                    <KeyValue
                      label="Achieved"
                      value={year.totals.achievePercent != null ? formatPercent(year.totals.achievePercent) : '—'}
                    />
                    {year.totals.compareFromPreviousYear != null ? (
                      <KeyValue label="vs last year" value={formatPercent(year.totals.compareFromPreviousYear)} />
                    ) : null}
                  </Card>
                  <Section title="Months">
                    <View style={{ gap: Spacing.two }}>
                      {year.rows.map((r) => (
                        <Card
                          key={r.monthIndex}
                          onPress={() =>
                            router.push({
                              pathname: '/dashboard/month-wise-sales/[fy]/[month]',
                              params: { fy: year.financialYear, month: String(r.monthIndex) },
                            })
                          }>
                          <Row style={{ justifyContent: 'space-between' }}>
                            <ThemedText type="heading">{r.monthLabel}</ThemedText>
                            <Row>
                              {r.achievePercent != null ? (
                                <Badge
                                  label={formatPercent(r.achievePercent)}
                                  tone={r.achievePercent >= 100 ? 'success' : r.achievePercent >= 80 ? 'warning' : 'danger'}
                                />
                              ) : null}
                              <Button title="Edit" size="sm" variant="ghost" onPress={() => setEditing(r)} />
                            </Row>
                          </Row>
                          <KeyValue label="Target" value={r.primaryTarget != null ? formatCompactCurrency(r.primaryTarget) : '—'} />
                          <KeyValue label="Tally" value={formatCompactCurrency(r.tallyAchieved)} />
                          <KeyValue label="DMS" value={r.dmsAchieved != null ? formatCompactCurrency(r.dmsAchieved) : '—'} />
                          {r.remark ? (
                            <ThemedText type="small" themeColor="textSecondary">
                              {r.remark}
                            </ThemedText>
                          ) : null}
                        </Card>
                      ))}
                    </View>
                  </Section>
                </>
              ) : null}
              <EditMonthSheet fy={year?.financialYear ?? fy} row={editing} onClose={() => setEditing(null)} />
            </Screen>
          );
        }}
      </QueryBoundary>
    </>
  );
}

function EditMonthSheet({ fy, row, onClose }: { fy: string; row: MonthWiseSalesRow | null; onClose: () => void }) {
  const [target, setTarget] = useState('');
  const [dms, setDms] = useState('');
  const [remark, setRemark] = useState('');
  const [lastKey, setLastKey] = useState<number | null>(null);
  if (row && row.monthIndex !== lastKey) {
    setLastKey(row.monthIndex);
    setTarget(row.primaryTarget != null ? String(row.primaryTarget) : '');
    setDms(row.dmsAchieved != null ? String(row.dmsAchieved) : '');
    setRemark(row.remark ?? '');
  }
  const close = () => {
    setLastKey(null);
    onClose();
  };
  const save = useApiMutation(
    () =>
      dashboardService.upsertMonthWiseSalesReport({
        financialYear: fy,
        monthIndex: row!.monthIndex,
        primaryTarget: toNumberOrNull(target),
        dmsAchieved: toNumberOrNull(dms),
        remark: remark.trim() || null,
      }),
    { invalidate: [[...qk.dashboard]], successMessage: 'Month updated', onSuccess: close }
  );
  return (
    <Sheet
      visible={!!row}
      onClose={close}
      title={row ? `${row.monthLabel} · FY ${fy}` : ''}
      footer={<Button title="Save" onPress={() => save.mutate()} loading={save.isPending} />}>
      <Input label="Primary target (₹)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
      <Input
        label="DMS achieved (₹)"
        value={dms}
        onChangeText={setDms}
        keyboardType="decimal-pad"
        hint={row?.isHistorical ? undefined : 'Only used for historical months'}
      />
      <Input label="Remark" value={remark} onChangeText={setRemark} multiline />
    </Sheet>
  );
}
