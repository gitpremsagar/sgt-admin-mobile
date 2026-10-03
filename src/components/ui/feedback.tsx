import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/lib/api/errors';

import { Button } from './button';
import { Icon, type IconName } from './icon';

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export function useToneColors(tone: Tone) {
  const theme = useTheme();
  const map: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: theme.backgroundSelected, fg: theme.text },
    primary: { bg: theme.primarySoft, fg: theme.primary },
    success: { bg: theme.successSoft, fg: theme.success },
    warning: { bg: theme.warningSoft, fg: theme.warning },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
    info: { bg: theme.infoSoft, fg: theme.info },
  };
  return map[tone];
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const colors = useToneColors(tone);
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <ThemedText type="caption" style={{ color: colors.fg }} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'primary',
  onPress,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: IconName;
  tone?: Tone;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const colors = useToneColors(tone);
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stat,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        {icon ? (
          <View style={[styles.statIcon, { backgroundColor: colors.bg }]}>
            <Icon name={icon} size={18} color={colors.fg} />
          </View>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="subtitle" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </ThemedText>
      {sub ? (
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {sub}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.primary} size="large" />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  message,
  icon = 'inventory_2',
  action,
}: {
  title?: string;
  message?: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
}) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Icon name={icon} size={40} color={theme.textSecondary} />
      <ThemedText type="heading">{title}</ThemedText>
      {message ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          {message}
        </ThemedText>
      ) : null}
      {action ? <Button title={action.label} onPress={action.onPress} size="sm" /> : null}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Icon name="error" size={40} color={theme.danger} />
      <ThemedText type="heading">Something went wrong</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
        {getErrorMessage(error)}
      </ThemedText>
      {onRetry ? <Button title="Try again" icon="refresh" onPress={onRetry} size="sm" variant="secondary" /> : null}
    </View>
  );
}

export function Skeleton({ height = 64, count = 4 }: { height?: number; count?: number }) {
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <View style={{ gap: Spacing.two }}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={{ height, borderRadius: Radius.md, backgroundColor: theme.backgroundSelected, opacity }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  stat: {
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three - 2,
    gap: Spacing.one,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.five,
  },
});
