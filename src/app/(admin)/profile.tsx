import { useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';

import { Button, Card, ErrorState, Input, LoadingState, Screen, Section } from '@/components/ui';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/auth';
import { toast } from '@/stores/toast';
import type { AuthUser } from '@/types/auth';

export default function ProfileScreen() {
  const profile = useQuery({ queryKey: ['profile'], queryFn: authService.getProfile });
  if (profile.isLoading) return <LoadingState />;
  if (profile.error || !profile.data) return <ErrorState error={profile.error} onRetry={profile.refetch} />;
  return <ProfileForm profile={profile.data} />;
}

function ProfileForm({ profile }: { profile: AuthUser }) {
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(profile.name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [email, setEmail] = useState(profile.email ?? '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const save = useApiMutation(
    () => authService.updateProfile({ name: name.trim(), phone: phone.trim() || null, email: email.trim() }),
    { successMessage: 'Profile updated', invalidate: [['profile']], onSuccess: (u) => setUser(u) }
  );

  const changePassword = useApiMutation(
    () => authService.changePassword({ oldPassword, newPassword, confirmNewPassword: confirmPassword }),
    {
      successMessage: 'Password changed',
      onSuccess: () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
    }
  );

  const submitPassword = () => {
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast.error('New password needs 8+ characters, an uppercase letter and a digit.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    changePassword.mutate();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Profile' }} />
      <Section title="Details">
        <Card>
          <Input label="Name" value={name} onChangeText={setName} />
          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Button title="Save profile" onPress={() => save.mutate()} loading={save.isPending} />
        </Card>
      </Section>
      <Section title="Change password">
        <Card>
          <Input label="Current password" value={oldPassword} onChangeText={setOldPassword} secureTextEntry />
          <Input
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            hint="At least 8 characters with an uppercase letter and a digit"
          />
          <Input label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <Button
            title="Change password"
            variant="secondary"
            onPress={submitPassword}
            loading={changePassword.isPending}
            disabled={!oldPassword || !newPassword}
          />
        </Card>
      </Section>
    </Screen>
  );
}
