import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { useState } from 'react';
import { View } from 'react-native';

import { ATT_KEY, MonthNav, minutesLabel, StatusBadge } from '@/components/attendance';
import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import {
  Button,
  Card,
  confirmAction,
  Divider,
  IconButton,
  Input,
  KeyValue,
  Row,
  Screen,
  Section,
  Sheet,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency, formatTime, toNumberOrNull } from '@/lib/format';
import { attendanceService, type MonthlyRow } from '@/services/attendance';

export default function EmployeeAttendanceScreen() {
  const params = useLocalSearchParams<{ userId: string; year?: string; month?: string }>();
  const [month, setMonth] = useState(() =>
    params.year && params.month ? new Date(Number(params.year), Number(params.month) - 1, 1) : new Date()
  );
  const y = month.getFullYear();
  const m = month.getMonth() + 1;
  const detail = useQuery({
    queryKey: [...ATT_KEY, 'employee', params.userId, y, m],
    queryFn: () => attendanceService.employeeMonthly(params.userId, y, m),
  });
  const monthly = useQuery({ queryKey: [...ATT_KEY, 'monthly', y, m], queryFn: () => attendanceService.monthly(y, m) });
  const row = monthly.data?.groups.flatMap((g) => g.employees).find((e) => e.user.id === params.userId);

  return (
    <>
      <Stack.Screen options={{ title: detail.data?.employee.name ?? 'Employee' }} />
      <Screen refreshing={detail.isRefetching} onRefresh={() => { detail.refetch(); monthly.refetch(); }}>
        <MonthNav value={month} onChange={setMonth} />
        <QueryBoundary query={detail}>
          {(data) => (
            <>
              <Row>
                <Card style={{ flex: 1 }}>
                  <KeyValue label="Present" value={data.summary.present} />
                  <KeyValue label="Half day" value={data.summary.halfDay} />
                  <KeyValue label="Absent" value={data.summary.absent} />
                  <KeyValue label="Holidays" value={data.summary.holiday} />
                  <KeyValue label="Overtime" value={minutesLabel(data.summary.totalExtraMinutes)} />
                </Card>
              </Row>
              {row ? <Payroll row={row} year={y} month={m} /> : null}
              <Section title="Days">
                <Card>
                  {data.days.map((d, i) => (
                    <View key={d.date} style={{ gap: Spacing.two }}>
                      {i ? <Divider /> : null}
                      <Row style={{ justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="smallBold">
                            {format(new Date(d.date), 'dd MMM')} · {d.weekday}
                          </ThemedText>
                          <ThemedText type="caption" themeColor="textSecondary">
                            {d.record?.punchIn
                              ? `${formatTime(d.record.punchIn)} → ${d.record.punchOut ? formatTime(d.record.punchOut) : '…'}`
                              : (d.holidayName ?? d.record?.remark ?? '')}
                          </ThemedText>
                        </View>
                        <StatusBadge status={d.displayStatus} />
                      </Row>
                    </View>
                  ))}
                </Card>
              </Section>
            </>
          )}
        </QueryBoundary>
      </Screen>
    </>
  );
}

function Payroll({ row, year, month }: { row: MonthlyRow; year: number; month: number }) {
  const theme = useTheme();
  const [deductOpen, setDeductOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const p = row.payroll;
  const removeAdvance = useApiMutation((id: string) => attendanceService.deleteAdvance(id, year, month), {
    invalidate: [ATT_KEY],
    successMessage: 'Advance removed',
  });

  return (
    <Section title="Payroll">
      <Card>
        <KeyValue label="Salary" value={p.salary != null ? formatCurrency(p.salary) : 'Not set'} />
        <KeyValue label="Working days" value={p.workingDays} />
        <KeyValue label="OT hours" value={p.totalOtHours} />
        <KeyValue label="Earned" value={p.amount != null ? formatCurrency(p.amount) : '—'} />
        <KeyValue label="Advance deduction" value={formatCurrency(p.deductionAdvance)} />
        <KeyValue label="Other deduction" value={formatCurrency(p.deductionOther)} />
        <Divider />
        <KeyValue label="Payable" value={p.payable != null ? formatCurrency(p.payable) : '—'} emphasize />
        <KeyValue label="Advance outstanding" value={formatCurrency(p.totalAdvanceDue)} />
        <Row>
          <Button title="Deductions" size="sm" variant="secondary" style={{ flex: 1 }} onPress={() => setDeductOpen(true)} />
          <Button title="Give advance" size="sm" variant="secondary" style={{ flex: 1 }} onPress={() => setAdvanceOpen(true)} />
        </Row>
      </Card>
      {row.advanceGrants.filter((a) => a.year === year && a.month === month).map((a) => (
        <Card key={a.id ?? `${a.amount}-${a.note}`}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <ThemedText type="heading">Advance {formatCurrency(a.amount)}</ThemedText>
              {a.note ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {a.note}
                </ThemedText>
              ) : null}
            </View>
            {a.id ? (
              <IconButton
                icon="delete"
                color={theme.danger}
                accessibilityLabel="Remove advance"
                onPress={async () => {
                  if (await confirmAction({ title: 'Remove this advance?', confirmLabel: 'Remove', destructive: true })) {
                    removeAdvance.mutate(a.id!);
                  }
                }}
              />
            ) : null}
          </Row>
        </Card>
      ))}
      <Sheet visible={deductOpen} onClose={() => setDeductOpen(false)} title="Deductions">
        {deductOpen ? <DeductionForm row={row} year={year} month={month} onClose={() => setDeductOpen(false)} /> : null}
      </Sheet>
      <Sheet visible={advanceOpen} onClose={() => setAdvanceOpen(false)} title="Give advance">
        {advanceOpen ? <AdvanceForm row={row} year={year} month={month} onClose={() => setAdvanceOpen(false)} /> : null}
      </Sheet>
    </Section>
  );
}

function DeductionForm({ row, year, month, onClose }: { row: MonthlyRow; year: number; month: number; onClose: () => void }) {
  const [advance, setAdvance] = useState(String(row.payroll.deductionAdvance ?? 0));
  const [other, setOther] = useState(String(row.payroll.deductionOther ?? 0));
  const save = useApiMutation(
    () =>
      attendanceService.updatePayroll(year, month, row.user.id, {
        deductionAdvance: toNumberOrNull(advance) ?? 0,
        deductionOther: toNumberOrNull(other) ?? 0,
      }),
    { invalidate: [ATT_KEY], successMessage: 'Deductions saved', onSuccess: onClose }
  );
  return (
    <View style={{ gap: Spacing.three }}>
      <Input
        label="Advance deduction (₹)"
        value={advance}
        onChangeText={setAdvance}
        keyboardType="decimal-pad"
        hint={`Outstanding advance: ${formatCurrency(row.payroll.totalAdvanceDue)}`}
      />
      <Input label="Other deduction (₹)" value={other} onChangeText={setOther} keyboardType="decimal-pad" />
      <Button title="Save" onPress={() => save.mutate()} loading={save.isPending} />
    </View>
  );
}

function AdvanceForm({ row, year, month, onClose }: { row: MonthlyRow; year: number; month: number; onClose: () => void }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const value = toNumberOrNull(amount);
  const save = useApiMutation(
    () => attendanceService.addAdvance({ userId: row.user.id, amount: value!, year, month, note: note.trim() || undefined }),
    { invalidate: [ATT_KEY], successMessage: 'Advance recorded', onSuccess: onClose }
  );
  return (
    <View style={{ gap: Spacing.three }}>
      <Input label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" autoFocus />
      <Input label="Note" value={note} onChangeText={setNote} />
      <Button title="Save advance" onPress={() => save.mutate()} loading={save.isPending} disabled={!value || value <= 0} />
    </View>
  );
}
