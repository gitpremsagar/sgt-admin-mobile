import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import { Badge, Button, Card, FilterChips, Input, KeyValue, Row, Screen, Section, Sheet } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { qk } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { financialYearOf, formatCompactCurrency, formatPercent, recentFinancialYears, toNumberOrNull } from '@/lib/format';
import { dashboardService, type MonthWisePurchaseRow } from '@/services/dashboard';

export default function MonthWisePurchasesScreen() {
  const [fy, setFy] = useState(financialYearOf());
  const [editing, setEditing] = useState<MonthWisePurchaseRow | null>(null);
  const query = useQuery({
    queryKey: [...qk.dashboard, 'month-wise-purchases', fy],
    queryFn: () => dashboardService.monthWisePurchaseReport(fy),
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Month-wise purchases' }} />
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
                    <KeyValue label="Target" value={formatCompactCurrency(year.totals.target)} />
                    <KeyValue label="Achieved" value={formatCompactCurrency(year.totals.achieved)} emphasize />
                    <KeyValue label="Balance" value={formatCompactCurrency(year.totals.balance)} />
                    <KeyValue
                      label="Achieved %"
                      value={year.totals.achievePercent != null ? formatPercent(year.totals.achievePercent) : '—'}
                    />
                  </Card>
                  <Section title="Months">
                    <View style={{ gap: Spacing.two }}>
                      {year.rows.map((r) => (
                        <Card key={r.monthIndex}>
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
                          <KeyValue label="Target" value={r.target != null ? formatCompactCurrency(r.target) : '—'} />
                          <KeyValue label="Achieved" value={formatCompactCurrency(r.achieved)} />
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
              <EditSheet fy={year?.financialYear ?? fy} row={editing} onClose={() => setEditing(null)} />
            </Screen>
          );
        }}
      </QueryBoundary>
    </>
  );
}

function EditSheet({ fy, row, onClose }: { fy: string; row: MonthWisePurchaseRow | null; onClose: () => void }) {
  const [target, setTarget] = useState('');
  const [remark, setRemark] = useState('');
  const [lastKey, setLastKey] = useState<number | null>(null);
  if (row && row.monthIndex !== lastKey) {
    setLastKey(row.monthIndex);
    setTarget(row.target != null ? String(row.target) : '');
    setRemark(row.remark ?? '');
  }
  const close = () => {
    setLastKey(null);
    onClose();
  };
  const save = useApiMutation(
    () =>
      dashboardService.upsertMonthWisePurchaseReport({
        financialYear: fy,
        monthIndex: row!.monthIndex,
        target: toNumberOrNull(target),
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
      <Input label="Target (₹)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
      <Input label="Remark" value={remark} onChangeText={setRemark} multiline />
    </Sheet>
  );
}
