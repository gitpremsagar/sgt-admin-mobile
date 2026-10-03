import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { addDays, isSameDay, set } from 'date-fns';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ATT_KEY, minutesLabel, StatusBadge } from '@/components/attendance';
import { EditSheet } from '@/components/edit-sheet';
import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import {
  Button,
  Card,
  DateField,
  IconButton,
  KeyValue,
  ListRow,
  Row,
  Screen,
  Section,
  Sheet,
  StatCard,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { formatDate, formatTime, humanize, toYmd } from '@/lib/format';
import { attendanceService, type DailyAttendance } from '@/services/attendance';

type Emp = DailyAttendance['employees'][number];

export default function AttendanceTodayScreen() {
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState<Emp | null>(null);
  const ymd = toYmd(date);
  const query = useQuery({ queryKey: [...ATT_KEY, 'daily', ymd], queryFn: () => attendanceService.daily(ymd) });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Warehouse attendance',
          headerRight: () => <IconButton icon="calendar_month" onPress={() => router.push('/attendance/monthly')} accessibilityLabel="Monthly" />,
        }}
      />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        <Row>
          <IconButton icon="arrow_back" onPress={() => setDate((d) => addDays(d, -1))} accessibilityLabel="Previous day" />
          <View style={{ flex: 1 }}>
            <DateField value={date} onChange={(d) => d && setDate(d)} maximumDate={new Date()} />
          </View>
          <IconButton
            icon="chevron_right"
            onPress={() => setDate((d) => (isSameDay(d, new Date()) ? d : addDays(d, 1)))}
            accessibilityLabel="Next day"
          />
        </Row>
        <QueryBoundary query={query}>{(data) => <Daily data={data} onSelect={setSelected} />}</QueryBoundary>
      </Screen>
      <ActionSheet date={date} emp={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function Daily({ data, onSelect }: { data: DailyAttendance; onSelect: (e: Emp) => void }) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    data.employees.forEach((e) => (c[e.displayStatus] = (c[e.displayStatus] ?? 0) + 1));
    return c;
  }, [data]);
  const groups = useMemo(() => {
    const g = new Map<string, Emp[]>();
    data.employees.forEach((e) => {
      const k = e.user.warehouseCategory;
      g.set(k, [...(g.get(k) ?? []), e]);
    });
    return [...g.entries()];
  }, [data]);

  return (
    <>
      {data.isHoliday ? (
        <Card>
          <ThemedText type="heading">Holiday</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {data.holidaySource === 'SUNDAY' ? 'Sunday' : (data.holiday?.name ?? 'Declared holiday')}
          </ThemedText>
        </Card>
      ) : null}
      <Row>
        <StatCard label="Present" value={String((counts.PRESENT ?? 0) + (counts.IN_PROGRESS ?? 0))} tone="success" />
        <StatCard label="Half day" value={String(counts.HALF_DAY ?? 0)} tone="warning" />
        <StatCard label="Absent" value={String(counts.ABSENT ?? 0)} tone="danger" />
        <StatCard label="Unmarked" value={String(counts.NOT_MARKED ?? 0)} />
      </Row>
      {groups.map(([cat, emps]) => (
        <Section key={cat} title={`${humanize(cat)} (${emps.length})`}>
          <View style={{ gap: Spacing.two }}>
            {emps.map((e) => (
              <ListRow
                key={e.user.id}
                title={e.user.name}
                subtitle={
                  e.record?.punchIn
                    ? `${formatTime(e.record.punchIn)} → ${e.record.punchOut ? formatTime(e.record.punchOut) : '…'}${
                        e.record.extraMinutes ? ` · OT ${minutesLabel(e.record.extraMinutes)}` : ''
                      }`
                    : e.record?.remark || undefined
                }
                right={<StatusBadge status={e.displayStatus} />}
                onPress={() => onSelect(e)}
              />
            ))}
          </View>
        </Section>
      ))}
    </>
  );
}

function ActionSheet({ date, emp, onClose }: { date: Date; emp: Emp | null; onClose: () => void }) {
  return (
    <Sheet visible={!!emp} onClose={onClose} title={emp?.user.name}>
      {emp ? <Actions date={date} emp={emp} onClose={onClose} /> : null}
    </Sheet>
  );
}

function Actions({ date, emp, onClose }: { date: Date; emp: Emp; onClose: () => void }) {
  const ymd = toYmd(date);
  const today = isSameDay(date, new Date());
  const defaultTime = (h: number) => (today ? new Date() : set(date, { hours: h, minutes: 0, seconds: 0, milliseconds: 0 }));
  const [time, setTime] = useState<Date | null>(defaultTime(emp.record?.punchIn ? 18 : 9));
  const [remarkOpen, setRemarkOpen] = useState(false);
  const opts = { invalidate: [ATT_KEY], onSuccess: onClose };

  const punchIn = useApiMutation(() => attendanceService.punchIn(emp.user.id, ymd, (time ?? new Date()).toISOString()), {
    ...opts,
    successMessage: 'Punched in',
  });
  const punchOut = useApiMutation(() => attendanceService.punchOut(emp.user.id, ymd, (time ?? new Date()).toISOString()), {
    ...opts,
    successMessage: 'Punched out',
  });
  const absent = useApiMutation(() => attendanceService.markAbsent(emp.user.id, ymd), { ...opts, successMessage: 'Marked absent' });
  const undo = useApiMutation(() => attendanceService.undo(emp.user.id, ymd), { ...opts, successMessage: 'Last action undone' });
  const remark = useApiMutation((v: string | null) => attendanceService.remark(emp.user.id, ymd, v), {
    invalidate: [ATT_KEY],
    successMessage: 'Remark saved',
    onSuccess: () => setRemarkOpen(false),
  });
  const r = emp.record;
  const busy = punchIn.isPending || punchOut.isPending || absent.isPending || undo.isPending;

  return (
    <View style={{ gap: Spacing.three }}>
      <Card>
        <KeyValue label="Date" value={formatDate(date)} />
        <KeyValue label="Status" value={<StatusBadge status={emp.displayStatus} />} />
        <KeyValue label="Punch in" value={r?.punchIn ? formatTime(r.punchIn) : '—'} />
        <KeyValue label="Punch out" value={r?.punchOut ? formatTime(r.punchOut) : '—'} />
        {r?.remark ? <KeyValue label="Remark" value={r.remark} /> : null}
      </Card>
      <DateField label="Time" mode="datetime" value={time} onChange={setTime} maximumDate={new Date()} />
      <Row>
        <Button
          title="Punch in"
          icon="login"
          variant="success"
          style={{ flex: 1 }}
          disabled={busy || !!r?.punchIn}
          loading={punchIn.isPending}
          onPress={() => punchIn.mutate()}
        />
        <Button
          title="Punch out"
          icon="logout"
          style={{ flex: 1 }}
          disabled={busy || !r?.punchIn || !!r?.punchOut}
          loading={punchOut.isPending}
          onPress={() => punchOut.mutate()}
        />
      </Row>
      <Row>
        <Button
          title="Absent"
          icon="event_busy"
          variant="danger"
          style={{ flex: 1 }}
          disabled={busy || !!r?.punchIn || emp.displayStatus === 'ABSENT'}
          loading={absent.isPending}
          onPress={() => absent.mutate()}
        />
        <Button
          title="Undo"
          icon="undo"
          variant="secondary"
          style={{ flex: 1 }}
          disabled={busy || !r?.lastAction}
          loading={undo.isPending}
          onPress={() => undo.mutate()}
        />
      </Row>
      <Button title={r?.remark ? 'Edit remark' : 'Add remark'} variant="ghost" icon="edit" onPress={() => setRemarkOpen(true)} />
      <Button
        title="Monthly record"
        variant="ghost"
        icon="calendar_month"
        onPress={() => {
          onClose();
          router.push({ pathname: '/attendance/employees/[userId]', params: { userId: emp.user.id } });
        }}
      />
      <EditSheet
        visible={remarkOpen}
        onClose={() => setRemarkOpen(false)}
        title="Remark"
        label="Remark"
        kind="multiline"
        initial={r?.remark}
        saving={remark.isPending}
        onSave={(v) => remark.mutate(v as string | null)}
      />
    </View>
  );
}
