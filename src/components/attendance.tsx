import { addMonths, format } from 'date-fns';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, IconButton, Row } from '@/components/ui';
import { humanize } from '@/lib/format';
import { attendanceTone } from '@/lib/status';
import type { AttendanceStatus } from '@/services/attendance';

export const ATT_KEY = ['attendance'];

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  return <Badge label={status === 'NOT_MARKED' ? 'Not marked' : humanize(status)} tone={attendanceTone(status)} />;
}

export function minutesLabel(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function MonthNav({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <IconButton icon="arrow_back" onPress={() => onChange(addMonths(value, -1))} accessibilityLabel="Previous month" />
      <View style={{ alignItems: 'center' }}>
        <ThemedText type="subtitle">{format(value, 'MMMM yyyy')}</ThemedText>
      </View>
      <IconButton icon="chevron_right" onPress={() => onChange(addMonths(value, 1))} accessibilityLabel="Next month" />
    </Row>
  );
}
