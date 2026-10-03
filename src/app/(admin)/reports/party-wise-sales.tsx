import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MonthNav } from '@/components/attendance';
import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Input, KeyValue, Row, Screen, Section, Sheet } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCompactCurrency, formatDate, formatPercent, toNumberOrNull } from '@/lib/format';
import { partyWiseSalesService, type PartyRow, type PartyWiseSales } from '@/services/reports';

type Party = PartyWiseSales['tags'][number]['parties'][number];

export default function PartyWiseSalesScreen() {
  const [month, setMonth] = useState(new Date());
  const [editing, setEditing] = useState<Party | null>(null);
  const y = month.getFullYear();
  const m = month.getMonth() + 1;
  const query = useQuery({ queryKey: ['party-wise-sales', y, m], queryFn: () => partyWiseSalesService.get(y, m) });

  return (
    <>
      <Stack.Screen options={{ title: 'Party-wise sales' }} />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        <MonthNav value={month} onChange={setMonth} />
        <QueryBoundary query={query}>
          {(data) => (
            <>
              <Card>
                <Totals row={data.grandTotal} labels={data.monthLabels} />
                {data.compare.prev1Percent != null ? (
                  <KeyValue label={`vs ${data.monthLabels.prev1}`} value={formatPercent(data.compare.prev1Percent)} />
                ) : null}
              </Card>
              {data.tags.map((tag) => (
                <Section key={tag.id} title={`${tag.name} · ${formatCompactCurrency(tag.subtotal.monthTotals.current)}`}>
                  <View style={{ gap: Spacing.two }}>
                    {tag.parties.map((p) => (
                      <Card key={p.customerId} onPress={() => setEditing(p)}>
                        <Row style={{ justifyContent: 'space-between' }}>
                          <ThemedText type="heading" style={{ flex: 1 }} numberOfLines={1}>
                            {p.partyName}
                          </ThemedText>
                          <ThemedText type="heading">{formatCompactCurrency(p.monthTotals.current)}</ThemedText>
                        </Row>
                        <ThemedText type="small" themeColor="textSecondary">
                          {data.monthLabels.prev1} {formatCompactCurrency(p.monthTotals.prev1)} · {data.monthLabels.prev2}{' '}
                          {formatCompactCurrency(p.monthTotals.prev2)}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          Target {p.targetAmount != null ? formatCompactCurrency(p.targetAmount) : '—'}
                          {p.balanceAmountTarget != null ? ` · Balance ${formatCompactCurrency(p.balanceAmountTarget)}` : ''}
                          {` · Vehicles ${p.vehiclesSoldTillDate}${p.targetVehicles != null ? `/${p.targetVehicles}` : ''}`}
                        </ThemedText>
                        {p.lastBillingDate ? (
                          <ThemedText type="caption" themeColor="textSecondary">
                            Last billed {formatDate(p.lastBillingDate)}
                          </ThemedText>
                        ) : null}
                      </Card>
                    ))}
                  </View>
                </Section>
              ))}
            </>
          )}
        </QueryBoundary>
      </Screen>
      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing?.partyName}>
        {editing ? <TargetForm party={editing} year={y} month={m} onClose={() => setEditing(null)} /> : null}
      </Sheet>
    </>
  );
}

function Totals({ row, labels }: { row: PartyRow; labels: PartyWiseSales['monthLabels'] }) {
  return (
    <>
      <KeyValue label={labels.current} value={formatCompactCurrency(row.monthTotals.current)} emphasize />
      <KeyValue label={labels.prev1} value={formatCompactCurrency(row.monthTotals.prev1)} />
      <KeyValue label={labels.prev2} value={formatCompactCurrency(row.monthTotals.prev2)} />
      <KeyValue label="Target" value={row.targetAmount != null ? formatCompactCurrency(row.targetAmount) : '—'} />
      <KeyValue label="Vehicles sold" value={`${row.vehiclesSoldTillDate}${row.targetVehicles != null ? ` / ${row.targetVehicles}` : ''}`} />
    </>
  );
}

function TargetForm({ party, year, month, onClose }: { party: Party; year: number; month: number; onClose: () => void }) {
  const [amount, setAmount] = useState(party.targetAmount != null ? String(party.targetAmount) : '');
  const [vehicles, setVehicles] = useState(party.targetVehicles != null ? String(party.targetVehicles) : '');
  const save = useApiMutation(
    () =>
      partyWiseSalesService.setTarget({
        customerId: party.customerId,
        year,
        month,
        targetAmount: toNumberOrNull(amount),
        targetVehicles: toNumberOrNull(vehicles),
      }),
    { invalidate: [['party-wise-sales']], successMessage: 'Target saved', onSuccess: onClose }
  );
  return (
    <View style={{ gap: Spacing.three }}>
      <Input label="Target amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Input label="Target vehicles" value={vehicles} onChangeText={setVehicles} keyboardType="number-pad" />
      <Button title="Save target" onPress={() => save.mutate()} loading={save.isPending} />
    </View>
  );
}
