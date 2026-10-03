import { router } from 'expo-router';

import { CrudScreen } from '@/components/crud';
import { salesOfficersService, type SalesOfficer } from '@/services/masters';

export default function SalesOfficersScreen() {
  return (
    <CrudScreen<SalesOfficer>
      title="Sales officers"
      singular="Sales officer"
      icon="how_to_reg"
      queryKey={['sales-officers']}
      list={salesOfficersService.list}
      getId={(s) => s.id}
      itemTitle={(s) => s.name}
      itemSubtitle={(s) => [s.phone, s.email].filter(Boolean).join(' · ')}
      sort={(a, b) => a.name.localeCompare(b.name)}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'phone', label: 'Phone', type: 'phone' },
        { key: 'password', label: 'Password', type: 'password', createOnly: true, hint: 'Optional' },
      ]}
      create={(b) => salesOfficersService.create(b as Parameters<typeof salesOfficersService.create>[0])}
      onItemPress={(s) => router.push({ pathname: '/settings/sales-officers/[id]', params: { id: s.id } })}
    />
  );
}
