import { CrudScreen } from '@/components/crud';
import { qk, useCategories } from '@/hooks/api/lookups';
import { subCategoriesService } from '@/services/masters';

export default function SubCategoriesScreen() {
  const categories = useCategories();
  return (
    <CrudScreen
      title="Sub-categories"
      singular="Sub-category"
      icon="category"
      queryKey={qk.subCategories}
      list={() => subCategoriesService.list()}
      getId={(c) => c.id}
      itemTitle={(c) => c.name}
      itemSubtitle={(c) => c.Category?.name ?? categories.data?.find((x) => x.id === c.categoryId)?.name}
      sort={(a, b) => a.name.localeCompare(b.name)}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'description', label: 'Description', type: 'multiline', required: true },
        {
          key: 'categoryId',
          label: 'Category',
          type: 'select',
          required: true,
          options: (categories.data ?? []).map((c) => ({ value: c.id, label: c.name })),
        },
      ]}
      create={subCategoriesService.create}
      update={subCategoriesService.update}
      remove={subCategoriesService.remove}
    />
  );
}
