import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ProductPicker, type PickedProduct } from '@/components/product-picker';
import { QuantityLines, type QtyLine } from '@/components/quantity-lines';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, confirmAction, DateField, Input, KeyValue, Screen, Section, SelectField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import {
  qk,
  useCustomerOptions,
  useCustomers,
  useDriverOptions,
  useStatusTypeOptions,
  useVehicleOptions,
} from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency } from '@/lib/format';
import { catalogCartonRate } from '@/lib/order-totals';
import { deliveryAddressService } from '@/services/masters';
import { orderService, PENDING_STATUS_TYPE_ID, type OrderLineInput } from '@/services/orders';
import type { Order } from '@/types/models';

type Props = { order?: Order };

export function OrderForm({ order }: Props) {
  const editing = !!order;
  const verified = !!order?.isVerifiedByAdmin;
  const customers = useCustomers();
  const customerOptions = useCustomerOptions();
  const vehicleOptions = useVehicleOptions();
  const driverOptions = useDriverOptions();
  const statusOptions = useStatusTypeOptions();

  const [customerId, setCustomerId] = useState<string | null>(order?.customerId ?? null);
  const [addressId, setAddressId] = useState<string | null>(order?.deliveryAddressId ?? null);
  const [vehicleId, setVehicleId] = useState<string | null>(order?.vehicleId ?? null);
  const [driverId, setDriverId] = useState<string | null>(order?.driverId ?? null);
  const [statusId, setStatusId] = useState<string | null>(order?.orderStatusTypeId ?? PENDING_STATUS_TYPE_ID);
  const [orderDate, setOrderDate] = useState<Date | null>(order ? new Date(order.orderDate) : new Date());
  const [tallyInvoiceId, setTallyInvoiceId] = useState(order?.tallyInvoiceId ?? '');
  const [products, setProducts] = useState<Record<string, PickedProduct>>(() =>
    Object.fromEntries(
      (order?.OrderItem ?? []).map((i) => [
        i.productId,
        { id: i.productId, name: i.Product?.name ?? i.productId, productCode: i.Product?.productCode ?? '', ...i.Product },
      ])
    )
  );
  const [lines, setLines] = useState<QtyLine[]>(() =>
    (order?.OrderItem ?? []).map((i) => ({
      productId: i.productId,
      name: i.Product?.name ?? i.productId,
      code: i.Product?.productCode,
      quantity: i.quantity,
    }))
  );
  const [picker, setPicker] = useState(false);

  const addresses = useQuery({
    queryKey: ['delivery-addresses', customerId],
    queryFn: () => deliveryAddressService.list(customerId!),
    enabled: !!customerId,
  });
  const addressOptions = useMemo(
    () =>
      (addresses.data ?? []).map((a) => ({
        value: a.id,
        label: a.address,
        description: [a.area, a.default ? 'Default' : null].filter(Boolean).join(' · '),
      })),
    [addresses.data]
  );

  const dbCategory =
    customers.data?.find((c) => c.id === customerId)?.CustomerDetail?.[0]?.dbCategory ?? 'DISTRIBUTOR';
  const estimate = lines.reduce((sum, l) => {
    const { carton, gstPercent } = catalogCartonRate(products[l.productId], dbCategory);
    return sum + l.quantity * carton * (1 + gstPercent / 100);
  }, 0);

  const addProduct = (p: PickedProduct) => {
    setProducts((prev) => ({ ...prev, [p.id]: p }));
    setLines((prev) =>
      prev.some((l) => l.productId === p.id)
        ? prev
        : [...prev, { productId: p.id, name: p.name, code: p.productCode, quantity: 1 }]
    );
  };

  const save = useApiMutation(
    async (verify: boolean) => {
      if (!customerId) throw new Error('Select a distributor');
      if (!lines.length) throw new Error('Add at least one product');
      const items: OrderLineInput[] = lines.map((l) => ({ productId: l.productId, quantity: l.quantity }));
      const meta = {
        vehicleId: vehicleId ?? undefined,
        driverId: driverId ?? undefined,
        deliveryAddressId: addressId ?? undefined,
        orderDate: orderDate?.toISOString(),
        orderStatusTypeId: statusId ?? undefined,
        tallyInvoiceId: tallyInvoiceId.trim() || null,
      };
      if (!order) {
        return orderService.create({ customerId, orderItems: items, isVerifiedByAdmin: verify, ...meta });
      }
      if (!verified) {
        return orderService.updateUnverified(order.id, {
          customerId,
          orderItems: items,
          ...meta,
          vehicleId,
          driverId,
          deliveryAddressId: addressId,
        });
      }
      const removed = order.OrderItem.filter((i) => !lines.some((l) => l.productId === i.productId)).map((i) => ({
        productId: i.productId,
        quantity: 0,
      }));
      const changed = items.filter((l) => {
        const orig = order.OrderItem.find((i) => i.productId === l.productId);
        return !orig || orig.quantity !== l.quantity;
      });
      return orderService.update(order.id, {
        ...meta,
        driverId,
        orderItems: [...changed, ...removed],
      });
    },
    {
      invalidate: [[...qk.orders], [...qk.dashboard], [...qk.products]],
      successMessage: editing ? 'Order updated' : 'Order created',
      onSuccess: (saved) => {
        if (!editing && saved) router.replace({ pathname: '/orders/[id]', params: { id: saved.id } });
        else router.back();
      },
    }
  );

  return (
    <Screen
      footer={
        editing ? (
          <Button title="Save changes" icon="check" onPress={() => save.mutate(false)} loading={save.isPending} />
        ) : (
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <Button
              title="Save draft"
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => save.mutate(false)}
              disabled={save.isPending}
            />
            <Button
              title="Create & verify"
              variant="success"
              style={{ flex: 1 }}
              loading={save.isPending}
              onPress={async () => {
                const ok = await confirmAction({
                  title: 'Create and verify?',
                  message: 'Stock will be deducted immediately.',
                  confirmLabel: 'Create',
                });
                if (ok) save.mutate(true);
              }}
            />
          </View>
        )
      }>
      {verified ? (
        <Card style={{ borderWidth: 0 }}>
          <ThemedText type="small" themeColor="textSecondary">
            This order is verified. Only quantity changes and metadata can be edited, and only within 10 days of
            verification. Removing a line returns its stock.
          </ThemedText>
        </Card>
      ) : null}
      <Section title="Distributor">
        <Card>
          <SelectField
            label="Distributor"
            value={customerId}
            options={customerOptions}
            searchable
            disabled={verified}
            onChange={(v) => {
              setCustomerId(v);
              setAddressId(null);
            }}
          />
          <SelectField
            label="Delivery address"
            value={addressId}
            options={addressOptions}
            allowClear
            disabled={!customerId}
            placeholder={addresses.isLoading ? 'Loading…' : 'Default address'}
            onChange={setAddressId}
          />
          <DateField label="Order date" value={orderDate} onChange={setOrderDate} />
        </Card>
      </Section>

      <Section title={`Products (${lines.length})`}>
        <QuantityLines lines={lines} onChange={setLines} onAdd={() => setPicker(true)} />
        {lines.length ? (
          <Card>
            <KeyValue label="Cartons" value={String(lines.reduce((s, l) => s + l.quantity, 0))} />
            <KeyValue label="Estimated value (incl. GST)" value={formatCurrency(estimate)} emphasize />
            <ThemedText type="caption" themeColor="textSecondary">
              Excludes schemes and discounts. Final totals are shown after saving.
            </ThemedText>
          </Card>
        ) : null}
      </Section>

      <Section title="Dispatch">
        <Card>
          <SelectField label="Vehicle" value={vehicleId} options={vehicleOptions} allowClear onChange={setVehicleId} />
          <SelectField label="Driver" value={driverId} options={driverOptions} allowClear onChange={setDriverId} />
          <SelectField label="Status" value={statusId} options={statusOptions} onChange={setStatusId} />
          <Input
            label="Tally invoice ID"
            value={tallyInvoiceId}
            onChangeText={setTallyInvoiceId}
            placeholder="Auto-assigned on verification"
            autoCapitalize="characters"
          />
        </Card>
      </Section>

      <ProductPicker
        visible={picker}
        onClose={() => setPicker(false)}
        onPick={addProduct}
        selectedIds={lines.map((l) => l.productId)}
      />
    </Screen>
  );
}
