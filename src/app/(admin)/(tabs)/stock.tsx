import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { Badge, Button, Card, FilterChips, Row, SearchBar, SelectField, Sheet, SwitchRow } from '@/components/ui';
import { qk, useCategories, useProductGroups } from '@/hooks/api/lookups';
import { useDebounced } from '@/hooks/use-debounced';
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { stockLevel } from '@/lib/status';
import { productService, type ProductListParams } from '@/services/products';
import type { Product } from '@/types/models';

const PAGE_SIZE = 40;

export default function StockScreen() {
  const categories = useCategories();
  const groups = useProductGroups();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const [categoryId, setCategoryId] = useState('all');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [hideZero, setHideZero] = useState(false);
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false);
  const [level, setLevel] = useState<'all' | 'low' | 'out'>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const params: ProductListParams = {
    limit: PAGE_SIZE,
    search: debounced.trim() || undefined,
    categoryId: categoryId === 'all' ? undefined : categoryId,
    productGroupId: groupId ?? undefined,
    hideZeroQuantity: hideZero,
    excludeDiscontinued: !includeDiscontinued,
  };

  const query = useInfiniteQuery({
    queryKey: [...qk.products, 'list', params],
    queryFn: ({ pageParam }) => productService.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.page < last.pagination.totalPages ? last.pagination.page + 1 : undefined),
  });

  const products = useMemo(() => {
    const all = query.data?.pages.flatMap((p) => p.products) ?? [];
    if (level === 'out') return all.filter((p) => (p.stockQuantity ?? 0) <= 0);
    if (level === 'low') return all.filter((p) => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) <= p.lowStockLimit);
    return all;
  }, [query.data, level]);

  const total = query.data?.pages[0]?.pagination.total;
  const activeFilters = (groupId ? 1 : 0) + (hideZero ? 1 : 0) + (includeDiscontinued ? 1 : 0);

  return (
    <>
      <ListScreen
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={query.refetch}
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        loadingMore={query.isFetchingNextPage}
        emptyTitle="No products"
        emptyIcon="inventory_2"
        fab={{ onPress: () => router.push('/products/new'), label: 'New product' }}
        header={
          <>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search name or code" />
            <Row style={{ justifyContent: 'space-between' }}>
              <Button
                title={activeFilters ? `Filters (${activeFilters})` : 'Filters'}
                icon="filter_list"
                variant="secondary"
                size="sm"
                onPress={() => setFiltersOpen(true)}
              />
              {total != null ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {formatNumber(total)} products
                </ThemedText>
              ) : null}
            </Row>
            <FilterChips
              options={[
                { value: 'all', label: 'All categories' },
                ...(categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={categoryId}
              onChange={setCategoryId}
            />
            <FilterChips
              options={[
                { value: 'all', label: 'Any level' },
                { value: 'low', label: 'Low stock' },
                { value: 'out', label: 'Out of stock' },
              ]}
              value={level}
              onChange={(v) => setLevel(v as typeof level)}
            />
          </>
        }
      />
      <Sheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter products"
        footer={<Button title="Done" onPress={() => setFiltersOpen(false)} />}>
        <SelectField
          label="Product group"
          value={groupId}
          options={(groups.data ?? []).map((g) => ({ value: g.id, label: g.name }))}
          onChange={setGroupId}
          allowClear
          placeholder="All groups"
        />
        <SwitchRow label="Hide zero stock" value={hideZero} onChange={setHideZero} />
        <SwitchRow label="Include discontinued" value={includeDiscontinued} onChange={setIncludeDiscontinued} />
      </Sheet>
    </>
  );
}

function ProductCard({ product }: { product: Product }) {
  const lvl = stockLevel(product);
  return (
    <Card onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <ThemedText type="heading" numberOfLines={2}>
            {product.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {[product.productCode, product.Category?.name, `MRP ${formatCurrency(product.mrp)}`].filter(Boolean).join(' · ')}
          </ThemedText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <ThemedText type="subtitle">{formatNumber(product.stockQuantity ?? 0)}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            CB in stock
          </ThemedText>
        </View>
      </Row>
      <Row style={{ flexWrap: 'wrap' }}>
        <Badge label={lvl.label} tone={lvl.tone} />
        {product.isDiscontinued ? <Badge label="Discontinued" tone="danger" /> : null}
        {product.nearestExpiryDate ? <Badge label={`Expires ${formatDate(product.nearestExpiryDate)}`} /> : null}
      </Row>
    </Card>
  );
}
