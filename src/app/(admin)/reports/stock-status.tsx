import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { addDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import {
  Button,
  Card,
  DateField,
  Divider,
  IconButton,
  Input,
  KeyValue,
  LoadingState,
  Row,
  SearchBar,
  Section,
  SegmentedControl,
  Sheet,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDateTime, formatNumber, toNumberOrNull, toYmd } from '@/lib/format';
import { openingStockService, type DailyFields, type StockStatusRow } from '@/services/reports';

const KEY = ['stock-status'];

export default function StockStatusScreen() {
  const [date, setDate] = useState(new Date());
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StockStatusRow | null>(null);
  const ymd = toYmd(date);
  const query = useQuery({ queryKey: [...KEY, ymd], queryFn: () => openingStockService.report(ymd) });
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = query.data ?? [];
    return q ? list.filter((r) => r.productName.toLowerCase().includes(q) || r.productCode.toLowerCase().includes(q)) : list;
  }, [query.data, search]);

  return (
    <>
      <Stack.Screen options={{ title: 'Stock status' }} />
      <ListScreen
        data={rows}
        keyExtractor={(r) => r.productId}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No products"
        header={
          <>
            <Row>
              <IconButton icon="arrow_back" onPress={() => setDate((d) => addDays(d, -1))} accessibilityLabel="Previous day" />
              <View style={{ flex: 1 }}>
                <DateField value={date} onChange={(d) => d && setDate(d)} maximumDate={new Date()} />
              </View>
              <IconButton icon="chevron_right" onPress={() => setDate((d) => addDays(d, 1))} accessibilityLabel="Next day" />
            </Row>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search product" />
          </>
        }
        renderItem={({ item }) => (
          <Card onPress={() => setSelected(item)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <ThemedText type="heading" numberOfLines={1}>
                  {item.productName}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {item.productCode}
                </ThemedText>
              </View>
              <ThemedText type="subtitle">{formatNumber(item.closingStock)}</ThemedText>
            </Row>
            <ThemedText type="small" themeColor="textSecondary">
              Open {item.openingStock} · In {item.inwardQuantity} · Out {item.outwardQuantity}
              {item.onPassageQuantity ? ` · On passage ${item.onPassageQuantity}` : ''}
            </ThemedText>
          </Card>
        )}
      />
      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.productName} fullHeight>
        {selected ? <RowDetail row={selected} date={ymd} onClose={() => setSelected(null)} /> : null}
      </Sheet>
    </>
  );
}

const FIELDS: { key: keyof DailyFields; label: string; text?: boolean }[] = [
  { key: 'allocation', label: 'Allocation' },
  { key: 'dip', label: 'DIP' },
  { key: 'pendingQuantity', label: 'Pending qty' },
  { key: 'arsQuantity', label: 'ARS qty' },
  { key: 'manualOrderQuantity', label: 'Manual order qty' },
  { key: 'requirement', label: 'Requirement' },
  { key: 'tallyQuantity', label: 'Tally qty' },
  { key: 'dmsQuantity', label: 'DMS qty' },
  { key: 'tallyRemark', label: 'Tally remark', text: true },
  { key: 'dmsRemark', label: 'DMS remark', text: true },
];

function RowDetail({ row, date, onClose }: { row: StockStatusRow; date: string; onClose: () => void }) {
  const [tab, setTab] = useState<'fields' | 'movements'>('fields');
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, row[f.key] != null ? String(row[f.key]) : '']))
  );
  const movements = useQuery({
    queryKey: [...KEY, 'movements', date, row.productId],
    queryFn: () => openingStockService.movements(date, row.productId),
    enabled: tab === 'movements',
  });
  const save = useApiMutation(
    () => {
      const patch: Partial<DailyFields> = {};
      FIELDS.forEach((f) => {
        const raw = values[f.key].trim();
        const next = f.text ? raw || null : toNumberOrNull(raw);
        if (next !== (row[f.key] ?? null)) (patch as Record<string, unknown>)[f.key] = next;
      });
      return openingStockService.updateDailyFields({ date, productId: row.productId, ...patch });
    },
    { invalidate: [KEY], successMessage: 'Saved', onSuccess: onClose }
  );

  return (
    <View style={{ gap: Spacing.three }}>
      <Card>
        <KeyValue label="Opening" value={row.openingStock} />
        <KeyValue label="Inward" value={row.inwardQuantity} />
        <KeyValue label="Outward" value={row.outwardQuantity} />
        <KeyValue label="Closing" value={row.closingStock} emphasize />
      </Card>
      <SegmentedControl
        options={[
          { value: 'fields', label: 'Daily fields' },
          { value: 'movements', label: 'Movements' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'fields' ? (
        <>
          {FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              value={values[f.key]}
              onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
              keyboardType={f.text ? 'default' : 'decimal-pad'}
            />
          ))}
          <Button title="Save" onPress={() => save.mutate()} loading={save.isPending} />
        </>
      ) : movements.isLoading ? (
        <LoadingState />
      ) : (
        <>
          {(['inward', 'outward'] as const).map((dir) => (
            <Section key={dir} title={dir === 'inward' ? 'Inward' : 'Outward'}>
              <Card>
                {(movements.data?.[dir] ?? []).length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    None
                  </ThemedText>
                ) : (
                  movements.data?.[dir].map((mv, i) => (
                    <View key={mv.id} style={{ gap: Spacing.one }}>
                      {i ? <Divider /> : null}
                      <Row style={{ justifyContent: 'space-between' }}>
                        <ThemedText type="smallBold">{mv.reason}</ThemedText>
                        <ThemedText type="heading">{mv.changeInStock}</ThemedText>
                      </Row>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {[formatDateTime(mv.changeDate), mv.userName, mv.orderCustomId ? `#${mv.orderCustomId}` : null, mv.orderDbName]
                          .filter(Boolean)
                          .join(' · ')}
                      </ThemedText>
                    </View>
                  ))
                )}
              </Card>
            </Section>
          ))}
        </>
      )}
    </View>
  );
}
