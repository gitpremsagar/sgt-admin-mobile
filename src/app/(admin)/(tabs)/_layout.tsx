import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Dashboard', icon: 'dashboard' },
  { name: 'orders', title: 'Orders', icon: 'receipt_long' },
  { name: 'stock', title: 'Stock', icon: 'inventory_2' },
  { name: 'purchase', title: 'Purchase', icon: 'local_shipping' },
  { name: 'more', title: 'More', icon: 'more_horiz' },
];

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        sceneStyle: { backgroundColor: theme.background },
      }}>
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => <Icon name={t.icon} color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
