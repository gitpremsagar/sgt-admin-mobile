import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon, type IconName } from './icon';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  size = 'md',
  style,
  haptic,
}: ButtonProps) {
  const theme = useTheme();
  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.primary, fg: theme.primaryText, border: theme.primary },
    secondary: { bg: theme.card, fg: theme.text, border: theme.border },
    danger: { bg: theme.danger, fg: '#FFFFFF', border: theme.danger },
    success: { bg: theme.success, fg: '#FFFFFF', border: theme.success },
    ghost: { bg: 'transparent', fg: theme.primary, border: 'transparent' },
  };
  const colors = palette[variant];
  const height = size === 'sm' ? 34 : size === 'lg' ? 52 : 44;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={() => {
        if (haptic || variant === 'danger') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1,
          paddingHorizontal: size === 'sm' ? Spacing.two + 2 : Spacing.three,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={colors.fg} /> : null}
          <ThemedText
            type={size === 'sm' ? 'smallBold' : 'heading'}
            style={{ color: colors.fg }}
            numberOfLines={1}>
            {title}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

type IconButtonProps = {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  size?: number;
  accessibilityLabel?: string;
};

export function IconButton({ icon, onPress, color, size = 22, accessibilityLabel }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}>
      <Icon name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconBtn: { padding: Spacing.one },
});
