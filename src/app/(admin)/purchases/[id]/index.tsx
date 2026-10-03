import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { EditSheet } from '@/components/edit-sheet';
import { purchaseCartons } from '@/components/purchase-card';
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
  KeyValue,
  ListRow,
  Row,
  Screen,
  Section,
  SelectField,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { qk } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatDate, formatDateTime, formatNumber, humanize } from '@/lib/format';
import { purchaseStatusTone } from '@/lib/status';
import { purchaseService, TRANSPORT_STATUSES, type ManualDatetimePatch } from '@/services/purchases';
import type { Purchase, PurchaseTransportStatus } from '@/types/models';

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: [...qk.purchases, 'detail', id], queryFn: () => purchaseService.get(id) });
  const locked = !!query.data?.stockAddedAt;
  return (
    <>
      <Stack.Screen
        options={{
          title: query.data?.vehicleNumber || 'Purchase',
          headerRight: () =>
            query.data && !locked ? (
              <IconButton
                icon="edit"
                accessibilityLabel="Edit purchase"
                onPress={() => router.push({ pathname: '/purchases/[id]/edit', params: { id } })}
              />
            ) : null,
        }}
      />
      <QueryBoundary query={query} notFound="Purchase not found">
        {(p) => <PurchaseDetail purchase={p} refetch={query.refetch} refreshing={query.isRefetching} />}
      </QueryBoundary>
    </>
  );
}

const DATETIME_FIELDS: { key: keyof ManualDatetimePatch; label: string; nullable: boolean }[] = [
  { key: 'purchaseDate', label: 'Purchase date', nullable: false },
  { key: 'markedArrivedAt', label: 'Arrived at', nullable: true },
  { key: 'TargetUnloadingDate', label: 'Target unloading', nullable: true },
  { key: 'markedUnloadedAt', label: 'Unloaded at', nullable: true },
  { key: 'VehicleExitedAt', label: 'Vehicle exited at', nullable: true },
];

function PurchaseDetail({ purchase, refetch, refreshing }: { purchase: Purchase; refetch: () => void; refreshing: boolean }) {
  const [grnOpen, setGrnOpen] = useState(false);
  const locked = !!purchase.stockAddedAt;
  const invalidate = [[...qk.purchases], [...qk.products]];

  const status = useApiMutation((s: PurchaseTransportStatus) => purchaseService.setStatus(purchase.id, s), {
    invalidate,
    successMessage: 'Status updated',
  });
  const datetimes = useApiMutation((body: ManualDatetimePatch) => purchaseService.setManualDatetimes(purchase.id, body), {
    invalidate,
    successMessage: 'Date updated',
  });
  const grn = useApiMutation((v: string | null) => purchaseService.setGrn(purchase.id, v), {
    invalidate,
    successMessage: 'GRN updated',
    onSuccess: () => setGrnOpen(false),
  });
  const addToStock = useApiMutation(() => purchaseService.addToStock(purchase.id), {
    invalidate,
    successMessage: 'Items added to stock',
  });
  const syncPricing = useApiMutation(() => purchaseService.syncPricing(purchase.id), {
    invalidate,
    successMessage: (r) => r.message || `Pricing synced (${r.updatedItemCount} items)`,
  });
  const remove = useApiMutation(() => purchaseService.remove(purchase.id), {
    invalidate,
    successMessage: 'Purchase deleted',
    onSuccess: () => router.back(),
  });

  const total = purchase.PurchaseInvoice.reduce((s, i) => s + (i.invoiceAmount ?? 0), 0);

  return (
    <Screen refreshing={refreshing} onRefresh={refetch}>
      <Card>
        <ThemedText type="subtitle">{purchase.Transporter?.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {[purchase.vehicleNumber, purchase.driverContact].filter(Boolean).join(' · ') || 'No vehicle details'}
        </ThemedText>
        <Row style={{ flexWrap: 'wrap' }}>
          <Badge label={humanize(purchase.purchaseTransportStatus)} tone={purchaseStatusTone(purchase.purchaseTransportStatus)} />
          {locked ? <Badge label="Stock added" tone="success" /> : <Badge label="Not in stock" tone="warning" />}
          {purchase.pricingComplete === false ? <Badge label="Pricing incomplete" tone="danger" /> : null}
        </Row>
        <Divider />
        <KeyValue label="Cartons" value={formatNumber(purchaseCartons(purchase))} />
        <KeyValue label="Invoice total" value={formatCurrency(total)} />
        <KeyValue label="GRN" value={purchase.grnNumber ?? '—'} />
        {purchase.stockAddedAt ? (
          <KeyValue
            label="Stock added"
            value={`${formatDateTime(purchase.stockAddedAt)}${purchase.StockAddedByUser ? ` by ${purchase.StockAddedByUser.name}` : ''}`}
          />
        ) : null}
      </Card>

      <Section title="Status">
        <Card>
          <SelectField
            label="Transport status"
            value={purchase.purchaseTransportStatus}
            options={TRANSPORT_STATUSES.map((s) => ({ value: s, label: humanize(s) }))}
            onChange={(v) => v && status.mutate(v as PurchaseTransportStatus)}
            disabled={status.isPending}
          />
          {DATETIME_FIELDS.map((f) => (
            <DateField
              key={f.key}
              label={f.label}
              mode="datetime"
              value={purchase[f.key] ? new Date(purchase[f.key] as string) : null}
              allowClear={f.nullable}
              onChange={(d) => {
                if (!d && !f.nullable) return;
                datetimes.mutate({ [f.key]: d ? d.toISOString() : null });
              }}
            />
          ))}
        </Card>
      </Section>

      <Section title="Actions">
        <View style={{ gap: Spacing.two }}>
          <ListRow title="GRN number" subtitle={purchase.grnNumber || 'Not set'} icon="assignment" onPress={() => setGrnOpen(true)} />
          <ListRow
            title="Sync pricing from products"
            subtitle="Copy current product prices onto invoice items"
            icon="price_change"
            onPress={() => syncPricing.mutate()}
          />
        </View>
        {!locked ? (
          <Button
            title="Add to stock"
            icon="inventory"
            variant="success"
            loading={addToStock.isPending}
            onPress={async () => {
              const ok = await confirmAction({
                title: 'Add to stock?',
                message:
                  'All invoice items will be added to live inventory. After this the purchase can no longer be edited or deleted.',
                confirmLabel: 'Add to stock',
              });
              if (ok) addToStock.mutate();
            }}
          />
        ) : null}
      </Section>

      {purchase.PurchaseInvoice.map((inv) => (
        <Section key={inv.id} title={`Invoice ${inv.invoiceID ?? ''}`}>
          <Card>
            <KeyValue label="Date" value={formatDate(inv.invoiceDate)} />
            <KeyValue label="Amount" value={inv.invoiceAmount != null ? formatCurrency(inv.invoiceAmount) : '—'} />
            <Divider />
            {inv.PurchaseInvoiceItem.map((item) => (
              <Row key={item.id} style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="default" numberOfLines={1}>
                    {item.product.name}
                  </ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {item.product.productCode}
                    {item.costPricePerCarton != null ? ` · ${formatCurrency(item.costPricePerCarton, true)}/CB` : ''}
                  </ThemedText>
                </View>
                <ThemedText type="heading">{item.quantity} CB</ThemedText>
              </Row>
            ))}
          </Card>
        </Section>
      ))}

      {!locked ? (
        <Button
          title="Delete purchase"
          icon="delete"
          variant="danger"
          loading={remove.isPending}
          onPress={async () => {
            const ok = await confirmAction({
              title: 'Delete purchase?',
              message: 'This cannot be undone.',
              confirmLabel: 'Delete',
              destructive: true,
            });
            if (ok) remove.mutate();
          }}
        />
      ) : null}

      <EditSheet
        visible={grnOpen}
        onClose={() => setGrnOpen(false)}
        title="GRN number"
        label="GRN"
        initial={purchase.grnNumber}
        saving={grn.isPending}
        onSave={(v) => grn.mutate(v as string | null)}
      />
    </Screen>
  );
}
