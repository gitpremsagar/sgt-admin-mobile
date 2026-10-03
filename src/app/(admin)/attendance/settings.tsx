import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { View } from 'react-native';

import { ATT_KEY } from '@/components/attendance';
import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  Button,
  Card,
  confirmAction,
  DateField,
  IconButton,
  Input,
  ListRow,
  Row,
  SegmentedControl,
  Sheet,
  SwitchRow,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatNumber, humanize, toNumberOrNull, toYmd } from '@/lib/format';
import { attendanceService, type AttProfile, type Department, type Holiday } from '@/services/attendance';
import { toast } from '@/stores/toast';

type Tab = 'profiles' | 'holidays';

export default function AttendanceSettingsScreen() {
  const [department, setDepartment] = useState<Department>('WAREHOUSE');
  const [tab, setTab] = useState<Tab>('profiles');

  const header = (
    <>
      <SegmentedControl<Department>
        value={department}
        onChange={setDepartment}
        options={[
          { value: 'WAREHOUSE', label: 'Warehouse' },
          { value: 'ADMINISTRATION', label: 'Administration' },
        ]}
      />
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'profiles', label: 'Pay profiles' },
          { value: 'holidays', label: 'Holidays' },
        ]}
      />
    </>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Attendance settings' }} />
      {tab === 'profiles' ? (
        <Profiles department={department} header={header} />
      ) : (
        <Holidays department={department} header={header} />
      )}
    </>
  );
}

function hours(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function Profiles({ department, header }: { department: Department; header: ReactElement }) {
  const [editing, setEditing] = useState<AttProfile | null>(null);
  const query = useQuery({
    queryKey: [...ATT_KEY, 'profiles', department],
    queryFn: () => attendanceService.profiles(department),
  });

  return (
    <>
      <ListScreen
        data={query.data}
        keyExtractor={(p) => p.user.id}
        isLoading={query.isLoading}
        error={query.error}
        refreshing={query.isRefetching}
        onRefresh={query.refetch}
        emptyTitle="No employees in this department"
        emptyIcon="group"
        header={header}
        renderItem={({ item }) => (
          <ListRow
            title={item.user.name}
            subtitle={[humanize(item.user.warehouseCategory), humanize(item.user.userType)].filter(Boolean).join(' · ')}
            meta={`${hours(item.workingMinutesPerDay)} day · half-day ${hours(item.halfDayMinutes)}${
              item.salaryAmount != null ? ` · ₹${formatNumber(item.salaryAmount)} ${item.salaryType === 'DAILY' ? '/day' : '/month'}` : ''
            }`}
            right={item.profileId ? (item.otEligible ? <Badge label="OT" tone="info" /> : null) : <Badge label="Default" />}
            onPress={() => setEditing(item)}
          />
        )}
      />
      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={editing ? editing.user.name : 'Profile'}>
        {editing ? <ProfileForm profile={editing} department={department} onDone={() => setEditing(null)} /> : null}
      </Sheet>
    </>
  );
}

function ProfileForm({ profile, department, onDone }: { profile: AttProfile; department: Department; onDone: () => void }) {
  const [working, setWorking] = useState(String(profile.workingMinutesPerDay));
  const [half, setHalf] = useState(String(profile.halfDayMinutes));
  const [salaryType, setSalaryType] = useState<'MONTHLY' | 'DAILY'>(profile.salaryType ?? 'MONTHLY');
  const [salary, setSalary] = useState(profile.salaryAmount != null ? String(profile.salaryAmount) : '');
  const [otEligible, setOtEligible] = useState(profile.otEligible);
  const [otRate, setOtRate] = useState(profile.otHourlyRate != null ? String(profile.otHourlyRate) : '');

  const w = toNumberOrNull(working);
  const h = toNumberOrNull(half);
  const s = toNumberOrNull(salary);
  const r = toNumberOrNull(otRate);
  const errors = {
    working: w === null || !Number.isInteger(w) || w < 30 || w > 960 ? 'Whole minutes between 30 and 960' : undefined,
    half:
      h === null || !Number.isInteger(h) || h < 30
        ? 'Whole minutes, at least 30'
        : w !== null && h >= w
          ? 'Must be less than the working day'
          : undefined,
    salary: salary && (s === null || s < 0) ? 'Invalid amount' : undefined,
    otRate: otEligible && (r === null || r <= 0) ? 'Required when OT eligible' : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);

  const save = useApiMutation(
    () =>
      attendanceService.updateProfile(profile.user.id, {
        workingMinutesPerDay: w!,
        halfDayMinutes: h!,
        salaryType: s === null ? null : salaryType,
        salaryAmount: s,
        otEligible,
        otHourlyRate: otEligible ? r : null,
      }),
    {
      invalidate: [[...ATT_KEY, 'profiles', department], ATT_KEY],
      successMessage: 'Profile saved',
      onSuccess: onDone,
    }
  );

  return (
    <View style={{ gap: Spacing.three }}>
      <Row>
        <Input
          label="Working day (min)"
          value={working}
          onChangeText={setWorking}
          keyboardType="number-pad"
          error={errors.working}
          containerStyle={{ flex: 1 }}
        />
        <Input
          label="Half day (min)"
          value={half}
          onChangeText={setHalf}
          keyboardType="number-pad"
          error={errors.half}
          containerStyle={{ flex: 1 }}
        />
      </Row>
      <SegmentedControl<'MONTHLY' | 'DAILY'>
        value={salaryType}
        onChange={setSalaryType}
        options={[
          { value: 'MONTHLY', label: 'Monthly salary' },
          { value: 'DAILY', label: 'Daily wage' },
        ]}
      />
      <Input
        label={salaryType === 'DAILY' ? 'Daily wage (₹)' : 'Monthly salary (₹)'}
        value={salary}
        onChangeText={setSalary}
        keyboardType="decimal-pad"
        hint="Leave blank if not set"
        error={errors.salary}
      />
      <SwitchRow label="Overtime eligible" value={otEligible} onChange={setOtEligible} />
      {otEligible ? (
        <Input label="OT hourly rate (₹)" value={otRate} onChangeText={setOtRate} keyboardType="decimal-pad" error={errors.otRate} />
      ) : null}
      <Button title="Save profile" disabled={!valid} loading={save.isPending} onPress={() => save.mutate()} />
    </View>
  );
}

function Holidays({ department, header }: { department: Department; header: ReactElement }) {
  const theme = useTheme();
  const key = [...ATT_KEY, 'holidays', department];
  const [date, setDate] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const query = useQuery({ queryKey: key, queryFn: () => attendanceService.holidays(department) });

  const add = useApiMutation(
    () => attendanceService.addHoliday({ date: toYmd(date!), department, name: name.trim() || undefined }),
    {
      invalidate: [key, ATT_KEY],
      successMessage: 'Holiday added',
      onSuccess: () => {
        setDate(null);
        setName('');
      },
    }
  );
  const remove = useApiMutation((id: string) => attendanceService.deleteHoliday(id), {
    invalidate: [key, ATT_KEY],
    successMessage: 'Holiday removed',
  });

  const rows = [...(query.data ?? [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ListScreen<Holiday>
      data={rows}
      keyExtractor={(h) => h.id}
      isLoading={query.isLoading}
      error={query.error}
      refreshing={query.isRefetching}
      onRefresh={query.refetch}
      emptyTitle="No holidays declared"
      emptyIcon="event"
      header={
        <>
          {header}
          <Card>
            <ThemedText type="smallBold">Declare a holiday</ThemedText>
            <DateField label="Date" value={date} onChange={setDate} />
            <Input label="Name" value={name} onChangeText={setName} placeholder="e.g. Diwali" />
            <ThemedText type="small" themeColor="textSecondary">
              Sundays are already holidays and can’t be declared.
            </ThemedText>
            <Button
              title="Add holiday"
              icon="add"
              disabled={!date}
              loading={add.isPending}
              onPress={() => {
                if (date?.getDay() === 0) {
                  toast.error('Sundays are already holidays');
                  return;
                }
                add.mutate();
              }}
            />
          </Card>
        </>
      }
      renderItem={({ item }) => (
        <ListRow
          title={item.name || 'Holiday'}
          subtitle={formatDate(item.date)}
          chevron={false}
          right={
            <IconButton
              icon="delete"
              color={theme.danger}
              accessibilityLabel="Delete holiday"
              onPress={async () => {
                if (await confirmAction({ title: `Remove ${item.name || 'holiday'}?`, confirmLabel: 'Remove', destructive: true })) {
                  remove.mutate(item.id);
                }
              }}
            />
          }
        />
      )}
    />
  );
}
