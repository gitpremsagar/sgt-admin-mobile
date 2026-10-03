import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ProductPicker } from '@/components/product-picker';
import { QuantityLines, type QtyLine } from '@/components/quantity-lines';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, DateField, Input, Row, Screen, Section, SelectField } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { qk, useTransporters } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { humanize, toNumberOrNull } from '@/lib/format';
import { purchaseService, TRANSPORT_STATUSES, type PurchaseBody } from '@/services/purchases';
import type { Purchase, PurchaseTransportStatus } from '@/types/models';

type InvoiceDraft = { key: string; invoiceID: string; invoiceDate: Date | null; amount: string; lines: QtyLine[] };

let keySeq = 0;
const newInvoice = (): InvoiceDraft => ({ key: `inv-${keySeq++}`, invoiceID: '', invoiceDate: new Date(), amount: '', lines: [] });

export function PurchaseForm({ purchase }: { purchase?: Purchase }) {
  const transporters = useTransporters();
  const [transporterId, setTransporterId] = useState<string | null>(purchase?.transporterId ?? null);
  const [vehicleNumber, setVehicleNumber] = useState(purchase?.vehicleNumber ?? '');
  const [driverContact, setDriverContact] = useState(purchase?.driverContact ?? '');
  const [status, setStatus] = useState<PurchaseTransportStatus>(purchase?.purchaseTransportStatus ?? 'PENDING');
  const [invoices, setInvoices] = useState<InvoiceDraft[]>(() =>
    purchase?.PurchaseInvoice.length
      ? purchase.PurchaseInvoice.map((inv) => ({
          key: inv.id,
          invoiceID: inv.invoiceID ?? '',
          invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate) : null,
          amount: inv.invoiceAmount != null ? String(inv.invoiceAmount) : '',
          lines: inv.PurchaseInvoiceItem.map((i) => ({
            productId: i.productId,
            name: i.product.name,
            code: i.product.productCode,
            quantity: i.quantity,
          })),
        }))
      : [newInvoice()]
  );
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const updateInvoice = (key: string, patch: Partial<InvoiceDraft>) =>
    setInvoices((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const save = useApiMutation(
    async () => {
      if (!transporterId) throw new Error('Select a transporter');
      invoices.forEach((inv, idx) => {
        if (!inv.invoiceID.trim()) throw new Error(`Invoice ${idx + 1} needs an invoice ID`);
        if (!inv.lines.length) throw new Error(`Invoice ${idx + 1} needs at least one product`);
      });
      const body: PurchaseBody = {
        transporterId,
        vehicleNumber: vehicleNumber.trim().toUpperCase() || null,
        driverContact: driverContact.trim() || null,
        purchaseTransportStatus: status,
        invoices: invoices.map((inv) => ({
          invoiceID: inv.invoiceID.trim(),
          invoiceDate: inv.invoiceDate?.toISOString() ?? null,
          invoiceAmount: toNumberOrNull(inv.amount),
          items: inv.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        })),
      };
      return purchase ? purchaseService.update(purchase.id, body) : purchaseService.create(body);
    },
    {
      invalidate: [[...qk.purchases]],
      successMessage: purchase ? 'Purchase updated' : 'Purchase created',
      onSuccess: (saved) => {
        if (!purchase && saved) router.replace({ pathname: '/purchases/[id]', params: { id: saved.id } });
        else router.back();
      },
    }
  );

  const activeInvoice = invoices.find((i) => i.key === pickerFor);

  return (
    <Screen footer={<Button title={purchase ? 'Save purchase' : 'Create purchase'} icon="check" onPress={() => save.mutate()} loading={save.isPending} />}>
      <Section title="Vehicle">
        <Card>
          <SelectField
            label="Transporter"
            value={transporterId}
            options={(transporters.data ?? []).map((t) => ({ value: t.id, label: t.name, description: t.area ?? undefined }))}
            onChange={setTransporterId}
            searchable
          />
          <Row>
            <Input
              label="Vehicle number"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Driver contact"
              value={driverContact}
              onChangeText={setDriverContact}
              keyboardType="phone-pad"
              containerStyle={{ flex: 1 }}
            />
          </Row>
          <SelectField
            label="Status"
            value={status}
            options={TRANSPORT_STATUSES.filter((s) => s !== 'COMPLETED').map((s) => ({ value: s, label: humanize(s) }))}
            onChange={(v) => v && setStatus(v as PurchaseTransportStatus)}
          />
        </Card>
      </Section>
      {invoices.map((inv, idx) => (
        <Section
          key={inv.key}
          title={`Invoice ${idx + 1}`}
          action={
            invoices.length > 1 ? (
              <Button
                title="Remove"
                variant="ghost"
                size="sm"
                onPress={() => setInvoices((prev) => prev.filter((i) => i.key !== inv.key))}
              />
            ) : undefined
          }>
          <Card>
            <Input
              label="Invoice ID"
              value={inv.invoiceID}
              onChangeText={(t) => updateInvoice(inv.key, { invoiceID: t })}
              autoCapitalize="characters"
            />
            <Row>
              <View style={{ flex: 1 }}>
                <DateField label="Invoice date" value={inv.invoiceDate} onChange={(d) => updateInvoice(inv.key, { invoiceDate: d })} allowClear />
              </View>
              <Input
                label="Amount (₹)"
                value={inv.amount}
                onChangeText={(t) => updateInvoice(inv.key, { amount: t })}
                keyboardType="decimal-pad"
                containerStyle={{ flex: 1 }}
              />
            </Row>
          </Card>
          <QuantityLines
            lines={inv.lines}
            onChange={(lines) => updateInvoice(inv.key, { lines })}
            onAdd={() => setPickerFor(inv.key)}
          />
        </Section>
      ))}
      <Button title="Add another invoice" icon="add" variant="secondary" onPress={() => setInvoices((prev) => [...prev, newInvoice()])} />
      <ThemedText type="caption" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>
        Stock is only added when you run “Add to stock” on the purchase.
      </ThemedText>
      <ProductPicker
        visible={!!pickerFor}
        onClose={() => setPickerFor(null)}
        showStock={false}
        selectedIds={activeInvoice?.lines.map((l) => l.productId)}
        onPick={(p) => {
          if (!activeInvoice || activeInvoice.lines.some((l) => l.productId === p.id)) return;
          updateInvoice(activeInvoice.key, {
            lines: [...activeInvoice.lines, { productId: p.id, name: p.name, code: p.productCode, quantity: 1 }],
          });
        }}
      />
    </Screen>
  );
}
