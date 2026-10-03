import { CrudScreen } from '@/components/crud';
import { qk } from '@/hooks/api/lookups';
import { categoriesService } from '@/services/masters';

export default function CategoriesScreen() {
  return (
    <CrudScreen
      title="Categories"
      singular="Category"
      icon="category"
      queryKey={qk.categories}
      list={() => categoriesService.list()}
      getId={(c) => c.id}
      itemTitle={(c) => c.name}
      itemSubtitle={(c) => c.description}
      sort={(a, b) => (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name)}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'description', label: 'Description', type: 'multiline', required: true },
        { key: 'position', label: 'Position', type: 'int', hint: 'Lower numbers appear first' },
      ]}
      create={categoriesService.create}
      update={categoriesService.update}
      remove={categoriesService.remove}
    />
  );
}
