import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import { FieldsForm, initialValues } from '@/components/crud';
import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, confirmAction, MultiChips, Screen, SearchBar, Section } from '@/components/ui';
import { customerName, qk, useCustomers } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { partyTagFields } from '@/components/party-tag-fields';
import { partyReportTagsService, salesOfficersService } from '@/services/masters';

export default function PartyTagDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tag = useQuery({ queryKey: [...qk.partyTags, id], queryFn: () => partyReportTagsService.get(id) });
  const assigned = useQuery({ queryKey: [...qk.partyTags, id, 'distributors'], queryFn: () => partyReportTagsService.distributors(id) });
  const officers = useQuery({ queryKey: ['sales-officers'], queryFn: salesOfficersService.list });
  const customers = useCustomers();
  const fields = partyTagFields(officers.data ?? []);

  const update = useApiMutation((body: Record<string, unknown>) => partyReportTagsService.update(id, body), {
    invalidate: [qk.partyTags],
    successMessage: 'Tag updated',
  });
  const remove = useApiMutation(() => partyReportTagsService.remove(id), {
    invalidate: [qk.partyTags],
    successMessage: 'Tag deleted',
    onSuccess: () => router.back(),
  });

  return (
    <>
      <Stack.Screen options={{ title: tag.data?.name ?? 'Party tag' }} />
      <QueryBoundary query={tag}>
        {(t) => (
          <Screen>
            <Section title="Details">
              <Card>
                <FieldsForm
                  fields={fields}
                  initial={initialValues(fields, t)}
                  editing
                  saving={update.isPending}
                  onSubmit={(body) => update.mutate(body)}
                />
              </Card>
            </Section>
            {assigned.data && customers.data ? (
              <Assignment
                id={id}
                initial={assigned.data.map((d) => d.customerId)}
                options={customers.data.map((c) => ({ value: c.id, label: customerName(c) }))}
              />
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Loading distributors…
              </ThemedText>
            )}
            <Button
              title="Delete tag"
              variant="danger"
              icon="delete"
              loading={remove.isPending}
              onPress={async () => {
                if (await confirmAction({ title: `Delete ${t.name}?`, confirmLabel: 'Delete', destructive: true })) remove.mutate();
              }}
            />
          </Screen>
        )}
      </QueryBoundary>
    </>
  );
}

function Assignment({ id, initial, options }: { id: string; initial: string[]; options: { value: string; label: string }[] }) {
  const [selected, setSelected] = useState(initial);
  const [search, setSearch] = useState('');
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...options].sort(
      (a, b) => Number(selected.includes(b.value)) - Number(selected.includes(a.value)) || a.label.localeCompare(b.label)
    );
    return q ? sorted.filter((o) => o.label.toLowerCase().includes(q)) : sorted;
  }, [options, search, selected]);
  const save = useApiMutation(() => partyReportTagsService.assignDistributors(id, selected), {
    invalidate: [qk.partyTags, qk.customers],
    successMessage: 'Distributors assigned',
  });

  return (
    <Section title={`Distributors (${selected.length})`}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search distributor" />
      <Card>
        <MultiChips options={visible} value={selected} onChange={setSelected} />
      </Card>
      <Button title="Save assignment" variant="secondary" onPress={() => save.mutate()} loading={save.isPending} />
    </Section>
  );
}
