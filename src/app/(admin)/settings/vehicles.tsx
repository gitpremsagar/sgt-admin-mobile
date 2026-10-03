import { CrudScreen } from '@/components/crud';
import { qk, useVehicleTypes } from '@/hooks/api/lookups';
import { vehiclesService } from '@/services/masters';
import type { Vehicle } from '@/types/models';

export default function VehiclesScreen() {
  const types = useVehicleTypes();
  return (
    <CrudScreen<Vehicle>
      title="Vehicles"
      singular="Vehicle"
      icon="local_shipping"
      queryKey={qk.vehicles}
      list={() => vehiclesService.list()}
      getId={(v) => v.id}
      itemTitle={(v) => v.vehicleNumber}
      itemSubtitle={(v) =>
        [v.vehicleName, v.VehicleType?.name, `${v.capacity} CB`, v.mileage ? `${v.mileage} km/L` : null].filter(Boolean).join(' · ')
      }
      searchText={(v) => `${v.vehicleNumber} ${v.vehicleName}`}
      sort={(a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber)}
      fields={[
        { key: 'vehicleNumber', label: 'Vehicle number', required: true, autoCapitalize: 'characters' },
        { key: 'vehicleName', label: 'Vehicle name', required: true },
        {
          key: 'vehicleTypeId',
          label: 'Vehicle type',
          type: 'select',
          required: true,
          options: (types.data ?? []).map((t) => ({ value: t.id, label: t.name })),
        },
        { key: 'capacity', label: 'Capacity (CB)', type: 'int', required: true },
        { key: 'mileage', label: 'Mileage (km/L)', type: 'number', required: true, hint: 'Between 0 and 100' },
      ]}
      create={vehiclesService.create}
      update={vehiclesService.update}
      remove={vehiclesService.remove}
    />
  );
}
