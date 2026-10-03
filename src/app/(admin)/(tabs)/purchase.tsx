import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';

import { ListScreen } from '@/components/list-screen';
import { PurchaseCard, purchaseCartons } from '@/components/purchase-card';
import { ThemedText } from '@/components/themed-text';
import { Button, Row, SearchBar, SegmentedControl } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { formatNumber } from '@/lib/format';
import { boardColumnOf, purchaseService, type BoardColumn } from '@/services/purchases';
import type { Purchase } from '@/types/models';

const COLUMNS: { value: BoardColumn; label: string }[] = [
  { value: 'loading', label: 'Loading' },
  { value: 'transit', label: 'In transit' },
  { value: 'unloaded', label: 'Unloaded' },
];

export default function PurchaseBoardScreen() {
  const [column, setColumn] = useState<BoardColumn>('transit');
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: [...qk.purchases, 'active'], queryFn: purchaseService.active });

  const data = query.data;
  const grouped = useMemo(() => {
    const out: Record<BoardColumn, Purchase[]> = { loading: [], transit: [], unloaded: [] };
    (data ?? []).forEach((p) => out[boardColumnOf(p.purchaseTransportStatus)].push(p));
    return out;
  }, [data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = grouped[column];
    if (!q) return list;
    return list.filter(
      (p) =>
        p.vehicleNumber?.toLowerCase().includes(q) ||
        p.Transporter?.name.toLowerCase().includes(q) ||
        p.PurchaseInvoice.some((i) => i.invoiceID?.toLowerCase().includes(q))
    );
  }, [grouped, column, search]);

  const cartons = rows.reduce((s, p) => s + purchaseCartons(p), 0);

  return (
    <ListScreen
      data={rows}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <PurchaseCard purchase={item} />}
      isLoading={query.isLoading}
      error={query.error}
      refreshing={query.isRefetching}
      onRefresh={query.refetch}
      emptyTitle="No vehicles here"
      emptyIcon="local_shipping"
      fab={{ onPress: () => router.push('/purchases/new'), label: 'New purchase' }}
      header={
        <>
          <SegmentedControl
            options={COLUMNS.map((c) => ({ value: c.value, label: `${c.label} (${grouped[c.value].length})` }))}
            value={column}
            onChange={setColumn}
          />
          <SearchBar value={search} onChangeText={setSearch} placeholder="Vehicle, transporter, invoice" />
          <Row style={{ justifyContent: 'space-between' }}>
            <ThemedText type="small" themeColor="textSecondary">
              {rows.length} vehicles · {formatNumber(cartons)} CB
            </ThemedText>
            <Button
              title="History"
              icon="history"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/reports/purchase-history')}
            />
          </Row>
        </>
      }
    />
  );
}
