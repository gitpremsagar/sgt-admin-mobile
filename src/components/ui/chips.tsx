import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Chip<T extends string> = { value: T; label: string };

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Chip<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.primary : theme.card,
                borderColor: active ? theme.primary : theme.border,
              },
            ]}>
            <ThemedText type="smallBold" style={{ color: active ? theme.primaryText : theme.text }}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Wrapping multi-select chips. */
export function MultiChips({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: Chip<string>[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.one }}>
      {label ? (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
      ) : null}
      <View style={[styles.row, { flexWrap: 'wrap', flexDirection: 'row' }]}>
        {options.map((o) => {
          const active = value.includes(o.value);
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(active ? value.filter((v) => v !== o.value) : [...value, o.value])}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? theme.primarySoft : theme.card,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}>
              <ThemedText type="smallBold" style={{ color: active ? theme.primary : theme.text }}>
                {o.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Chip<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, active && { backgroundColor: theme.card }]}>
            <ThemedText type="smallBold" themeColor={active ? 'text' : 'textSecondary'} numberOfLines={1}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SwitchRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <ThemedText type="heading">{label}</ThemedText>
        {description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: theme.primary, false: theme.backgroundSelected }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: {
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two - 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  segment: { flexDirection: 'row', borderRadius: Radius.md, padding: 3 },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm + 2,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
