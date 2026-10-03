import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { FieldsForm, initialValues, type FieldDef } from '@/components/crud';
import { CUSTOMER_VEHICLE_TYPES, DistributorForm } from '@/components/distributor-form';
import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  Button,
  Card,
  confirmAction,
  Row,
  Screen,
  Section,
  SegmentedControl,
  Sheet,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { customerName, qk } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { customersService, deliveryAddressService } from '@/services/masters';
import type { DeliveryAddress } from '@/types/models';

const ADDRESS_FIELDS: FieldDef[] = [
  { key: 'address', label: 'Address', type: 'multiline', required: true },
  { key: 'area', label: 'Area', required: true, autoCapitalize: 'words' },
  { key: 'state', label: 'State', required: true, autoCapitalize: 'words' },
  { key: 'pincode', label: 'Pincode', type: 'int', required: true },
  { key: 'vehicleType', label: 'Vehicle type', type: 'select', required: true, options: CUSTOMER_VEHICLE_TYPES },
  { key: 'twoSideDistance', label: 'Two-side distance (km)', type: 'int', required: true },
  { key: 'default', label: 'Default address', type: 'switch', createOnly: true },
];

type Tab = 'details' | 'addresses';

export default function DistributorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('details');
  const customer = useQuery({ queryKey: [...qk.customers, id], queryFn: () => customersService.get(id) });
  const remove = useApiMutation(() => customersService.remove(id), {
    invalidate: [qk.customers],
    successMessage: 'Distributor deleted',
    onSuccess: () => router.back(),
  });

  return (
    <>
      <Stack.Screen options={{ title: customer.data ? customerName(customer.data) : 'Distributor' }} />
      <QueryBoundary query={customer}>
        {(c) => (
          <Screen refreshing={customer.isRefetching} onRefresh={customer.refetch}>
            <SegmentedControl<Tab>
              value={tab}
              onChange={setTab}
              options={[
                { value: 'details', label: 'Details' },
                { value: 'addresses', label: 'Delivery addresses' },
              ]}
            />
            {tab === 'details' ? (
              <>
                <DistributorForm customer={c} />
                <Button
                  title="Delete distributor"
                  variant="danger"
                  icon="delete"
                  loading={remove.isPending}
                  onPress={async () => {
                    if (
                      await confirmAction({
                        title: `Delete ${customerName(c)}?`,
                        message: 'This cannot be undone.',
                        confirmLabel: 'Delete',
                        destructive: true,
                      })
                    ) {
                      remove.mutate();
                    }
                  }}
                />
              </>
            ) : (
              <Addresses userId={c.id} />
            )}
          </Screen>
        )}
      </QueryBoundary>
    </>
  );
}

function Addresses({ userId }: { userId: string }) {
  const key = ['delivery-addresses', userId];
  const [editing, setEditing] = useState<DeliveryAddress | 'new' | null>(null);
  const list = useQuery({ queryKey: key, queryFn: () => deliveryAddressService.list(userId) });
  const setDefault = useApiMutation((id: string) => deliveryAddressService.setDefault(id), {
    invalidate: [key],
    successMessage: 'Default address updated',
  });
  const remove = useApiMutation((id: string) => deliveryAddressService.remove(id), {
    invalidate: [key],
    successMessage: 'Address deleted',
  });

  return (
    <Section title="Delivery addresses">
      <Button title="Add address" icon="add" variant="secondary" onPress={() => setEditing('new')} />
      <QueryBoundary query={list}>
        {(rows) => (
          <View style={{ gap: Spacing.two }}>
            {!rows.length ? (
              <ThemedText type="small" themeColor="textSecondary">
                No delivery addresses yet.
              </ThemedText>
            ) : null}
            {rows.map((a) => (
              <Card key={a.id}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <ThemedText type="smallBold">{[a.area, a.state].filter(Boolean).join(', ')}</ThemedText>
                  {a.default ? <Badge label="Default" tone="success" /> : null}
                </Row>
                <ThemedText type="small">{a.address}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {[a.pincode, a.vehicleType, `${a.twoSideDistance} km`].filter(Boolean).join(' · ')}
                </ThemedText>
                <Row style={{ marginTop: Spacing.two, flexWrap: 'wrap' }}>
                  <Button title="Edit" size="sm" variant="secondary" icon="edit" onPress={() => setEditing(a)} />
                  {!a.default ? (
                    <Button title="Make default" size="sm" variant="ghost" onPress={() => setDefault.mutate(a.id)} />
                  ) : null}
                  <Button
                    title="Delete"
                    size="sm"
                    variant="ghost"
                    onPress={async () => {
                      if (await confirmAction({ title: 'Delete this address?', confirmLabel: 'Delete', destructive: true })) {
                        remove.mutate(a.id);
                      }
                    }}
                  />
                </Row>
              </Card>
            ))}
          </View>
        )}
      </QueryBoundary>
      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'New address' : 'Edit address'}>
        {editing ? (
          <AddressForm userId={userId} address={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
        ) : null}
      </Sheet>
    </Section>
  );
}

function AddressForm({ userId, address, onDone }: { userId: string; address: DeliveryAddress | null; onDone: () => void }) {
  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      address
        ? deliveryAddressService.update(address.id, body)
        : deliveryAddressService.create({ ...(body as { address: string }), userId }),
    {
      invalidate: [['delivery-addresses', userId]],
      successMessage: address ? 'Address updated' : 'Address added',
      onSuccess: onDone,
    }
  );
  return (
    <FieldsForm
      fields={ADDRESS_FIELDS}
      initial={address ? initialValues(ADDRESS_FIELDS, address) : { ...initialValues(ADDRESS_FIELDS, null), vehicleType: 'LCV' }}
      editing={!!address}
      saving={save.isPending}
      onSubmit={(body) => save.mutate({ ...body, pincode: body.pincode !== undefined ? String(body.pincode) : undefined })}
    />
  );
}
