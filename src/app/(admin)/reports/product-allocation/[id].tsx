import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  Button,
  Card,
  confirmAction,
  DateField,
  Divider,
  IconButton,
  Input,
  KeyValue,
  Row,
  Screen,
  SearchBar,
  Section,
  Sheet,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatNumber, toNumberOrNull } from '@/lib/format';
import { allocationService, type AllocationParty } from '@/services/reports';

const KEY = ['allocations'];

export default function AllocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: [...KEY, 'detail', id], queryFn: () => allocationService.get(id) });
  const [search, setSearch] = useState('');
  const [party, setParty] = useState<AllocationParty | null>(null);
  const remove = useApiMutation(() => allocationService.remove(id), {
    invalidate: [KEY],
    successMessage: 'Allocation deleted',
    onSuccess: () => router.back(),
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Allocation' }} />
      <QueryBoundary query={query}>
        {(a) => {
          const q = search.trim().toLowerCase();
          const parties = [...a.parties]
            .filter((p) => !q || p.dbName.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
            .sort((x, y) => y.allocatedQty - x.allocatedQty || y.avgSaleLast3Months - x.avgSaleLast3Months);
          return (
            <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
              <Card>
                <ThemedText type="subtitle">{a.product.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {a.product.productCode} · {formatDate(a.allocationDate)} · by {a.createdBy.name}
                </ThemedText>
                <Divider />
                <KeyValue label="Received" value={`${formatNumber(a.receivedQty)} CB`} />
                <KeyValue label="Allocated" value={`${formatNumber(a.allocatedTotal)} CB`} />
                <KeyValue label="Remaining" value={`${formatNumber(a.remainingToAllocate)} CB`} emphasize />
                <KeyValue label="Billed" value={`${formatNumber(a.billedTotal)} CB`} />
                {a.notes ? <KeyValue label="Notes" value={a.notes} /> : null}
              </Card>
              <Section title={`Parties (${a.partyCount})`}>
                <SearchBar value={search} onChangeText={setSearch} placeholder="Search party" />
                <View style={{ gap: Spacing.two }}>
                  {parties.map((p) => (
                    <Card key={p.customerId} onPress={() => setParty(p)}>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <ThemedText type="heading" style={{ flex: 1 }} numberOfLines={1}>
                          {p.dbName || p.name}
                        </ThemedText>
                        {p.allocatedQty ? <Badge label={`${p.allocatedQty} CB`} tone="primary" /> : null}
                      </Row>
                      <ThemedText type="small" themeColor="textSecondary">
                        Avg 3m {formatNumber(p.avgSaleLast3Months)} · Billed {p.billedQty} · Balance {p.balanceQty}
                        {p.lastBillDate ? ` · Last ${formatDate(p.lastBillDate)}` : ''}
                      </ThemedText>
                    </Card>
                  ))}
                </View>
              </Section>
              <Button
                title="Delete allocation"
                icon="delete"
                variant="danger"
                loading={remove.isPending}
                onPress={async () => {
                  if (await confirmAction({ title: 'Delete allocation?', confirmLabel: 'Delete', destructive: true })) remove.mutate();
                }}
              />
              <Sheet visible={!!party} onClose={() => setParty(null)} title={party?.dbName || party?.name}>
                {party ? (
                  <PartyForm
                    allocationId={a.id}
                    party={party}
                    allParties={a.parties}
                    onClose={() => setParty(null)}
                  />
                ) : null}
              </Sheet>
            </Screen>
          );
        }}
      </QueryBoundary>
    </>
  );
}

function PartyForm({
  allocationId,
  party,
  allParties,
  onClose,
}: {
  allocationId: string;
  party: AllocationParty;
  allParties: AllocationParty[];
  onClose: () => void;
}) {
  const theme = useTheme();
  const [qty, setQty] = useState(String(party.allocatedQty || ''));
  const [billDate, setBillDate] = useState<Date | null>(new Date());
  const [billQty, setBillQty] = useState('');

  const saveQty = useApiMutation(
    () => {
      const next = toNumberOrNull(qty) ?? 0;
      const lines = allParties
        .map((p) => ({ customerId: p.customerId, allocatedQty: p.customerId === party.customerId ? next : p.allocatedQty }))
        .filter((l) => l.allocatedQty > 0);
      return allocationService.update(allocationId, { lines });
    },
    { invalidate: [KEY], successMessage: 'Allocation updated', onSuccess: onClose }
  );
  const addBill = useApiMutation(
    () =>
      allocationService.addFulfillment(allocationId, party.lineId!, {
        billDate: (billDate ?? new Date()).toISOString(),
        billQty: toNumberOrNull(billQty) ?? 0,
      }),
    { invalidate: [KEY], successMessage: 'Bill recorded', onSuccess: onClose }
  );

  return (
    <View style={{ gap: Spacing.three }}>
      <Input
        label="Allocated quantity (CB)"
        value={qty}
        onChangeText={setQty}
        keyboardType="number-pad"
        hint={`Average sale (last 3 months): ${formatNumber(party.avgSaleLast3Months)}`}
      />
      <Button title="Save allocation" onPress={() => saveQty.mutate()} loading={saveQty.isPending} />
      {party.lineId ? (
        <>
          <Divider />
          <ThemedText type="heading">Bills</ThemedText>
          {party.bills.length ? (
            party.bills.map((b, i) => <KeyValue key={i} label={formatDate(b.billDate)} value={`${b.billQty} CB`} />)
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              No bills recorded yet.
            </ThemedText>
          )}
          <Row style={{ alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <DateField label="Bill date" value={billDate} onChange={setBillDate} />
            </View>
            <Input label="Qty" value={billQty} onChangeText={setBillQty} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
            <IconButton
              icon="add"
              color={theme.primary}
              accessibilityLabel="Add bill"
              onPress={() => (toNumberOrNull(billQty) ? addBill.mutate() : undefined)}
            />
          </Row>
        </>
      ) : null}
    </View>
  );
}
