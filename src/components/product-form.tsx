import { router } from 'expo-router';
import { useMemo, useState } from 'react';

import { Button, Card, Input, KeyValue, MultiChips, Row, Screen, Section, SelectField } from '@/components/ui';
import {
  qk,
  useCategories,
  usePlants,
  useProductGroups,
  useProductTags,
  useSubCategories,
} from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatCurrency, formatPercent, toNumberOrNull } from '@/lib/format';
import { derivePricing } from '@/lib/product-pricing';
import { productService, type ProductBody } from '@/services/products';
import type { Product } from '@/types/models';

const NUMERIC = [
  'mrp',
  'lowStockLimit',
  'overStockLimit',
  'grammage',
  'lifeOfProduct',
  'cartonsPerPallet',
  'packetsPerCarton',
  'gstPercentage',
  'schemePercentage',
  'costPricePerPacket',
  'sellingPricePerPacketForDb',
  'sellingPricePerPacketForRss',
  'festivePricePerPacket',
] as const;
type NumericKey = (typeof NUMERIC)[number];

const LABELS: Record<NumericKey, string> = {
  mrp: 'MRP (₹)',
  lowStockLimit: 'Low stock limit (CB)',
  overStockLimit: 'Over stock limit (CB)',
  grammage: 'Grammage (g)',
  lifeOfProduct: 'Shelf life (days)',
  cartonsPerPallet: 'Cartons per pallet',
  packetsPerCarton: 'Packets per carton',
  gstPercentage: 'GST %',
  schemePercentage: 'Default scheme %',
  costPricePerPacket: 'Cost / packet (SS)',
  sellingPricePerPacketForDb: 'DB price / packet',
  sellingPricePerPacketForRss: 'RSS price / packet',
  festivePricePerPacket: 'Festive price / packet',
};

export function ProductForm({ product }: { product?: Product }) {
  const categories = useCategories();
  const subCategories = useSubCategories();
  const groups = useProductGroups();
  const tags = useProductTags();
  const plants = usePlants();

  const [name, setName] = useState(product?.name ?? '');
  const [code, setCode] = useState(product?.productCode ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(product?.categoryId ?? null);
  const [subCategoryId, setSubCategoryId] = useState<string | null>(product?.subCategoryId ?? null);
  const [groupId, setGroupId] = useState<string | null>(product?.productGroupId ?? null);
  const [plantId, setPlantId] = useState<string | null>(product?.plantId ?? null);
  const [tagIds, setTagIds] = useState<string[]>(product?.ProductTagRelation?.map((t) => t.productTagId) ?? []);
  const [nums, setNums] = useState<Record<NumericKey, string>>(() =>
    Object.fromEntries(NUMERIC.map((k) => [k, product?.[k] != null ? String(product[k]) : ''])) as Record<
      NumericKey,
      string
    >
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const n = (k: NumericKey) => toNumberOrNull(nums[k]) ?? undefined;
  const derived = derivePricing({
    packetsPerCarton: n('packetsPerCarton'),
    gstPercentage: n('gstPercentage'),
    costPricePerPacket: n('costPricePerPacket'),
    sellingPricePerPacketForDb: n('sellingPricePerPacketForDb'),
    sellingPricePerPacketForRss: n('sellingPricePerPacketForRss'),
    festivePricePerPacket: n('festivePricePerPacket'),
  });

  const subOptions = useMemo(
    () =>
      (subCategories.data ?? [])
        .filter((s) => !categoryId || s.categoryId === categoryId)
        .map((s) => ({ value: s.id, label: s.name })),
    [subCategories.data, categoryId]
  );

  const save = useApiMutation(
    async () => {
      const e: Record<string, string> = {};
      if (!name.trim()) e.name = 'Required';
      if (!code.trim()) e.code = 'Required';
      if (!categoryId) e.categoryId = 'Required';
      if (!groupId) e.groupId = 'Required';
      (['mrp', 'lowStockLimit', 'overStockLimit'] as const).forEach((k) => {
        if (n(k) === undefined) e[k] = 'Required';
      });
      NUMERIC.forEach((k) => {
        if (nums[k].trim() && toNumberOrNull(nums[k]) === null) e[k] = 'Must be a number';
      });
      setErrors(e);
      if (Object.keys(e).length) throw new Error('Fix the highlighted fields');

      const numeric = Object.fromEntries(NUMERIC.map((k) => [k, n(k)]).filter(([, v]) => v !== undefined));
      const body = {
        ...numeric,
        ...Object.fromEntries(Object.entries(derived).filter(([, v]) => v !== undefined)),
        name: name.trim(),
        productCode: code.trim(),
        categoryId: categoryId!,
        subCategoryId: subCategoryId ?? null,
        productGroupId: groupId!,
        plantId: plantId ?? undefined,
        tagIds,
      } as ProductBody;
      return product ? productService.update(product.id, body) : productService.create(body);
    },
    {
      invalidate: [[...qk.products]],
      successMessage: product ? 'Product updated' : 'Product created',
      onSuccess: (saved) => {
        if (!product && saved) router.replace({ pathname: '/products/[id]', params: { id: saved.id } });
        else router.back();
      },
    }
  );

  const numInput = (k: NumericKey) => (
    <Input
      key={k}
      label={LABELS[k]}
      value={nums[k]}
      onChangeText={(t) => setNums((prev) => ({ ...prev, [k]: t }))}
      keyboardType="decimal-pad"
      error={errors[k]}
      containerStyle={{ flex: 1 }}
    />
  );

  return (
    <Screen footer={<Button title={product ? 'Save product' : 'Create product'} icon="check" onPress={() => save.mutate()} loading={save.isPending} />}>
      <Section title="Basics">
        <Card>
          <Input label="Name" value={name} onChangeText={setName} error={errors.name} />
          <Input label="Product code" value={code} onChangeText={setCode} autoCapitalize="characters" error={errors.code} />
          <Row>
            {numInput('mrp')}
            {numInput('grammage')}
          </Row>
          <SelectField
            label="Category"
            value={categoryId}
            options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
            onChange={(v) => {
              setCategoryId(v);
              setSubCategoryId(null);
            }}
            error={errors.categoryId}
          />
          <SelectField label="Sub-category" value={subCategoryId} options={subOptions} onChange={setSubCategoryId} allowClear />
          <SelectField
            label="Product group"
            value={groupId}
            options={(groups.data ?? []).map((g) => ({ value: g.id, label: g.name }))}
            onChange={setGroupId}
            searchable
            error={errors.groupId}
          />
          <SelectField
            label="Plant"
            value={plantId}
            options={(plants.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
            onChange={setPlantId}
            allowClear
          />
          <MultiChips
            label="Tags"
            options={(tags.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
            value={tagIds}
            onChange={setTagIds}
          />
        </Card>
      </Section>
      <Section title="Stock">
        <Card>
          <Row>
            {numInput('lowStockLimit')}
            {numInput('overStockLimit')}
          </Row>
          <Row>
            {numInput('lifeOfProduct')}
            {numInput('cartonsPerPallet')}
          </Row>
        </Card>
      </Section>
      <Section title="Pricing (per packet)">
        <Card>
          <Row>
            {numInput('packetsPerCarton')}
            {numInput('gstPercentage')}
          </Row>
          {numInput('costPricePerPacket')}
          <Row>
            {numInput('sellingPricePerPacketForDb')}
            {numInput('sellingPricePerPacketForRss')}
          </Row>
          <Row>
            {numInput('festivePricePerPacket')}
            {numInput('schemePercentage')}
          </Row>
        </Card>
      </Section>
      <Section title="Calculated">
        <Card>
          <KeyValue label="Cost / carton" value={derived.costPricePerCarton != null ? formatCurrency(derived.costPricePerCarton, true) : '—'} />
          <KeyValue label="DB / carton" value={derived.sellingPricePerCartonForDb != null ? formatCurrency(derived.sellingPricePerCartonForDb, true) : '—'} />
          <KeyValue label="RSS / carton" value={derived.sellingPricePerCartonForRss != null ? formatCurrency(derived.sellingPricePerCartonForRss, true) : '—'} />
          <KeyValue label="DB margin" value={derived.marginPercentageForDb != null ? formatPercent(derived.marginPercentageForDb) : '—'} />
          <KeyValue label="RSS margin" value={derived.marginPercentageForRss != null ? formatPercent(derived.marginPercentageForRss) : '—'} />
        </Card>
      </Section>
    </Screen>
  );
}
