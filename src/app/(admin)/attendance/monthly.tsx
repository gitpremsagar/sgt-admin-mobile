import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ATT_KEY, MonthNav } from '@/components/attendance';
import { QueryBoundary } from '@/components/query-boundary';
import { ThemedText } from '@/components/themed-text';
import { Badge, Card, KeyValue, Row, Screen, Section } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { formatCurrency } from '@/lib/format';
import { attendanceService } from '@/services/attendance';

export default function AttendanceMonthlyScreen() {
  const [month, setMonth] = useState(new Date());
  const y = month.getFullYear();
  const m = month.getMonth() + 1;
  const query = useQuery({ queryKey: [...ATT_KEY, 'monthly', y, m], queryFn: () => attendanceService.monthly(y, m) });

  return (
    <>
      <Stack.Screen options={{ title: 'Monthly register' }} />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        <MonthNav value={month} onChange={setMonth} />
        <QueryBoundary query={query}>
          {(data) => (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {data.days.filter((d) => d.isHoliday).length} holidays this month. Tap an employee for daily records,
                payroll and advances.
              </ThemedText>
              {data.groups.map((g) => (
                <Section key={g.category} title={`${g.label} (${g.employees.length})`}>
                  <View style={{ gap: Spacing.two }}>
                    {g.employees.map((e) => (
                      <Card
                        key={e.user.id}
                        onPress={() =>
                          router.push({
                            pathname: '/attendance/employees/[userId]',
                            params: { userId: e.user.id, year: String(y), month: String(m) },
                          })
                        }>
                        <Row style={{ justifyContent: 'space-between' }}>
                          <ThemedText type="heading" style={{ flex: 1 }} numberOfLines={1}>
                            {e.user.name}
                          </ThemedText>
                          {e.payroll.payable != null ? (
                            <ThemedText type="heading">{formatCurrency(e.payroll.payable)}</ThemedText>
                          ) : null}
                        </Row>
                        <Row style={{ flexWrap: 'wrap' }}>
                          <Badge label={`P ${e.summary.present}`} tone="success" />
                          <Badge label={`H ${e.summary.halfDay}`} tone="warning" />
                          <Badge label={`A ${e.summary.absent}`} tone="danger" />
                          {e.payroll.totalOtHours ? <Badge label={`OT ${e.payroll.totalOtHours}h`} tone="info" /> : null}
                        </Row>
                        {e.payroll.totalAdvanceDue ? (
                          <KeyValue label="Advance due" value={formatCurrency(e.payroll.totalAdvanceDue)} />
                        ) : null}
                      </Card>
                    ))}
                  </View>
                </Section>
              ))}
            </>
          )}
        </QueryBoundary>
      </Screen>
    </>
  );
}
