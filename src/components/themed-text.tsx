import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'heading' | 'small' | 'smallBold' | 'caption' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  subtitle: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  smallBold: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  caption: { fontSize: 11, lineHeight: 15, fontWeight: '500', letterSpacing: 0.3 },
  code: { fontFamily: Fonts.mono, fontSize: 12 },
});
