import { CrudScreen } from '@/components/crud';
import { qk } from '@/hooks/api/lookups';
import { productTagsService } from '@/services/masters';

export default function ProductTagsScreen() {
  return (
    <CrudScreen
      title="Product tags"
      singular="Tag"
      icon="sell"
      queryKey={qk.productTags}
      list={() => productTagsService.list()}
      getId={(t) => t.id}
      itemTitle={(t) => t.name}
      sort={(a, b) => a.name.localeCompare(b.name)}
      fields={[{ key: 'name', label: 'Name', required: true }]}
      create={productTagsService.create}
      update={productTagsService.update}
      remove={productTagsService.remove}
    />
  );
}
