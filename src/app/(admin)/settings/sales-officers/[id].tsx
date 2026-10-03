import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { FieldsForm, initialValues, type FieldDef } from '@/components/crud';
import { QueryBoundary } from '@/components/query-boundary';
import {
  Button,
  Card,
  confirmAction,
  IconButton,
  ListRow,
  Row,
  Screen,
  Section,
  SelectField,
  StatCard,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { customerName, useCustomerOptions } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useTheme } from '@/hooks/use-theme';
import { salesOfficersService } from '@/services/masters';

const FIELDS: FieldDef[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'phone', label: 'Phone', type: 'phone' },
  { key: 'password', label: 'New password', type: 'password', hint: 'Leave blank to keep the current password' },
];

const KEY = ['sales-officers'];

export default function SalesOfficerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const customerOptions = useCustomerOptions();
  const [newDistributor, setNewDistributor] = useState<string | null>(null);
  const officer = useQuery({ queryKey: [...KEY, id], queryFn: () => salesOfficersService.get(id) });
  const stats = useQuery({ queryKey: [...KEY, id, 'stats'], queryFn: () => salesOfficersService.stats(id) });

  const update = useApiMutation((body: Record<string, unknown>) => salesOfficersService.update(id, body), {
    invalidate: [KEY],
    successMessage: 'Sales officer updated',
  });
  const assign = useApiMutation((distributorId: string) => salesOfficersService.assign(id, distributorId), {
    invalidate: [KEY],
    successMessage: 'Distributor assigned',
    onSuccess: () => setNewDistributor(null),
  });
  const unassign = useApiMutation((assignmentId: string) => salesOfficersService.unassign(assignmentId), {
    invalidate: [KEY],
    successMessage: 'Distributor removed',
  });
  const remove = useApiMutation(() => salesOfficersService.remove(id), {
    invalidate: [KEY],
    successMessage: 'Sales officer deleted',
    onSuccess: () => router.back(),
  });

  return (
    <>
      <Stack.Screen options={{ title: officer.data?.name ?? 'Sales officer' }} />
      <QueryBoundary query={officer}>
        {(o) => (
          <Screen refreshing={officer.isRefetching} onRefresh={officer.refetch}>
            {stats.data ? (
              <Row>
                <StatCard label="Distributors" value={String(stats.data.assignedDistributors)} />
                <StatCard label="Orders" value={String(stats.data.totalOrders)} />
                <StatCard label="Pending forecasts" value={String(stats.data.pendingForecasts)} tone="warning" />
              </Row>
            ) : null}
            <Section title="Details">
              <Card>
                <FieldsForm
                  fields={FIELDS}
                  initial={initialValues(FIELDS, o)}
                  editing
                  saving={update.isPending}
                  onSubmit={(body) => update.mutate(body)}
                />
              </Card>
            </Section>
            <Section title={`Assigned distributors (${o.SalesOfficerAssignment?.length ?? 0})`}>
              <Row style={{ alignItems: 'flex-end' }}>
                <View style={{ flex: 1 }}>
                  <SelectField
                    value={newDistributor}
                    options={customerOptions}
                    onChange={setNewDistributor}
                    searchable
                    placeholder="Add distributor"
                  />
                </View>
                <Button
                  title="Add"
                  size="sm"
                  disabled={!newDistributor}
                  loading={assign.isPending}
                  onPress={() => newDistributor && assign.mutate(newDistributor)}
                />
              </Row>
              <View style={{ gap: Spacing.two }}>
                {o.SalesOfficerAssignment?.map((a) => (
                  <ListRow
                    key={a.id}
                    title={customerName(a.Distributor)}
                    chevron={false}
                    right={
                      <IconButton
                        icon="close"
                        color={theme.danger}
                        accessibilityLabel="Remove"
                        onPress={async () => {
                          if (await confirmAction({ title: 'Remove distributor?', confirmLabel: 'Remove', destructive: true })) {
                            unassign.mutate(a.id);
                          }
                        }}
                      />
                    }
                  />
                ))}
              </View>
            </Section>
            <Button
              title="Delete sales officer"
              variant="danger"
              icon="delete"
              loading={remove.isPending}
              onPress={async () => {
                if (await confirmAction({ title: `Delete ${o.name}?`, confirmLabel: 'Delete', destructive: true })) remove.mutate();
              }}
            />
          </Screen>
        )}
      </QueryBoundary>
    </>
  );
}
