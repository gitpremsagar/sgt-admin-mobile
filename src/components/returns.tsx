import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { EditSheet } from '@/components/edit-sheet';
import { ListScreen } from '@/components/list-screen';
import { QueryBoundary } from '@/components/query-boundary';
import { QuantityLines, type QtyLine } from '@/components/quantity-lines';
import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  Button,
  Card,
  confirmAction,
  DateField,
  Divider,
  Input,
  ListRow,
  Row,
  Screen,
  Section,
  SelectField,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { customerName, qk, useCustomerOptions } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate } from '@/lib/format';
import { orderService } from '@/services/orders';
import { creditNoteService, salesReturnService, type ReturnLine } from '@/services/returns';
import type { ReturnItem } from '@/types/models';

export type ReturnKind = 'return' | 'credit';

/** Normalised shape so sales returns and credit notes share one UI. */
type Doc = {
  id: string;
  customerId: string;
  orderId: string;
  date: string;
  reason: string;
  customer: { name: string; CustomerDetail: { dbName: string }[] };
  order: { id: string; customeOrderId: string; orderDate: string };
  items: ReturnItem[];
};

const CFG = {
  return: {
    title: 'Sales returns',
    singular: 'Sales return',
    key: ['sales-returns'],
    route: '/sales-returns' as const,
    list: async (p: { page: number; customerId?: string }) => {
      const d = await salesReturnService.list({ ...p, limit: 30 });
      return {
        items: d.salesReturns.map(
          (r): Doc => ({ ...r, date: r.returnDate, reason: r.returnReason, items: r.SalesReturnItem })
        ),
        pagination: d.pagination,
      };
    },
    get: async (id: string): Promise<Doc> => {
      const r = await salesReturnService.get(id);
      return { ...r, date: r.returnDate, reason: r.returnReason, items: r.SalesReturnItem };
    },
    create: (b: { customerId: string; orderId: string; date: string; reason: string; items: ReturnLine[] }) =>
      salesReturnService.create({ ...b, returnDate: b.date, returnReason: b.reason }),
    update: (id: string, b: { date?: string; reason?: string; items?: ReturnLine[] }) =>
      salesReturnService.update(id, { returnDate: b.date, returnReason: b.reason, items: b.items }),
    remove: salesReturnService.remove,
  },
  credit: {
    title: 'Credit notes',
    singular: 'Credit note',
    key: ['credit-notes'],
    route: '/credit-notes' as const,
    list: async (p: { page: number; customerId?: string }) => {
      const d = await creditNoteService.list({ ...p, limit: 30 });
      return {
        items: d.creditNotes.map((r): Doc => ({ ...r, date: r.noteDate, reason: r.noteReason, items: r.CreditNoteItem })),
        pagination: d.pagination,
      };
    },
    get: async (id: string): Promise<Doc> => {
      const r = await creditNoteService.get(id);
      return { ...r, date: r.noteDate, reason: r.noteReason, items: r.CreditNoteItem };
    },
    create: (b: { customerId: string; orderId: string; date: string; reason: string; items: ReturnLine[] }) =>
      creditNoteService.create({ ...b, noteDate: b.date, noteReason: b.reason }),
    update: (id: string, b: { date?: string; reason?: string; items?: ReturnLine[] }) =>
      creditNoteService.update(id, { noteDate: b.date, noteReason: b.reason, items: b.items }),
    remove: creditNoteService.remove,
  },
};

const totalQty = (items: { quantity: number }[]) => items.reduce((s, i) => s + i.quantity, 0);

export function ReturnsList({ kind }: { kind: ReturnKind }) {
  const cfg = CFG[kind];
  const customerOptions = useCustomerOptions();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const query = useInfiniteQuery({
    queryKey: [...cfg.key, 'list', customerId],
    queryFn: ({ pageParam }) => cfg.list({ page: pageParam, customerId: customerId ?? undefined }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination && last.pagination.currentPage < last.pagination.totalPages
        ? last.pagination.currentPage + 1
        : undefined,
  });
  const rows = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: cfg.title }} />
      <ListScreen
        data={rows}
        keyExtractor={(r) => r.id}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={query.refetch}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        loadingMore={query.isFetchingNextPage}
        emptyTitle={`No ${cfg.title.toLowerCase()}`}
        emptyIcon={kind === 'return' ? 'assignment_return' : 'credit_card'}
        fab={{ onPress: () => router.push(`${cfg.route}/new`), label: `New ${cfg.singular.toLowerCase()}` }}
        header={
          <SelectField
            value={customerId}
            options={customerOptions}
            onChange={setCustomerId}
            allowClear
            searchable
            placeholder="All distributors"
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={customerName(item.customer)}
            subtitle={`Order #${item.order?.customeOrderId} · ${formatDate(item.date)}`}
            meta={item.reason}
            right={<Badge label={`${totalQty(item.items)} CB`} />}
            onPress={() => router.push(`${cfg.route}/${item.id}`)}
          />
        )}
      />
    </>
  );
}

export function ReturnForm({ kind }: { kind: ReturnKind }) {
  const cfg = CFG[kind];
  const customerOptions = useCustomerOptions();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(new Date());
  const [reason, setReason] = useState('');
  const [lines, setLines] = useState<QtyLine[]>([]);

  const orders = useQuery({
    queryKey: [...qk.orders, 'for-return', customerId],
    queryFn: () => orderService.list({ customerId: customerId!, includeAllStatuses: true, limit: 50, page: 1 }),
    enabled: !!customerId,
  });
  const orderOptions = useMemo(
    () =>
      (orders.data?.orders ?? []).map((o) => ({
        value: o.id,
        label: `#${o.customeOrderId}`,
        description: `${formatDate(o.orderDate)} · ${o.OrderItem.length} items`,
      })),
    [orders.data]
  );

  const pickOrder = (id: string | null) => {
    setOrderId(id);
    const order = orders.data?.orders.find((o) => o.id === id);
    setLines(
      (order?.OrderItem ?? []).map((i) => ({
        productId: i.productId,
        name: i.Product?.name ?? i.productId,
        code: i.Product?.productCode,
        quantity: 0,
        max: i.quantity,
      }))
    );
  };

  const save = useApiMutation(
    async () => {
      if (!customerId || !orderId) throw new Error('Select a distributor and order');
      if (!reason.trim()) throw new Error('Enter a reason');
      const items = lines.filter((l) => l.quantity > 0).map((l) => ({ productId: l.productId, quantity: l.quantity }));
      if (!items.length) throw new Error('Enter a quantity for at least one product');
      return cfg.create({ customerId, orderId, date: (date ?? new Date()).toISOString(), reason: reason.trim(), items });
    },
    {
      invalidate: [cfg.key, [...qk.products]],
      successMessage: `${cfg.singular} created`,
      onSuccess: () => router.back(),
    }
  );

  return (
    <>
      <Stack.Screen options={{ title: `New ${cfg.singular.toLowerCase()}` }} />
      <Screen footer={<Button title="Save" icon="check" onPress={() => save.mutate()} loading={save.isPending} />}>
        <Card>
          <SelectField
            label="Distributor"
            value={customerId}
            options={customerOptions}
            searchable
            onChange={(v) => {
              setCustomerId(v);
              pickOrder(null);
            }}
          />
          <SelectField
            label="Order"
            value={orderId}
            options={orderOptions}
            searchable
            disabled={!customerId}
            placeholder={orders.isLoading ? 'Loading orders…' : 'Select order'}
            onChange={pickOrder}
          />
          <DateField label={kind === 'return' ? 'Return date' : 'Note date'} value={date} onChange={setDate} />
          <Input label="Reason" value={reason} onChangeText={setReason} multiline />
        </Card>
        {lines.length ? (
          <Section title="Quantities">
            <ThemedText type="caption" themeColor="textSecondary">
              Leave 0 for products that are not part of this {cfg.singular.toLowerCase()}.
            </ThemedText>
            <QuantityLines lines={lines} onChange={setLines} allowZero />
          </Section>
        ) : null}
      </Screen>
    </>
  );
}

export function ReturnDetail({ kind, id }: { kind: ReturnKind; id: string }) {
  const cfg = CFG[kind];
  const [edit, setEdit] = useState<null | 'reason'>(null);
  const query = useQuery({ queryKey: [...cfg.key, 'detail', id], queryFn: () => cfg.get(id) });
  const update = useApiMutation<{ date?: string; reason?: string }, unknown>((b) => cfg.update(id, b), {
    invalidate: [cfg.key],
    successMessage: `${cfg.singular} updated`,
    onSuccess: () => setEdit(null),
  });
  const remove = useApiMutation(() => cfg.remove(id), {
    invalidate: [cfg.key, [...qk.products]],
    successMessage: `${cfg.singular} deleted`,
    onSuccess: () => router.back(),
  });

  return (
    <>
      <Stack.Screen options={{ title: cfg.singular }} />
      <QueryBoundary query={query}>
        {(doc) => (
          <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
            <Card>
              <ThemedText type="subtitle">{customerName(doc.customer)}</ThemedText>
              <ListRow
                title={`Order #${doc.order?.customeOrderId}`}
                subtitle={formatDate(doc.order?.orderDate)}
                icon="receipt_long"
                onPress={() => router.push({ pathname: '/orders/[id]', params: { id: doc.orderId } })}
              />
              <DateField
                label="Date"
                value={new Date(doc.date)}
                onChange={(d) => d && update.mutate({ date: d.toISOString() })}
              />
              <ListRow title="Reason" subtitle={doc.reason} icon="edit" onPress={() => setEdit('reason')} />
            </Card>
            <Section title={`Items · ${totalQty(doc.items)} CB`}>
              <Card>
                {doc.items.map((i, idx) => (
                  <View key={i.id} style={{ gap: Spacing.two }}>
                    {idx ? <Divider /> : null}
                    <Row style={{ justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="default">{i.Product?.name}</ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {i.Product?.productCode}
                        </ThemedText>
                      </View>
                      <ThemedText type="heading">{i.quantity} CB</ThemedText>
                    </Row>
                  </View>
                ))}
              </Card>
            </Section>
            <Button
              title={`Delete ${cfg.singular.toLowerCase()}`}
              icon="delete"
              variant="danger"
              loading={remove.isPending}
              onPress={async () => {
                if (await confirmAction({ title: `Delete ${cfg.singular.toLowerCase()}?`, confirmLabel: 'Delete', destructive: true })) {
                  remove.mutate();
                }
              }}
            />
            <EditSheet
              visible={edit === 'reason'}
              onClose={() => setEdit(null)}
              title="Reason"
              label="Reason"
              kind="multiline"
              allowEmpty={false}
              initial={doc.reason}
              saving={update.isPending}
              onSave={(v) => update.mutate({ reason: String(v) })}
            />
          </Screen>
        )}
      </QueryBoundary>
    </>
  );
}
