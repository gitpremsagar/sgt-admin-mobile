import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { addDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { EditSheet } from '@/components/edit-sheet';
import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  Button,
  Card,
  confirmAction,
  DateField,
  EmptyState,
  IconButton,
  Input,
  ListRow,
  LoadingState,
  Row,
  Screen,
  Section,
  SegmentedControl,
  SelectField,
  Sheet,
  ErrorState,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { customerName, useCustomerOptions, useDriverOptions, useVehicleOptions } from '@/hooks/api/lookups';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, toNumberOrNull, toYmd } from '@/lib/format';
import { dispatchService, type DispatchTripBody } from '@/services/dispatch';
import { orderService } from '@/services/orders';
import type { DispatchTrip, PendingDistributor } from '@/types/models';

const KEY = ['dispatch-trips'];

export default function DispatchTripsScreen() {
  const [tab, setTab] = useState<'trips' | 'pending'>('trips');
  return (
    <>
      <Stack.Screen options={{ title: 'Dispatch trips' }} />
      <Screen>
        <SegmentedControl
          options={[
            { value: 'trips', label: 'Trips' },
            { value: 'pending', label: 'Pending distributors' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'trips' ? <Trips /> : <Pending />}
      </Screen>
    </>
  );
}

function Trips() {
  const [date, setDate] = useState(new Date());
  const [editing, setEditing] = useState<DispatchTrip | 'new' | null>(null);
  const ymd = toYmd(date);
  const query = useQuery({ queryKey: [...KEY, ymd], queryFn: () => dispatchService.list(ymd) });

  const byVehicle = useMemo(() => {
    const groups = new Map<string, DispatchTrip[]>();
    (query.data ?? []).forEach((t) => {
      const key = t.Vehicle?.vehicleNumber ?? 'No vehicle';
      groups.set(key, [...(groups.get(key) ?? []), t]);
    });
    return [...groups.entries()];
  }, [query.data]);

  return (
    <>
      <Row>
        <IconButton icon="arrow_back" onPress={() => setDate((d) => addDays(d, -1))} accessibilityLabel="Previous day" />
        <View style={{ flex: 1 }}>
          <DateField value={date} onChange={(d) => d && setDate(d)} />
        </View>
        <IconButton icon="chevron_right" onPress={() => setDate((d) => addDays(d, 1))} accessibilityLabel="Next day" />
      </Row>
      <Button title="Add trip" icon="add" variant="secondary" onPress={() => setEditing('new')} />
      {query.isLoading ? <LoadingState /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={query.refetch} /> : null}
      {query.data && !query.data.length ? <EmptyState title="No trips" message={`Nothing planned for ${formatDate(date)}.`} icon="route" /> : null}
      {byVehicle.map(([vehicle, trips]) => (
        <Section key={vehicle} title={vehicle}>
          <View style={{ gap: Spacing.two }}>
            {trips
              .sort((a, b) => a.tripNumber - b.tripNumber || (a.vehiclePosition ?? 0) - (b.vehiclePosition ?? 0))
              .map((t) => (
                <ListRow
                  key={t.id}
                  title={t.Distributor?.name ?? 'No distributor'}
                  subtitle={[t.Driver?.name, t.Order ? `Order #${t.Order.customeOrderId}` : null, t.remarks].filter(Boolean).join(' · ')}
                  right={<Badge label={`Trip ${t.tripNumber}${t.vehiclePosition ? ` · #${t.vehiclePosition}` : ''}`} tone="primary" />}
                  onPress={() => setEditing(t)}
                />
              ))}
          </View>
        </Section>
      ))}
      <TripSheet date={date} trip={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function TripSheet({ date, trip, onClose }: { date: Date; trip: DispatchTrip | 'new' | null; onClose: () => void }) {
  return (
    <Sheet visible={!!trip} onClose={onClose} title={trip === 'new' ? 'New trip' : 'Edit trip'}>
      {trip ? <TripForm date={date} trip={trip === 'new' ? null : trip} onClose={onClose} /> : null}
    </Sheet>
  );
}

function TripForm({ date, trip, onClose }: { date: Date; trip: DispatchTrip | null; onClose: () => void }) {
  const customerOptions = useCustomerOptions();
  const vehicleOptions = useVehicleOptions();
  const driverOptions = useDriverOptions();
  const [tripNumber, setTripNumber] = useState(String(trip?.tripNumber ?? 1));
  const [position, setPosition] = useState(trip?.vehiclePosition != null ? String(trip.vehiclePosition) : '');
  const [distributorId, setDistributorId] = useState<string | null>(trip?.distributorId ?? null);
  const [orderId, setOrderId] = useState<string | null>(trip?.orderId ?? null);
  const [vehicleId, setVehicleId] = useState<string | null>(trip?.vehicleId ?? null);
  const [driverId, setDriverId] = useState<string | null>(trip?.driverId ?? null);
  const [remarks, setRemarks] = useState(trip?.remarks ?? '');

  const orders = useQuery({
    queryKey: ['orders', 'for-dispatch', distributorId],
    queryFn: () => orderService.list({ customerId: distributorId!, limit: 30, page: 1 }),
    enabled: !!distributorId,
  });

  const save = useApiMutation(
    () => {
      const body: DispatchTripBody = {
        tripNumber: Math.max(1, Math.round(toNumberOrNull(tripNumber) ?? 1)),
        tripDate: (trip ? new Date(trip.tripDate) : date).toISOString(),
        distributorId,
        orderId,
        vehicleId,
        driverId,
        remarks: remarks.trim() || null,
        vehiclePosition: toNumberOrNull(position),
      };
      return trip ? dispatchService.update(trip.id, body) : dispatchService.create(body);
    },
    { invalidate: [KEY], successMessage: trip ? 'Trip updated' : 'Trip added', onSuccess: onClose }
  );
  const remove = useApiMutation(() => dispatchService.remove(trip!.id), {
    invalidate: [KEY],
    successMessage: 'Trip deleted',
    onSuccess: onClose,
  });

  return (
    <View style={{ gap: Spacing.three }}>
      <Row>
        <Input label="Trip #" value={tripNumber} onChangeText={setTripNumber} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
        <Input label="Position" value={position} onChangeText={setPosition} keyboardType="number-pad" containerStyle={{ flex: 1 }} />
      </Row>
      <SelectField label="Vehicle" value={vehicleId} options={vehicleOptions} onChange={setVehicleId} allowClear />
      <SelectField label="Driver" value={driverId} options={driverOptions} onChange={setDriverId} allowClear />
      <SelectField
        label="Distributor"
        value={distributorId}
        options={customerOptions}
        searchable
        allowClear
        onChange={(v) => {
          setDistributorId(v);
          setOrderId(null);
        }}
      />
      <SelectField
        label="Order"
        value={orderId}
        options={(orders.data?.orders ?? []).map((o) => ({ value: o.id, label: `#${o.customeOrderId}`, description: formatDate(o.orderDate) }))}
        onChange={setOrderId}
        allowClear
        disabled={!distributorId}
      />
      <Input label="Remarks" value={remarks} onChangeText={setRemarks} multiline />
      <Button title="Save trip" onPress={() => save.mutate()} loading={save.isPending} />
      {trip ? (
        <Button
          title="Delete trip"
          variant="danger"
          icon="delete"
          loading={remove.isPending}
          onPress={async () => {
            if (await confirmAction({ title: 'Delete trip?', confirmLabel: 'Delete', destructive: true })) remove.mutate();
          }}
        />
      ) : null}
    </View>
  );
}

function Pending() {
  const theme = useTheme();
  const customerOptions = useCustomerOptions();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PendingDistributor | null>(null);
  const [newDistributor, setNewDistributor] = useState<string | null>(null);
  const [newRemarks, setNewRemarks] = useState('');
  const query = useQuery({ queryKey: [...KEY, 'pending'], queryFn: dispatchService.pending });

  const add = useApiMutation(() => dispatchService.addPending(newDistributor!, newRemarks.trim() || null), {
    invalidate: [KEY],
    successMessage: 'Added to pending',
    onSuccess: () => {
      setAdding(false);
      setNewDistributor(null);
      setNewRemarks('');
    },
  });
  const update = useApiMutation((v: string | null) => dispatchService.updatePending(editing!.id, v), {
    invalidate: [KEY],
    successMessage: 'Remarks updated',
    onSuccess: () => setEditing(null),
  });
  const remove = useApiMutation((id: string) => dispatchService.removePending(id), {
    invalidate: [KEY],
    successMessage: 'Removed',
  });

  return (
    <>
      <Button title="Add distributor" icon="add" variant="secondary" onPress={() => setAdding(true)} />
      {query.isLoading ? <LoadingState /> : null}
      {query.data && !query.data.length ? <EmptyState title="No pending distributors" icon="done_all" /> : null}
      {query.data?.map((p) => (
        <ListRow
          key={p.id}
          title={customerName(p.Distributor)}
          subtitle={p.remarks || 'No remarks'}
          onPress={() => setEditing(p)}
          chevron={false}
          right={
            <IconButton
              icon="delete"
              color={theme.danger}
              accessibilityLabel="Remove"
              onPress={async () => {
                if (await confirmAction({ title: 'Remove from pending?', confirmLabel: 'Remove', destructive: true })) {
                  remove.mutate(p.id);
                }
              }}
            />
          }
        />
      ))}
      <Sheet
        visible={adding}
        onClose={() => setAdding(false)}
        title="Add pending distributor"
        footer={<Button title="Add" onPress={() => add.mutate()} loading={add.isPending} disabled={!newDistributor} />}>
        <SelectField label="Distributor" value={newDistributor} options={customerOptions} searchable onChange={setNewDistributor} />
        <Input label="Remarks" value={newRemarks} onChangeText={setNewRemarks} multiline />
      </Sheet>
      <EditSheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? customerName(editing.Distributor) : ''}
        label="Remarks"
        kind="multiline"
        initial={editing?.remarks}
        saving={update.isPending}
        onSave={(v) => update.mutate(v as string | null)}
      />
      <Card style={{ borderWidth: 0 }}>
        <ThemedText type="caption" themeColor="textSecondary">
          Distributors waiting for a vehicle. Assign them to a trip from the Trips tab.
        </ThemedText>
      </Card>
    </>
  );
}
