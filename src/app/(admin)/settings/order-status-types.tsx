import { CrudScreen } from '@/components/crud';
import { Badge } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { orderStatusTypesService } from '@/services/masters';

export default function OrderStatusTypesScreen() {
  return (
    <CrudScreen
      title="Order status types"
      singular="Status"
      icon="fact_check"
      queryKey={qk.statusTypes}
      list={() => orderStatusTypesService.list()}
      getId={(s) => s.id}
      itemTitle={(s) => s.displayName || s.name}
      itemSubtitle={(s) => s.name}
      itemRight={(s) => <Badge label={`#${s.sortOrder}`} />}
      sort={(a, b) => a.sortOrder - b.sortOrder}
      fields={[
        {
          key: 'name',
          label: 'Status code',
          required: true,
          autoCapitalize: 'characters',
          hint: 'Saved in upper case with underscores, e.g. OUT_FOR_DELIVERY',
        },
        { key: 'displayName', label: 'Display name' },
        { key: 'sortOrder', label: 'Sort order', type: 'int' },
      ]}
      create={orderStatusTypesService.create}
      update={orderStatusTypesService.update}
    />
  );
}
