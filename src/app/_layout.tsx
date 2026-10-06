import { QueryClientProvider } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner, ToastHost } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth';

SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const palette = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    <View style={[styles.crash, { backgroundColor: palette.background }]}>
      <Image source={require('@/assets/images/logo.png')} style={styles.crashLogo} contentFit="contain" />
      <Text style={[styles.crashTitle, { color: palette.text }]}>Something went wrong</Text>
      <Text style={[styles.crashMessage, { color: palette.textSecondary }]} numberOfLines={6}>
        {error.message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={retry}
        style={({ pressed }) => [styles.crashButton, { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={[styles.crashButtonText, { color: palette.primaryText }]}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  const palette = Colors[isDark ? 'dark' : 'light'];
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.card,
      text: palette.text,
      border: palette.border,
    },
  };

  if (status === 'loading') return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={navTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <View style={{ flex: 1, backgroundColor: palette.background }}>
              <OfflineBanner />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Protected guard={status === 'authed'}>
                  <Stack.Screen name="(admin)" />
                </Stack.Protected>
                <Stack.Protected guard={status !== 'authed'}>
                  <Stack.Screen name="(auth)" />
                </Stack.Protected>
              </Stack>
              <ToastHost />
            </View>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  crash: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  crashLogo: { width: 96, height: 96, marginBottom: 8 },
  crashTitle: { fontSize: 20, fontWeight: '700' },
  crashMessage: { fontSize: 14, textAlign: 'center' },
  crashButton: { marginTop: 12, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  crashButtonText: { fontSize: 16, fontWeight: '600' },
});
