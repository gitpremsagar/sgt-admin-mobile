import { router } from 'expo-router';

import { CrudScreen } from '@/components/crud';
import { Badge } from '@/components/ui';
import { customerName, qk } from '@/hooks/api/lookups';
import { customersService } from '@/services/masters';
import type { Customer } from '@/types/models';

export default function DistributorsScreen() {
  return (
    <CrudScreen<Customer>
      title="Distributors"
      singular="Distributor"
      icon="storefront"
      queryKey={qk.customers}
      list={async () => (await customersService.list()).customers}
      getId={(c) => c.id}
      itemTitle={customerName}
      itemSubtitle={(c) => [c.CustomerDetail?.[0]?.area, c.CustomerDetail?.[0]?.state, c.phone].filter(Boolean).join(' · ')}
      itemRight={(c) => (c.CustomerDetail?.[0]?.dbCategory ? <Badge label={c.CustomerDetail[0].dbCategory} /> : null)}
      sort={(a, b) => customerName(a).localeCompare(customerName(b))}
      searchText={(c) => [customerName(c), c.name, c.email, c.phone, c.CustomerDetail?.[0]?.area].filter(Boolean).join(' ')}
      fields={[]}
      onCreatePress={() => router.push('/settings/distributors/new')}
      onItemPress={(c) => router.push({ pathname: '/settings/distributors/[id]', params: { id: c.id } })}
    />
  );
}
