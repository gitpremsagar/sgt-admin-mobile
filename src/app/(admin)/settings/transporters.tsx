import { CrudScreen } from '@/components/crud';
import { qk } from '@/hooks/api/lookups';
import { transportersService } from '@/services/masters';

export default function TransportersScreen() {
  return (
    <CrudScreen
      title="Transporters"
      singular="Transporter"
      icon="local_shipping"
      queryKey={qk.transporters}
      list={() => transportersService.list()}
      getId={(t) => t.id}
      itemTitle={(t) => t.name}
      itemSubtitle={(t) => [t.area, t.transporterContact].filter(Boolean).join(' · ')}
      sort={(a, b) => a.name.localeCompare(b.name)}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'transporterContact', label: 'Contact', type: 'phone' },
        { key: 'area', label: 'Area' },
      ]}
      create={transportersService.create}
      update={transportersService.update}
      remove={transportersService.remove}
    />
  );
}
