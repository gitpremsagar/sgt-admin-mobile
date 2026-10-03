import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Icon, Input, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getErrorMessage } from '@/lib/api/errors';
import { BASE_API_URL } from '@/lib/config';
import { useAuthStore } from '@/stores/auth';
import { UserTypeLabels } from '@/types/auth';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const theme = useTheme();
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const forbiddenUser = useAuthStore((s) => s.user);
  const [serverError, setServerError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Screen contentStyle={styles.content}>
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: theme.primary }]}>
            <Icon name="warehouse" size={34} color={theme.primaryText} />
          </View>
          <ThemedText type="title">SGT Admin</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Sri Gopal Traders · Admin console
          </ThemedText>
        </View>

        {status === 'forbidden' ? (
          <Card style={{ backgroundColor: theme.warningSoft, borderColor: theme.warning }}>
            <ThemedText type="heading" themeColor="warning">
              This app is for admins only
            </ThemedText>
            <ThemedText type="small">
              {forbiddenUser
                ? `${forbiddenUser.email} is signed up as ${UserTypeLabels[forbiddenUser.userType] ?? forbiddenUser.userType}. `
                : ''}
              Please use the web app, or sign in with an admin account.
            </ThemedText>
          </Card>
        ) : null}

        <Card>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                label="Email"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                ref={passwordRef}
                label="Password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
                error={errors.password?.message}
              />
            )}
          />
          {serverError ? (
            <View style={[styles.error, { backgroundColor: theme.dangerSoft }]}>
              <ThemedText type="small" themeColor="danger">
                {serverError}
              </ThemedText>
            </View>
          ) : null}
          <Button title="Log in" icon="login" onPress={onSubmit} loading={isSubmitting} size="lg" />
        </Card>

        <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          Connected to {BASE_API_URL.replace(/^https?:\/\//, '')} (production)
        </ThemedText>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  brand: { alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three },
  logo: {
    width: 68,
    height: 68,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { padding: Spacing.two, borderRadius: Radius.sm },
});
