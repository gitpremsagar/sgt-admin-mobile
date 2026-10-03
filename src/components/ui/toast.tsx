import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToastStore } from '@/stores/toast';

import { Icon } from './icon';

export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { message, kind, id, hide } = useToastStore();

  useEffect(() => {
    if (!message) return;
    if (kind === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const t = setTimeout(hide, kind === 'error' ? 4500 : 2500);
    return () => clearTimeout(t);
  }, [id, message, kind, hide]);

  if (!message) return null;
  const bg = kind === 'error' ? theme.danger : kind === 'success' ? theme.success : theme.text;
  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 80 }]}>
      <Pressable onPress={hide} style={[styles.toast, { backgroundColor: bg }]}>
        <Icon
          name={kind === 'error' ? 'error' : kind === 'success' ? 'check_circle' : 'info'}
          size={20}
          color={theme.background}
        />
        <ThemedText type="smallBold" style={{ color: theme.background, flex: 1 }}>
          {message}
        </ThemedText>
      </Pressable>
    </View>
  );
}

export function OfflineBanner() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setOffline(state.isConnected === false);
      }),
    []
  );
  if (!offline) return null;
  return (
    <View style={[styles.offline, { backgroundColor: theme.warning, paddingTop: insets.top + 4 }]}>
      <Icon name="wifi_off" size={16} color="#FFFFFF" />
      <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
        You are offline. Changes will fail until you reconnect.
      </ThemedText>
    </View>
  );
}

/** Native confirm dialog; resolves true when the user confirms. */
export function confirmAction({
  title,
  message,
  confirmLabel = 'Confirm',
  destructive,
}: {
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: Spacing.three, right: Spacing.three, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 4,
    borderRadius: Radius.md,
    maxWidth: 520,
    width: '100%',
    elevation: 4,
  },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingBottom: 6,
  },
});
