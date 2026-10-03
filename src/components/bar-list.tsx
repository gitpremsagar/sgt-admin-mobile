import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Bar = { label: string; value: number; secondary?: number | null; display?: string };

/** Horizontal bar chart drawn with plain views (no chart dependency). */
export function BarList({
  data,
  format = (v) => String(v),
  secondaryLabel,
}: {
  data: Bar[];
  format?: (v: number) => string;
  secondaryLabel?: string;
}) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.secondary ?? 0)));
  return (
    <View style={{ gap: Spacing.two }}>
      {data.map((d) => (
        <View key={d.label} style={{ gap: 3 }}>
          <View style={styles.labels}>
            <ThemedText type="small">{d.label}</ThemedText>
            <ThemedText type="smallBold">{d.display ?? format(d.value)}</ThemedText>
          </View>
          <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
            {d.secondary != null ? (
              <View
                style={[
                  styles.fill,
                  styles.secondary,
                  { width: `${(d.secondary / max) * 100}%`, backgroundColor: theme.primarySoft },
                ]}
              />
            ) : null}
            <View style={[styles.fill, { width: `${(d.value / max) * 100}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>
      ))}
      {secondaryLabel ? (
        <ThemedText type="caption" themeColor="textSecondary">
          Light bar: {secondaryLabel}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: 8, borderRadius: Radius.pill, position: 'absolute', left: 0, top: 0 },
  secondary: {},
});
