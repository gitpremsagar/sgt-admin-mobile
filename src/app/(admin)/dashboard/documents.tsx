import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';

import { ListScreen } from '@/components/list-screen';
import { Button, confirmAction, IconButton, Input, ListRow, Row, Sheet } from '@/components/ui';
import { qk } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useTheme } from '@/hooks/use-theme';
import { dashboardService } from '@/services/dashboard';

export default function DocumentsScreen() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', fileUrl: '', note: '' });
  const query = useQuery({ queryKey: [...qk.dashboard, 'documents'], queryFn: dashboardService.documents });
  const create = useApiMutation(
    () =>
      dashboardService.createDocument({
        title: form.title.trim(),
        fileUrl: form.fileUrl.trim() || undefined,
        note: form.note.trim() || undefined,
      }),
    {
      invalidate: [[...qk.dashboard, 'documents']],
      successMessage: 'Document added',
      onSuccess: () => {
        setOpen(false);
        setForm({ title: '', fileUrl: '', note: '' });
      },
    }
  );
  const remove = useApiMutation((id: string) => dashboardService.deleteDocument(id), {
    invalidate: [[...qk.dashboard, 'documents']],
    successMessage: 'Document deleted',
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Documents' }} />
      <ListScreen
        data={query.data}
        keyExtractor={(d) => d.id}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No documents"
        emptyIcon="folder"
        fab={{ onPress: () => setOpen(true), label: 'Add document' }}
        renderItem={({ item }) => (
          <ListRow
            title={item.title}
            subtitle={item.note}
            icon="description"
            chevron={false}
            onPress={item.fileUrl ? () => WebBrowser.openBrowserAsync(item.fileUrl!) : undefined}
            right={
              <Row>
                {item.fileUrl ? <IconButton icon="open_in_new" color={theme.primary} onPress={() => WebBrowser.openBrowserAsync(item.fileUrl!)} /> : null}
                <IconButton
                  icon="delete"
                  color={theme.danger}
                  accessibilityLabel="Delete"
                  onPress={async () => {
                    if (await confirmAction({ title: `Delete ${item.title}?`, confirmLabel: 'Delete', destructive: true })) {
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
        title="Add document link"
        footer={<Button title="Save" onPress={() => create.mutate()} loading={create.isPending} disabled={!form.title.trim()} />}>
        <Input label="Title" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
        <Input
          label="Link (URL)"
          value={form.fileUrl}
          onChangeText={(fileUrl) => setForm({ ...form, fileUrl })}
          keyboardType="url"
          autoCapitalize="none"
        />
        <Input label="Note" value={form.note} onChangeText={(note) => setForm({ ...form, note })} multiline />
      </Sheet>
    </>
  );
}
