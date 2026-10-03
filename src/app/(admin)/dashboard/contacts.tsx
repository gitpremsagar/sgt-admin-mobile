import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';

import { ListScreen } from '@/components/list-screen';
import { Button, confirmAction, IconButton, Input, ListRow, Row, Sheet } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useTheme } from '@/hooks/use-theme';
import { dashboardService } from '@/services/dashboard';

export default function ContactsScreen() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: '' });
  const query = useQuery({ queryKey: [...qk.dashboard, 'contacts'], queryFn: dashboardService.contacts });
  const create = useApiMutation(
    () =>
      dashboardService.createContact({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        role: form.role.trim() || undefined,
      }),
    {
      invalidate: [[...qk.dashboard, 'contacts']],
      successMessage: 'Contact added',
      onSuccess: () => {
        setOpen(false);
        setForm({ name: '', phone: '', email: '', role: '' });
      },
    }
  );
  const remove = useApiMutation((id: string) => dashboardService.deleteContact(id), {
    invalidate: [[...qk.dashboard, 'contacts']],
    successMessage: 'Contact deleted',
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Contacts' }} />
      <ListScreen
        data={query.data}
        keyExtractor={(c) => c.id}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No contacts"
        emptyIcon="contacts"
        fab={{ onPress: () => setOpen(true), label: 'Add contact' }}
        renderItem={({ item }) => (
          <ListRow
            title={item.name}
            subtitle={[item.role, item.phone, item.email].filter(Boolean).join(' · ')}
            chevron={false}
            right={
              <Row>
                {item.phone ? (
                  <IconButton icon="call" color={theme.primary} onPress={() => Linking.openURL(`tel:${item.phone}`)} accessibilityLabel="Call" />
                ) : null}
                <IconButton
                  icon="delete"
                  color={theme.danger}
                  accessibilityLabel="Delete"
                  onPress={async () => {
                    if (await confirmAction({ title: `Delete ${item.name}?`, confirmLabel: 'Delete', destructive: true })) {
                      remove.mutate(item.id);
                    }
                  }}
                />
              </Row>
            }
          />
        )}
      />
      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Add contact"
        footer={<Button title="Save" onPress={() => create.mutate()} loading={create.isPending} disabled={!form.name.trim()} />}>
        <Input label="Name" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
        <Input label="Role" value={form.role} onChangeText={(role) => setForm({ ...form, role })} />
        <Input label="Phone" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} keyboardType="phone-pad" />
        <Input
          label="Email"
          value={form.email}
          onChangeText={(email) => setForm({ ...form, email })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Sheet>
    </>
  );
}
