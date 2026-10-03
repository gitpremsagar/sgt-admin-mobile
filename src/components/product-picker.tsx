import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, Icon, SearchBar, Sheet, Skeleton } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { qk } from '@/hooks/api/lookups';
import { useDebounced } from '@/hooks/use-debounced';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatNumber } from '@/lib/format';
import { productService } from '@/services/products';
import type { Product } from '@/types/models';

export type PickedProduct = Pick<Product, 'id' | 'name' | 'productCode'> & Partial<Product>;

/** Search-as-you-type product picker. Keeps the sheet open so several products can be added. */
export function ProductPicker({
  visible,
  onClose,
  onPick,
  selectedIds = [],
  showStock = true,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (p: PickedProduct) => void;
  selectedIds?: string[];
  showStock?: boolean;
}) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const query = useQuery({
    queryKey: [...qk.products, 'picker', debounced],
    queryFn: () => productService.list({ search: debounced || undefined, limit: 40, excludeDiscontinued: true }),
    enabled: visible,
  });

  return (
    <Sheet visible={visible} onClose={onClose} title="Add products" scroll={false} fullHeight>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search name or code" />
      {query.isLoading ? (
        <Skeleton count={6} height={52} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={query.data?.products ?? []}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const selected = selectedIds.includes(item.id);
            return (
              <Pressable
                onPress={() => onPick(item)}
                style={({ pressed }) => [
                  styles.row,
                  { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundElement : 'transparent' },
                ]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="heading" numberOfLines={1}>
                    {item.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.productCode} · MRP {formatCurrency(item.mrp)}
                  </ThemedText>
                </View>
                {showStock && item.stockQuantity != null ? (
                  <Badge
                    label={`${formatNumber(item.stockQuantity)} in stock`}
                    tone={item.stockQuantity > 0 ? 'success' : 'danger'}
                  />
                ) : null}
                <Icon name={selected ? 'check_circle' : 'add'} color={selected ? theme.success : theme.primary} />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={{ padding: Spacing.three }}>
              No products found
            </ThemedText>
          }
        />
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three - 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
