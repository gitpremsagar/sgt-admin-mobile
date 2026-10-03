import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatDateTime } from '@/lib/format';

import { Button } from './button';
import { Icon } from './icon';
import { Sheet } from './sheet';

type DateFieldProps = {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  mode?: 'date' | 'datetime';
  placeholder?: string;
  allowClear?: boolean;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DateField({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder = 'Pick a date',
  allowClear,
  error,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const theme = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  const open = () => {
    const current = value ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, picked) => {
          if (event.type !== 'set' || !picked) return;
          if (mode === 'datetime') {
            DateTimePickerAndroid.open({
              value: picked,
              mode: 'time',
              onChange: (e2, time) => {
                if (e2.type !== 'set' || !time) return;
                onChange(time);
              },
            });
          } else {
            onChange(picked);
          }
        },
      });
    } else {
      setDraft(current);
      setIosOpen(true);
    }
  };

  const text = value ? (mode === 'datetime' ? formatDateTime(value) : formatDate(value)) : placeholder;

  return (
    <View style={{ gap: Spacing.one }}>
      {label ? (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      <View style={{ flexDirection: 'row', gap: Spacing.two }}>
        <Pressable
          onPress={open}
          style={[
            styles.field,
            { backgroundColor: theme.card, borderColor: error ? theme.danger : theme.border },
          ]}>
          <Icon name="calendar_month" size={18} color={theme.textSecondary} />
          <ThemedText style={{ flex: 1 }} themeColor={value ? 'text' : 'textSecondary'}>
            {text}
          </ThemedText>
        </Pressable>
        {allowClear && value ? (
          <Button title="Clear" variant="ghost" size="sm" onPress={() => onChange(null)} style={{ height: 46 }} />
        ) : null}
      </View>
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
      {Platform.OS !== 'android' ? (
        <Sheet
          visible={iosOpen}
          onClose={() => setIosOpen(false)}
          title={label ?? 'Pick a date'}
          footer={
            <Button
              title="Done"
              onPress={() => {
                onChange(draft);
                setIosOpen(false);
              }}
            />
          }>
          <DateTimePicker
            value={draft}
            mode={mode}
            display="inline"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={(_, d) => d && setDraft(d)}
          />
        </Sheet>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three - 4,
    height: 46,
  },
});
