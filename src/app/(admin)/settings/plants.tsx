import { CrudScreen } from '@/components/crud';
import { qk } from '@/hooks/api/lookups';
import { plantsService } from '@/services/masters';

export default function PlantsScreen() {
  return (
    <CrudScreen
      title="Plants"
      singular="Plant"
      icon="store"
      queryKey={qk.plants}
      list={() => plantsService.list()}
      getId={(p) => p.id}
      itemTitle={(p) => p.name}
      itemSubtitle={(p) => p.location ?? undefined}
      sort={(a, b) => a.name.localeCompare(b.name)}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'location', label: 'Location' },
      ]}
      create={plantsService.create}
      update={plantsService.update}
      remove={plantsService.remove}
    />
  );
}
