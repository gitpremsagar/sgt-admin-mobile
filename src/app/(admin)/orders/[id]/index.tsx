import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EditSheet } from '@/components/edit-sheet';
import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  Button,
  Card,
  confirmAction,
  DateField,
  Divider,
  Input,
  KeyValue,
  ListRow,
  Row,
  Screen,
  Section,
  SegmentedControl,
  SelectField,
  Sheet,
  SwitchRow,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import {
  customerName,
  qk,
  useDriverOptions,
  useDrivers,
  useStatusTypeOptions,
  useVehicleOptions,
} from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent, toNumberOrNull } from '@/lib/format';
import { computeOrderTotals, type LineTotals } from '@/lib/order-totals';
import { orderStatusLabel, orderStatusTone } from '@/lib/status';
import { orderService } from '@/services/orders';
import type { Order } from '@/types/models';

type FieldSheet = null | 'discount' | 'ledger' | 'narration' | 'tally';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: [...qk.orders, 'detail', id], queryFn: () => orderService.get(id) });
  return (
    <>
      <Stack.Screen options={{ title: query.data ? `Order #${query.data.customeOrderId}` : 'Order' }} />
      <QueryBoundary query={query} notFound="Order not found">
        {(order) => <OrderDetail order={order} refetch={query.refetch} refreshing={query.isRefetching} />}
      </QueryBoundary>
    </>
  );
}

function OrderDetail({ order, refetch, refreshing }: { order: Order; refetch: () => void; refreshing: boolean }) {
  const totals = computeOrderTotals(order);
  const statusOptions = useStatusTypeOptions();
  const vehicleOptions = useVehicleOptions();
  const driverOptions = useDriverOptions();
  const drivers = useDrivers();
  const driverName = drivers.data?.find((d) => d.id === order.driverId)?.name;
  const [sheet, setSheet] = useState<FieldSheet>(null);
  const [lineEdit, setLineEdit] = useState<LineTotals | null>(null);
  const schemes = useQuery({
    queryKey: [...qk.orders, 'schemes', order.id],
    queryFn: () => orderService.schemes(order.id),
  });

  const invalidate = [[...qk.orders], [...qk.dashboard]];
  const action = useApiMutation(
    async ({ fn, msg }: { fn: () => Promise<unknown>; msg: string }) => {
      await fn();
      return msg;
    },
    { invalidate, successMessage: (msg) => msg, onSuccess: () => setSheet(null) }
  );
  const run = (fn: () => Promise<unknown>, msg: string) => action.mutate({ fn, msg });

  const remove = useApiMutation(() => orderService.remove(order.id), {
    invalidate,
    successMessage: 'Order deleted',
    onSuccess: () => router.back(),
  });

  const verified = !!order.isVerifiedByAdmin;
  const isCompleted = ['COMPLETE', 'COMPLETED'].includes(order.OrderStatusType?.name ?? '');
  const customer = order.Customer;
  const detail = customer?.CustomerDetail?.[0];

  return (
    <Screen refreshing={refreshing} onRefresh={refetch}>
      <Card>
        <ThemedText type="subtitle">{customerName(customer)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {[detail?.dbCategory, detail?.area, customer?.phone].filter(Boolean).join(' · ')}
        </ThemedText>
        <Row style={{ flexWrap: 'wrap' }}>
          <Badge label={orderStatusLabel(order.OrderStatusType)} tone={orderStatusTone(order.OrderStatusType?.name)} />
          {verified ? <Badge label="Stock verified" tone="success" /> : <Badge label="Draft (not verified)" tone="warning" />}
          {order.tallyInvoiceId ? <Badge label={order.tallyInvoiceId} tone="info" /> : null}
        </Row>
        <Divider />
        <KeyValue label="Order date" value={formatDate(order.orderDate)} />
        <KeyValue label="Delivery date" value={formatDate(order.deliveryDate)} />
        <KeyValue label="Vehicle" value={order.Vehicle?.vehicleNumber ?? '—'} />
        <KeyValue label="Driver" value={driverName ?? (order.driverId ? 'Assigned' : '—')} />
        {order.DeliveryAddress ? <KeyValue label="Deliver to" value={order.DeliveryAddress.address} /> : null}
        {order.verifiedAt ? <KeyValue label="Verified at" value={formatDateTime(order.verifiedAt)} /> : null}
        {order.narration ? <KeyValue label="Narration" value={order.narration} /> : null}
      </Card>

      <Section title="Totals">
        <Card>
          <KeyValue label="Cartons" value={formatNumber(totals.cartons)} />
          <KeyValue label="Basic" value={formatCurrency(totals.basic, true)} />
          <KeyValue label="Scheme discount" value={`− ${formatCurrency(totals.scheme, true)}`} />
          <KeyValue label="Item discount" value={`− ${formatCurrency(totals.itemDiscount, true)}`} />
          <KeyValue label="Taxable" value={formatCurrency(totals.taxable, true)} />
          <KeyValue label="GST" value={formatCurrency(totals.gst, true)} />
          {totals.cashDiscount ? (
            <KeyValue
              label={`Cash discount (${formatPercent(order.cashDiscountPercent ?? 0)})`}
              value={`− ${formatCurrency(totals.cashDiscount, true)}`}
            />
          ) : null}
          <Divider />
          <KeyValue label="Invoice value" value={formatCurrency(totals.invoiceValue, true)} emphasize />
          {order.ledgerBalance ? (
            <>
              <KeyValue label="Ledger balance" value={formatCurrency(order.ledgerBalance, true)} />
              <KeyValue label="Net chargeable" value={formatCurrency(totals.netChargeable, true)} emphasize />
            </>
          ) : null}
        </Card>
      </Section>

      <Section title={`Items (${totals.lines.length})`}>
        <View style={{ gap: Spacing.two }}>
          {totals.lines.map((line) => {
            const suggested = schemes.data?.find((s) => s.orderItemId === line.item.id)?.scheme?.effectivePercentage;
            return (
              <Card key={line.item.id} onPress={isCompleted ? undefined : () => setLineEdit(line)}>
                <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="heading">{line.item.Product?.name ?? line.item.productId}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {line.item.Product?.productCode} · {line.item.quantity} CB × {formatCurrency(line.cartonRate, true)}
                    </ThemedText>
                  </View>
                  <ThemedText type="heading">{formatCurrency(line.total, true)}</ThemedText>
                </Row>
                <Row style={{ flexWrap: 'wrap' }}>
                  {line.item.schemeDiscountPercent ? (
                    <Badge label={`Scheme ${formatPercent(line.item.schemeDiscountPercent)}`} tone="success" />
                  ) : null}
                  {line.item.itemDiscountPercent ? (
                    <Badge label={`Disc ${formatPercent(line.item.itemDiscountPercent)}`} tone="primary" />
                  ) : null}
                  {line.item.isFestivePrice ? <Badge label="Festive price" tone="warning" /> : null}
                  <Badge label={`GST ${formatPercent(line.gstPercent, 0)}`} />
                  {suggested && suggested !== (line.item.schemeDiscountPercent ?? 0) ? (
                    <Badge label={`Scheme available ${formatPercent(suggested)}`} tone="info" />
                  ) : null}
                </Row>
              </Card>
            );
          })}
        </View>
      </Section>

      {!isCompleted ? (
        <Section title="Actions">
          <Card>
            <SelectField
              label="Status"
              value={order.orderStatusTypeId ?? null}
              options={statusOptions}
              onChange={(v) => v && run(() => orderService.setStatus(order.id, v), 'Status updated')}
            />
            <SelectField
              label="Vehicle"
              value={order.vehicleId}
              options={vehicleOptions}
              allowClear
              onChange={(v) => run(() => orderService.setVehicle(order.id, v), 'Vehicle updated')}
            />
            <SelectField
              label="Driver"
              value={order.driverId}
              options={driverOptions}
              allowClear
              onChange={(v) => run(() => orderService.setDriver(order.id, v), 'Driver updated')}
            />
            <DateField
              label="Delivery date"
              value={order.deliveryDate ? new Date(order.deliveryDate) : null}
              allowClear
              onChange={(d) =>
                run(() => orderService.setDeliveryDate(order.id, d ? d.toISOString() : null), 'Delivery date updated')
              }
            />
            <View style={{ gap: Spacing.one }}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Cash discount
              </ThemedText>
              <SegmentedControl
                options={[
                  { value: '0', label: 'None' },
                  { value: '0.5', label: '0.5%' },
                  { value: '1', label: '1%' },
                ]}
                value={String(order.cashDiscountPercent ?? 0)}
                onChange={(v) => run(() => orderService.setCashDiscount(order.id, Number(v)), 'Cash discount updated')}
              />
            </View>
          </Card>
          <View style={{ gap: Spacing.two }}>
            <ListRow
              title="Order discount"
              subtitle={order.discountPercent ? formatPercent(order.discountPercent) : 'Not set'}
              icon="price_change"
              onPress={() => setSheet('discount')}
            />
            <ListRow
              title="Ledger balance"
              subtitle={order.ledgerBalance != null ? formatCurrency(order.ledgerBalance, true) : 'Not set'}
              icon="payments"
              onPress={() => setSheet('ledger')}
            />
            <ListRow title="Narration" subtitle={order.narration || 'Not set'} icon="description" onPress={() => setSheet('narration')} />
            <ListRow
              title="Tally invoice ID"
              subtitle={order.tallyInvoiceId || 'Not set'}
              icon="receipt"
              onPress={() => setSheet('tally')}
            />
            <ListRow
              title="Modify order"
              subtitle={verified ? 'Change quantities (within 4 days of verification)' : 'Edit draft items and details'}
              icon="edit"
              onPress={() => router.push({ pathname: '/orders/[id]/edit', params: { id: order.id } })}
            />
          </View>
          {!verified ? (
            <Button
              title="Verify stock and reserve"
              icon="fact_check"
              variant="success"
              loading={action.isPending}
              onPress={async () => {
                const ok = await confirmAction({
                  title: 'Verify stock?',
                  message: 'Stock will be deducted (FIFO) and a tally invoice ID allocated if missing.',
                  confirmLabel: 'Verify',
                });
                if (ok) run(() => orderService.verifyStock(order.id), 'Order verified and stock reserved');
              }}
            />
          ) : null}
          <Button
            title="Delete order"
            icon="delete"
            variant="danger"
            loading={remove.isPending}
            onPress={async () => {
              const ok = await confirmAction({
                title: `Delete order #${order.customeOrderId}?`,
                message: `${customerName(customer)} · ${formatCurrency(totals.invoiceValue)}. This cannot be undone.`,
                confirmLabel: 'Delete',
                destructive: true,
              });
              if (ok) remove.mutate();
            }}
          />
        </Section>
      ) : null}

      <EditSheet
        visible={sheet === 'discount'}
        onClose={() => setSheet(null)}
        title="Order discount"
        label="Discount %"
        kind="number"
        hint="0–100. Applies to this order only."
        initial={order.discountPercent}
        saving={action.isPending}
        onSave={(v) => run(() => orderService.setDiscount(order.id, Number(v ?? 0)), 'Discount updated')}
      />
      <EditSheet
        visible={sheet === 'ledger'}
        onClose={() => setSheet(null)}
        title="Ledger balance"
        label="Amount (₹)"
        kind="number"
        hint="Added to the invoice value. Use a negative number to subtract."
        initial={order.ledgerBalance}
        saving={action.isPending}
        onSave={(v) => run(() => orderService.setLedgerBalance(order.id, v as number | null), 'Ledger balance updated')}
      />
      <EditSheet
        visible={sheet === 'narration'}
        onClose={() => setSheet(null)}
        title="Narration"
        label="Admin note"
        kind="multiline"
        initial={order.narration}
        saving={action.isPending}
        onSave={(v) => run(() => orderService.setNarration(order.id, v as string | null), 'Narration updated')}
      />
      <EditSheet
        visible={sheet === 'tally'}
        onClose={() => setSheet(null)}
        title="Tally invoice ID"
        label="Invoice ID"
        hint="For example SGT/26-27/1"
        initial={order.tallyInvoiceId}
        saving={action.isPending}
        onSave={(v) => run(() => orderService.setTallyInvoice(order.id, v as string | null), 'Tally invoice updated')}
      />
      <LineSheet
        order={order}
        line={lineEdit}
        suggested={schemes.data?.find((s) => s.orderItemId === lineEdit?.item.id)?.scheme?.effectivePercentage}
        onClose={() => setLineEdit(null)}
      />
    </Screen>
  );
}

function LineSheet({
  order,
  line,
  suggested,
  onClose,
}: {
  order: Order;
  line: LineTotals | null;
  suggested?: number;
  onClose: () => void;
}) {
  const [scheme, setScheme] = useState('');
  const [discount, setDiscount] = useState('');
  const [festive, setFestive] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);
  if (line && line.item.id !== lastId) {
    setLastId(line.item.id);
    setScheme(String(line.item.schemeDiscountPercent ?? ''));
    setDiscount(String(line.item.itemDiscountPercent ?? ''));
    setFestive(!!line.item.isFestivePrice);
  }

  const save = useApiMutation(
    async () => {
      if (!line) return;
      const itemId = line.item.id;
      const s = toNumberOrNull(scheme) ?? 0;
      const d = toNumberOrNull(discount) ?? 0;
      if (s !== (line.item.schemeDiscountPercent ?? 0)) await orderService.setItemSchemeDiscount(order.id, itemId, s);
      if (d !== (line.item.itemDiscountPercent ?? 0)) await orderService.setItemDiscount(order.id, itemId, d);
      if (festive !== !!line.item.isFestivePrice) await orderService.setItemFestivePrice(order.id, itemId, festive);
    },
    {
      invalidate: [[...qk.orders]],
      successMessage: 'Line updated',
      onSuccess: () => {
        setLastId(null);
        onClose();
      },
    }
  );

  return (
    <Sheet
      visible={!!line}
      onClose={() => {
        setLastId(null);
        onClose();
      }}
      title={line?.item.Product?.name ?? 'Line item'}
      footer={<Button title="Save line" onPress={() => save.mutate()} loading={save.isPending} />}>
      {line ? (
        <>
          <KeyValue label="Quantity" value={`${line.item.quantity} CB`} />
          <KeyValue label="Carton rate" value={formatCurrency(line.cartonRate, true)} />
          <Input
            label="Scheme discount %"
            value={scheme}
            onChangeText={setScheme}
            keyboardType="decimal-pad"
            hint={suggested ? `Active scheme slab suggests ${formatPercent(suggested)}` : undefined}
          />
          {suggested ? (
            <Button title={`Use ${formatPercent(suggested)}`} variant="ghost" size="sm" onPress={() => setScheme(String(suggested))} />
          ) : null}
          <Input label="Item discount %" value={discount} onChangeText={setDiscount} keyboardType="decimal-pad" />
          <SwitchRow label="Festive price" value={festive} onChange={setFestive} />
        </>
      ) : null}
    </Sheet>
  );
}
