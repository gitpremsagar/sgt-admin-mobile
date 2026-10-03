import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';

import { ATT_KEY } from '@/components/attendance';
import { ListScreen } from '@/components/list-screen';
import { Badge, ListRow, SearchBar } from '@/components/ui';
import { humanize } from '@/lib/format';
import { attendanceService } from '@/services/attendance';

export default function AttendanceEmployeesScreen() {
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: [...ATT_KEY, 'profiles', 'WAREHOUSE'], queryFn: () => attendanceService.profiles('WAREHOUSE') });
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...(query.data ?? [])].sort((a, b) => a.user.name.localeCompare(b.user.name));
    return q ? list.filter((p) => p.user.name.toLowerCase().includes(q)) : list;
  }, [query.data, search]);

  return (
    <>
      <Stack.Screen options={{ title: 'Employee records' }} />
      <ListScreen
        data={rows}
        keyExtractor={(p) => p.user.id}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No warehouse employees"
        emptyIcon="badge"
        header={<SearchBar value={search} onChangeText={setSearch} placeholder="Search employee" />}
        renderItem={({ item }) => (
          <ListRow
            title={item.user.name}
            subtitle={[item.user.phone, item.salaryType ? humanize(item.salaryType) : null].filter(Boolean).join(' · ')}
            right={<Badge label={humanize(item.user.warehouseCategory)} />}
            onPress={() => router.push({ pathname: '/attendance/employees/[userId]', params: { userId: item.user.id } })}
          />
        )}
      />
    </>
  );
}
