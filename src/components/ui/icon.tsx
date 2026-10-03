import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type IconName = AndroidSymbol;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 22, color, style }: IconProps) {
  const theme = useTheme();
  return (
    <SymbolView
      name={{ android: name, web: name }}
      size={size}
      tintColor={color ?? theme.text}
      style={[{ width: size, height: size }, style]}
    />
  );
}
