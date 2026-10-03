import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BatchSheet, SchemeSheet } from '@/components/product-sheets';
import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  Button,
  Card,
  confirmAction,
  Divider,
  EmptyState,
  IconButton,
  KeyValue,
  LoadingState,
  Row,
  Screen,
  Section,
  SegmentedControl,
  StatCard,
  SwitchRow,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { customerName, qk } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent } from '@/lib/format';
import { stockLevel } from '@/lib/status';
import { productService } from '@/services/products';
import type { Product, ProductScheme, StockBatch } from '@/types/models';

type Tab = 'overview' | 'batches' | 'schemes' | 'orders' | 'history';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: [...qk.products, 'detail', id], queryFn: () => productService.get(id) });
  return (
    <>
      <Stack.Screen
        options={{
          title: query.data?.productCode ?? 'Product',
          headerRight: () =>
            query.data ? (
              <IconButton
                icon="edit"
                accessibilityLabel="Edit product"
                onPress={() => router.push({ pathname: '/products/[id]/edit', params: { id } })}
              />
            ) : null,
        }}
      />
      <QueryBoundary query={query} notFound="Product not found">
        {(product) => <ProductDetail product={product} refetch={query.refetch} refreshing={query.isRefetching} />}
      </QueryBoundary>
    </>
  );
}

function ProductDetail({ product, refetch, refreshing }: { product: Product; refetch: () => void; refreshing: boolean }) {
  const [tab, setTab] = useState<Tab>('overview');
  const lvl = stockLevel(product);
  return (
    <Screen refreshing={refreshing} onRefresh={refetch}>
      <Card>
        <ThemedText type="subtitle">{product.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {[product.productCode, product.Category?.name, product.ProductGroup?.name].filter(Boolean).join(' · ')}
        </ThemedText>
        <Row style={{ flexWrap: 'wrap' }}>
          <Badge label={lvl.label} tone={lvl.tone} />
          {product.isDiscontinued ? <Badge label="Discontinued" tone="danger" /> : null}
          {product.ProductTagRelation?.map((t) => <Badge key={t.id} label={t.ProductTag.name} />)}
        </Row>
      </Card>
      <Row>
        <StatCard label="In stock" value={`${formatNumber(product.stockQuantity ?? 0)} CB`} icon="inventory_2" tone={lvl.tone} />
        <StatCard
          label="Limits"
          value={`${product.lowStockLimit} / ${product.overStockLimit}`}
          sub="low / over"
          icon="warning"
        />
      </Row>
      <SegmentedControl
        options={[
          { value: 'overview', label: 'Info' },
          { value: 'batches', label: 'Batches' },
          { value: 'schemes', label: 'Schemes' },
          { value: 'orders', label: 'Orders' },
          { value: 'history', label: 'Log' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as Tab)}
      />
      {tab === 'overview' ? <Overview product={product} /> : null}
      {tab === 'batches' ? <Batches product={product} /> : null}
      {tab === 'schemes' ? <Schemes product={product} /> : null}
      {tab === 'orders' ? <OrderHistory productId={product.id} /> : null}
      {tab === 'history' ? <ChangeHistory productId={product.id} /> : null}
    </Screen>
  );
}

function Overview({ product }: { product: Product }) {
  const discontinue = useApiMutation(
    (value: boolean) => productService.patch(product.id, { isDiscontinued: value }),
    { invalidate: [[...qk.products]], successMessage: 'Product updated' }
  );
  const remove = useApiMutation(() => productService.remove(product.id), {
    invalidate: [[...qk.products]],
    successMessage: 'Product deleted',
    onSuccess: () => router.back(),
  });
  const money = (v: number | null | undefined) => (v == null ? '—' : formatCurrency(v, true));

  return (
    <>
      <Section title="Pricing">
        <Card>
          <KeyValue label="MRP" value={formatCurrency(product.mrp, true)} emphasize />
          <KeyValue label="GST" value={product.gstPercentage != null ? formatPercent(product.gstPercentage, 0) : '—'} />
          <KeyValue label="Packets per carton" value={product.packetsPerCarton ?? '—'} />
          <Divider />
          <KeyValue label="Cost / carton (SS)" value={money(product.costPricePerCarton)} />
          <KeyValue label="DB / carton" value={money(product.sellingPricePerCartonForDb)} />
          <KeyValue label="DB margin" value={product.marginPercentageForDb != null ? formatPercent(product.marginPercentageForDb) : '—'} />
          <KeyValue label="RSS / carton" value={money(product.sellingPricePerCartonForRss)} />
          <KeyValue label="RSS margin" value={product.marginPercentageForRss != null ? formatPercent(product.marginPercentageForRss) : '—'} />
          {product.festivePricePerCarton ? <KeyValue label="Festive / carton" value={money(product.festivePricePerCarton)} /> : null}
        </Card>
      </Section>
      <Section title="Details">
        <Card>
          <KeyValue label="Sub-category" value={product.SubCategory?.name ?? '—'} />
          <KeyValue label="Plant" value={product.Plant?.name ?? '—'} />
          <KeyValue label="Grammage" value={product.grammage ? `${product.grammage} g` : '—'} />
          <KeyValue label="Shelf life" value={product.lifeOfProduct ? `${product.lifeOfProduct} days` : '—'} />
          <KeyValue label="Cartons per pallet" value={product.cartonsPerPallet ?? '—'} />
          <KeyValue label="Nearest expiry" value={formatDate(product.nearestExpiryDate)} />
          <KeyValue label="Last ordered" value={formatDate(product.lastOrderDate)} />
        </Card>
      </Section>
      <Card>
        <SwitchRow
          label="Discontinued"
          description="Hidden from order creation"
          value={!!product.isDiscontinued}
          disabled={discontinue.isPending}
          onChange={(v) => discontinue.mutate(v)}
        />
      </Card>
      <Button
        title="Delete product"
        icon="delete"
        variant="danger"
        loading={remove.isPending}
        onPress={async () => {
          const ok = await confirmAction({
            title: `Delete ${product.name}?`,
            message: 'Products with orders or stock cannot be deleted.',
            confirmLabel: 'Delete',
            destructive: true,
          });
          if (ok) remove.mutate();
        }}
      />
    </>
  );
}

function Batches({ product }: { product: Product }) {
  const theme = useTheme();
  const [editing, setEditing] = useState<StockBatch | null>(null);
  const [open, setOpen] = useState(false);
  const batches = useQuery({
    queryKey: [...qk.products, 'batches', product.id],
    queryFn: () => productService.batches(product.id),
  });
  const remove = useApiMutation((id: string) => productService.deleteBatch(id), {
    invalidate: [[...qk.products]],
    successMessage: 'Batch deleted',
  });

  return (
    <>
      <Button title="Add batch" icon="add" variant="secondary" onPress={() => { setEditing(null); setOpen(true); }} />
      {batches.isLoading ? <LoadingState /> : null}
      {batches.data?.length === 0 ? <EmptyState title="No stock batches" icon="inventory" /> : null}
      {batches.data?.map((b) => {
        const expired = new Date(b.expiryDate) < new Date();
        return (
          <Card key={b.id} onPress={() => { setEditing(b); setOpen(true); }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <ThemedText type="heading">{formatNumber(b.stockQuantity)} CB</ThemedText>
              <Row>
                {expired ? <Badge label="Expired" tone="danger" /> : <Badge label={`Exp ${formatDate(b.expiryDate)}`} />}
                <IconButton
                  icon="delete"
                  color={theme.danger}
                  accessibilityLabel="Delete batch"
                  onPress={async () => {
                    const ok = await confirmAction({ title: 'Delete batch?', confirmLabel: 'Delete', destructive: true });
                    if (ok) remove.mutate(b.id);
                  }}
                />
              </Row>
            </Row>
            <KeyValue label="Manufactured" value={formatDate(b.manufacturingDate)} />
            <KeyValue label="Arrived" value={formatDate(b.arrivalDate)} />
            {b.reservedQuantity ? <KeyValue label="Reserved" value={`${b.reservedQuantity} CB`} /> : null}
            {b.PurchaseInvoice?.invoiceID ? <KeyValue label="Invoice" value={b.PurchaseInvoice.invoiceID} /> : null}
          </Card>
        );
      })}
      <BatchSheet productId={product.id} batch={editing} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function slabText(s: ProductScheme) {
  return ([1, 2, 3, 4] as const)
    .map((n) => {
      const pct = s[`slab${n}Percent`];
      if (pct == null) return null;
      return `${s[`slab${n}MinCb`] ?? 0}–${s[`slab${n}MaxCb`] ?? '∞'} CB: ${formatPercent(pct)}`;
    })
    .filter(Boolean)
    .join('\n');
}

function Schemes({ product }: { product: Product }) {
  const theme = useTheme();
  const [editing, setEditing] = useState<ProductScheme | null>(null);
  const [open, setOpen] = useState(false);
  const schemes = useQuery({
    queryKey: [...qk.products, 'schemes', product.id],
    queryFn: () => productService.schemes(product.id),
  });
  const toggle = useApiMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) => productService.toggleScheme(id, isActive),
    { invalidate: [[...qk.products]], successMessage: 'Scheme updated' }
  );
  const remove = useApiMutation((id: string) => productService.deleteScheme(id), {
    invalidate: [[...qk.products]],
    successMessage: 'Scheme deleted',
  });

  return (
    <>
      <Button title="New scheme" icon="add" variant="secondary" onPress={() => { setEditing(null); setOpen(true); }} />
      {schemes.isLoading ? <LoadingState /> : null}
      {schemes.data?.length === 0 ? <EmptyState title="No schemes" icon="local_offer" /> : null}
      {schemes.data?.map((s) => (
        <Card key={s.id} onPress={() => { setEditing(s); setOpen(true); }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <ThemedText type="smallBold">
              {formatDate(s.startDate)} → {formatDate(s.endDate)}
            </ThemedText>
            <IconButton
              icon="delete"
              color={theme.danger}
              accessibilityLabel="Delete scheme"
              onPress={async () => {
                const ok = await confirmAction({ title: 'Delete scheme?', confirmLabel: 'Delete', destructive: true });
                if (ok) remove.mutate(s.id);
              }}
            />
          </Row>
          <ThemedText type="small">{slabText(s) || '—'}</ThemedText>
          <SwitchRow label="Active" value={s.isActive} onChange={(v) => toggle.mutate({ id: s.id, isActive: v })} />
        </Card>
      ))}
      <SchemeSheet productId={product.id} scheme={editing} visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function OrderHistory({ productId }: { productId: string }) {
  const history = useQuery({
    queryKey: [...qk.products, 'order-history', productId],
    queryFn: () => productService.orderHistory(productId),
  });
  if (history.isLoading) return <LoadingState />;
  if (!history.data?.length) return <EmptyState title="No orders yet" icon="receipt_long" />;
  return (
    <View style={{ gap: Spacing.two }}>
      {history.data.slice(0, 100).map((row) => (
        <Card
          key={row.id}
          onPress={() => router.push({ pathname: '/orders/[id]', params: { id: row.orderId } })}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <ThemedText type="heading" numberOfLines={1}>
                {customerName(row.Customer)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                #{row.Order?.customeOrderId} · {formatDate(row.orderDate)}
              </ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <ThemedText type="heading">{row.quantity} CB</ThemedText>
              <Badge label={row.orderCompleted ? 'Completed' : 'Open'} tone={row.orderCompleted ? 'success' : 'warning'} />
            </View>
          </Row>
        </Card>
      ))}
    </View>
  );
}

function ChangeHistory({ productId }: { productId: string }) {
  const history = useQuery({
    queryKey: [...qk.products, 'change-history', productId],
    queryFn: () => productService.changeHistory(productId),
  });
  if (history.isLoading) return <LoadingState />;
  if (!history.data?.history.length) return <EmptyState title="No changes recorded" icon="history" />;
  return (
    <View style={{ gap: Spacing.two }}>
      {history.data.history.map((h) => (
        <Card key={h.id}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Badge label={h.changeType === 'CREATE' ? 'Created' : 'Updated'} tone={h.changeType === 'CREATE' ? 'success' : 'info'} />
            <ThemedText type="caption" themeColor="textSecondary">
              {formatDateTime(h.changedAt)}
            </ThemedText>
          </Row>
          {h.mrp != null ? <KeyValue label="MRP" value={formatCurrency(h.mrp, true)} /> : null}
          {h.name ? <KeyValue label="Name" value={h.name} /> : null}
          {h.categoryName ? <KeyValue label="Category" value={h.categoryName} /> : null}
          {typeof h.sellingPricePerCartonForDb === 'number' ? (
            <KeyValue label="DB / carton" value={formatCurrency(h.sellingPricePerCartonForDb, true)} />
          ) : null}
        </Card>
      ))}
    </View>
  );
}
