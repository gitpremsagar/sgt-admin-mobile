import { CrudScreen } from '@/components/crud';
import { Badge } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { humanize } from '@/lib/format';
import { employeesService } from '@/services/masters';
import { isSuperAdmin, useAuthStore } from '@/stores/auth';
import type { Employee } from '@/types/models';

const USER_TYPES = ['EMPLOYEE', 'ACCOUNTANT', 'DRIVER', 'WAREHOUSE_MANAGER', 'ORDER_MANAGER', 'PURCHASING_MANAGER', 'GUARD', 'ADMIN'];

export default function EmployeesScreen() {
  const user = useAuthStore((s) => s.user);
  const superAdmin = isSuperAdmin(user);
  return (
    <CrudScreen<Employee>
      title="Employees"
      singular="Employee"
      icon="group"
      queryKey={qk.employees}
      list={() => employeesService.list()}
      getId={(e) => e.id}
      itemTitle={(e) => e.name}
      itemSubtitle={(e) => [e.phone, e.email].filter(Boolean).join(' · ')}
      itemRight={(e) => <Badge label={humanize(e.userType)} />}
      searchText={(e) => `${e.name} ${e.email} ${e.phone ?? ''}`}
      sort={(a, b) => a.name.localeCompare(b.name)}
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'phone', label: 'Phone', type: 'phone', required: true, hint: '10–15 digits' },
        { key: 'password', label: 'Password', type: 'password', createOnly: true, hint: 'Optional, at least 6 characters' },
        {
          key: 'userType',
          label: 'Role',
          type: 'select',
          required: true,
          options: USER_TYPES.filter((t) => t !== 'ADMIN' || superAdmin).map((t) => ({ value: t, label: humanize(t) })),
        },
        {
          key: 'department',
          label: 'Department',
          type: 'select',
          options: [
            { value: 'WAREHOUSE', label: 'Warehouse' },
            { value: 'ADMINISTRATION', label: 'Administration' },
          ],
        },
        {
          key: 'warehouseCategory',
          label: 'Warehouse category',
          type: 'select',
          required: true,
          visible: (v) => v.department === 'WAREHOUSE',
          options: ['STAFF', 'DRIVER', 'LABOR', 'WB_LABOR'].map((c) => ({ value: c, label: humanize(c) })),
        },
      ]}
      transformBody={(body, values) =>
        values.department === 'WAREHOUSE' ? body : { ...body, warehouseCategory: null }
      }
      create={employeesService.create}
      update={employeesService.update}
      remove={superAdmin ? employeesService.remove : undefined}
    />
  );
}
