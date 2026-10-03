import { CrudScreen } from '@/components/crud';
import { Badge } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { productGroupsService } from '@/services/masters';

export default function ProductGroupsScreen() {
  return (
    <CrudScreen
      title="Product groups"
      singular="Group"
      icon="local_offer"
      queryKey={qk.productGroups}
      list={() => productGroupsService.list()}
      getId={(g) => g.id}
      itemTitle={(g) => g.name}
      itemRight={(g) => (g._count ? <Badge label={`${g._count.Product} products`} /> : null)}
      sort={(a, b) => a.name.localeCompare(b.name)}
      fields={[{ key: 'name', label: 'Name', required: true }]}
      create={productGroupsService.create}
      update={productGroupsService.update}
      remove={productGroupsService.remove}
    />
  );
}
