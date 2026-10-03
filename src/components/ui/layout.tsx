import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';

type ScreenProps = {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
};

export function Screen({
  children,
  refreshing = false,
  onRefresh,
  scroll = true,
  padded = true,
  contentStyle,
  footer,
}: ScreenProps) {
  const theme = useTheme();
  const inner = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[padded && styles.padded, { gap: Spacing.three }, contentStyle]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        ) : undefined
      }>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>{inner}</View>
      {footer ? (
        <View style={[styles.footer, { borderColor: theme.border, backgroundColor: theme.card }]}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const base = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }]}>
      {children}
    </Pressable>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: Spacing.two }}>
      {title || action ? (
        <View style={styles.sectionHeader}>
          {title ? (
            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionTitle}>
              {title.toUpperCase()}
            </ThemedText>
          ) : (
            <View />
          )}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function KeyValue({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: ReactNode;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.kv}>
      <ThemedText type="small" themeColor="textSecondary" style={{ flexShrink: 1 }}>
        {label}
      </ThemedText>
      {typeof value === 'string' || typeof value === 'number' ? (
        <ThemedText
          type={emphasize ? 'heading' : 'smallBold'}
          style={{ flexShrink: 1, textAlign: 'right' }}
          selectable>
          {value}
        </ThemedText>
      ) : (
        value
      )}
    </View>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }} />;
}

type ListRowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  right?: ReactNode;
  icon?: IconName;
  onPress?: () => void;
  onLongPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
};

export function ListRow({
  title,
  subtitle,
  meta,
  right,
  icon,
  onPress,
  onLongPress,
  chevron = !!onPress,
  danger,
}: ListRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.backgroundElement : theme.card, borderColor: theme.border },
      ]}>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: danger ? theme.dangerSoft : theme.primarySoft }]}>
          <Icon name={icon} size={20} color={danger ? theme.danger : theme.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <ThemedText type="heading" numberOfLines={2} themeColor={danger ? 'danger' : 'text'}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {subtitle}
          </ThemedText>
        ) : null}
        {meta ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {meta}
          </ThemedText>
        ) : null}
      </View>
      {right}
      {chevron ? <Icon name="chevron_right" size={20} color={theme.textSecondary} /> : null}
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  padded: { padding: Spacing.three, paddingBottom: Spacing.five },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  sectionTitle: { letterSpacing: 0.8 },
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    padding: Spacing.three - 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
});
