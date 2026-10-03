import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';

import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { ListRow, SearchBar } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { formatNumber } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';

export default function ActualStockScreen() {
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: [...qk.dashboard, 'actual-stock'], queryFn: dashboardService.actualStock });
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = query.data ?? [];
    return q ? list.filter((r) => r.productName.toLowerCase().includes(q) || r.productCode.toLowerCase().includes(q)) : list;
  }, [query.data, search]);
  const total = rows.reduce((s, r) => s + r.quantity, 0);

  return (
    <>
      <Stack.Screen options={{ title: 'Actual stock' }} />
      <ListScreen
        data={rows}
        keyExtractor={(r) => r.productCode}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No stock"
        header={
          <>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search product" />
            <ThemedText type="small" themeColor="textSecondary">
              {rows.length} products · {formatNumber(total)} CB
            </ThemedText>
          </>
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.productName}
            subtitle={item.productCode}
            right={<ThemedText type="heading">{formatNumber(item.quantity)} CB</ThemedText>}
          />
        )}
      />
    </>
  );
}
