import { CrudScreen } from '@/components/crud';
import { qk } from '@/hooks/api/lookups';
import { vehicleTypesService } from '@/services/masters';

export default function VehicleTypesScreen() {
  return (
    <CrudScreen
      title="Vehicle types"
      singular="Vehicle type"
      icon="directions_car"
      queryKey={qk.vehicleTypes}
      list={() => vehicleTypesService.list()}
      getId={(t) => t.id}
      itemTitle={(t) => t.name}
      sort={(a, b) => a.name.localeCompare(b.name)}
      fields={[{ key: 'name', label: 'Name', required: true }]}
      create={vehicleTypesService.create}
      update={vehicleTypesService.update}
      remove={vehicleTypesService.remove}
    />
  );
}
