import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, DateField, Input, Row, Sheet, SwitchRow } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { qk } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { toNumberOrNull } from '@/lib/format';
import { productService, type SchemeBody } from '@/services/products';
import type { ProductScheme, StockBatch } from '@/types/models';

type BatchProps = { productId: string; batch: StockBatch | null; visible: boolean; onClose: () => void };

export function BatchSheet(props: BatchProps) {
  return (
    <Sheet visible={props.visible} onClose={props.onClose} title={props.batch ? 'Edit batch' : 'Add stock batch'}>
      {props.visible ? <BatchBody {...props} /> : null}
    </Sheet>
  );
}

function BatchBody({ productId, batch, onClose }: BatchProps) {
  const [mfg, setMfg] = useState<Date | null>(batch ? new Date(batch.manufacturingDate) : null);
  const [arrival, setArrival] = useState<Date | null>(batch ? new Date(batch.arrivalDate) : new Date());
  const [qty, setQty] = useState(batch ? String(batch.stockQuantity) : '');

  const save = useApiMutation(
    async () => {
      if (!mfg || !arrival) throw new Error('Manufacturing and arrival dates are required');
      const body = {
        productId,
        manufacturingDate: mfg.toISOString(),
        arrivalDate: arrival.toISOString(),
        stockQuantity: toNumberOrNull(qty) ?? 0,
      };
      if (batch) await productService.updateBatch(batch.id, body);
      else await productService.createBatch(body);
    },
    { invalidate: [[...qk.products]], successMessage: batch ? 'Batch updated' : 'Batch added', onSuccess: onClose }
  );

  return (
    <View style={{ gap: Spacing.three }}>
      <DateField label="Manufacturing date" value={mfg} onChange={setMfg} maximumDate={new Date()} />
      <DateField label="Arrival date" value={arrival} onChange={setArrival} />
      <Input label="Quantity (CB)" value={qty} onChangeText={setQty} keyboardType="number-pad" />
      <ThemedText type="caption" themeColor="textSecondary">
        Expiry is calculated by the server from the product shelf life.
      </ThemedText>
      <Button title="Save" onPress={() => save.mutate()} loading={save.isPending} />
    </View>
  );
}

type Slab = { min: string; max: string; pct: string };
const emptySlab: Slab = { min: '', max: '', pct: '' };

type SchemeProps = { productId: string; scheme: ProductScheme | null; visible: boolean; onClose: () => void };

export function SchemeSheet(props: SchemeProps) {
  return (
    <Sheet visible={props.visible} onClose={props.onClose} title={props.scheme ? 'Edit scheme' : 'New scheme'}>
      {props.visible ? <SchemeBodyForm {...props} /> : null}
    </Sheet>
  );
}

function initialSlabs(scheme: ProductScheme | null): Slab[] {
  if (!scheme) return [emptySlab];
  const list = ([1, 2, 3, 4] as const)
    .map((n): Slab | null => {
      const min = scheme[`slab${n}MinCb`];
      const pct = scheme[`slab${n}Percent`];
      if (min == null && pct == null) return null;
      return { min: String(min ?? ''), max: String(scheme[`slab${n}MaxCb`] ?? ''), pct: String(pct ?? '') };
    })
    .filter((x): x is Slab => !!x);
  return list.length ? list : [emptySlab];
}

function SchemeBodyForm({ productId, scheme, onClose }: SchemeProps) {
  const [slabs, setSlabs] = useState<Slab[]>(() => initialSlabs(scheme));
  const [start, setStart] = useState<Date | null>(scheme ? new Date(scheme.startDate) : new Date());
  const [end, setEnd] = useState<Date | null>(scheme ? new Date(scheme.endDate) : null);
  const [active, setActive] = useState(scheme?.isActive ?? true);

  const save = useApiMutation(
    async () => {
      if (!start || !end) throw new Error('Start and end dates are required');
      const slabFields: Record<string, number | null> = {};
      ([1, 2, 3, 4] as const).forEach((n, i) => {
        const slab = slabs[i];
        slabFields[`slab${n}MinCb`] = slab ? toNumberOrNull(slab.min) : null;
        slabFields[`slab${n}MaxCb`] = slab ? toNumberOrNull(slab.max) : null;
        slabFields[`slab${n}Percent`] = slab ? toNumberOrNull(slab.pct) : null;
      });
      if (slabFields.slab1MinCb == null || slabFields.slab1MaxCb == null || slabFields.slab1Percent == null) {
        throw new Error('Slab 1 needs min, max and percentage');
      }
      const body = {
        ...slabFields,
        productId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        isActive: active,
      } as SchemeBody;
      if (scheme) await productService.updateScheme(scheme.id, body);
      else await productService.createScheme(body);
    },
    { invalidate: [[...qk.products]], successMessage: scheme ? 'Scheme updated' : 'Scheme created', onSuccess: onClose }
  );

  const setSlab = (i: number, patch: Partial<Slab>) =>
    setSlabs((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <View style={{ gap: Spacing.three }}>
      {slabs.map((slab, i) => (
        <Row key={i} style={{ alignItems: 'flex-end' }}>
          <Input
            label={`Slab ${i + 1} min CB`}
            value={slab.min}
            onChangeText={(t) => setSlab(i, { min: t })}
            keyboardType="number-pad"
            containerStyle={{ flex: 1 }}
          />
          <Input
            label="Max CB"
            value={slab.max}
            onChangeText={(t) => setSlab(i, { max: t })}
            keyboardType="number-pad"
            containerStyle={{ flex: 1 }}
          />
          <Input
            label="%"
            value={slab.pct}
            onChangeText={(t) => setSlab(i, { pct: t })}
            keyboardType="decimal-pad"
            containerStyle={{ flex: 1 }}
          />
        </Row>
      ))}
      <Row>
        {slabs.length < 4 ? (
          <Button title="Add slab" icon="add" variant="ghost" size="sm" onPress={() => setSlabs([...slabs, emptySlab])} />
        ) : null}
        {slabs.length > 1 ? (
          <Button title="Remove last" variant="ghost" size="sm" onPress={() => setSlabs(slabs.slice(0, -1))} />
        ) : null}
      </Row>
      <DateField label="Start date" value={start} onChange={setStart} />
      <DateField label="End date" value={end} onChange={setEnd} minimumDate={start ?? undefined} />
      <SwitchRow label="Active" value={active} onChange={setActive} />
      <Button title="Save scheme" onPress={() => save.mutate()} loading={save.isPending} />
    </View>
  );
}
