import * as Application from 'expo-application';
import { router, type Href } from 'expo-router';
import * as Updates from 'expo-updates';
import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, ListRow, Screen, Section, confirmAction, type IconName } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { WEB_URL } from '@/lib/config';
import { useAuthStore } from '@/stores/auth';
import { UserTypeLabels } from '@/types/auth';

type Item = { title: string; href: string; icon: IconName; subtitle?: string };

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Returns',
    items: [
      { title: 'Sales returns', href: '/sales-returns', icon: 'assignment_return' },
      { title: 'Credit notes', href: '/credit-notes', icon: 'credit_card' },
    ],
  },
  {
    title: 'Dispatch',
    items: [{ title: 'Dispatch trips', href: '/dispatch-trips', icon: 'route', subtitle: 'Trips and pending distributors' }],
  },
  {
    title: 'Reports',
    items: [
      { title: 'Forecasts', href: '/reports/forecasts', icon: 'trending_up' },
      { title: 'Sales history', href: '/reports/sales-history', icon: 'history' },
      { title: 'Party-wise sales', href: '/reports/party-wise-sales', icon: 'groups' },
      { title: 'Product vehicle-wise', href: '/reports/product-vehicle-wise', icon: 'directions_car' },
      { title: 'Purchase history', href: '/reports/purchase-history', icon: 'receipt' },
      { title: 'Stock status', href: '/reports/stock-status', icon: 'inventory' },
      { title: 'Product allocation', href: '/reports/product-allocation', icon: 'assignment' },
      { title: 'Fuel consumption', href: '/reports/fuel-consumption', icon: 'local_gas_station' },
    ],
  },
  {
    title: 'Attendance',
    items: [
      { title: 'Warehouse today', href: '/attendance', icon: 'punch_clock' },
      { title: 'Monthly register', href: '/attendance/monthly', icon: 'calendar_month' },
      { title: 'Employee records', href: '/attendance/employees', icon: 'badge' },
      { title: 'Attendance settings', href: '/attendance/settings', icon: 'schedule' },
    ],
  },
  {
    title: 'Dashboard extras',
    items: [
      { title: 'Contacts', href: '/dashboard/contacts', icon: 'contacts' },
      { title: 'Documents', href: '/dashboard/documents', icon: 'folder' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { title: 'Categories', href: '/settings/categories', icon: 'category' },
      { title: 'Sub-categories', href: '/settings/subcategories', icon: 'category' },
      { title: 'Product tags', href: '/settings/product-tags', icon: 'sell' },
      { title: 'Product groups', href: '/settings/product-groups', icon: 'local_offer' },
      { title: 'Plants', href: '/settings/plants', icon: 'store' },
      { title: 'Party report tags', href: '/settings/party-tags', icon: 'local_offer' },
      { title: 'Distributors', href: '/settings/distributors', icon: 'storefront' },
      { title: 'Employees', href: '/settings/employees', icon: 'group' },
      { title: 'Sales officers', href: '/settings/sales-officers', icon: 'how_to_reg' },
      { title: 'Vehicles', href: '/settings/vehicles', icon: 'local_shipping' },
      { title: 'Vehicle types', href: '/settings/vehicle-types', icon: 'directions_car' },
      { title: 'Order status types', href: '/settings/order-status-types', icon: 'fact_check' },
      { title: 'Transporters', href: '/settings/transporters', icon: 'local_shipping' },
      { title: 'Tally invoice', href: '/settings/tally-invoice', icon: 'receipt_long' },
      { title: 'Stock records', href: '/settings/stock-records', icon: 'swap_horiz' },
    ],
  },
];

export default function MoreScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <Screen>
      <Card onPress={() => router.push('/profile')}>
        <ThemedText type="subtitle">{user?.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {user?.email} · {user ? UserTypeLabels[user.userType] : ''}
        </ThemedText>
      </Card>

      {SECTIONS.map((section) => (
        <Section key={section.title} title={section.title}>
          <View style={{ gap: Spacing.two }}>
            {section.items.map((item) => (
              <ListRow
                key={item.href}
                title={item.title}
                subtitle={item.subtitle}
                icon={item.icon}
                onPress={() => router.push(item.href as Href)}
              />
            ))}
          </View>
        </Section>
      ))}

      <Section title="Account">
        <View style={{ gap: Spacing.two }}>
          <ListRow title="Profile and password" icon="person" onPress={() => router.push('/profile')} />
          <ListRow
            title="Open web admin"
            subtitle="Bulk edits, CSV imports, order sheet v2, purchase workbook"
            icon="open_in_new"
            onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/admin`)}
          />
          <ListRow
            title="Privacy policy"
            icon="privacy_tip"
            onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/privacy`)}
          />
          <ListRow
            title="Log out"
            icon="logout"
            danger
            chevron={false}
            onPress={async () => {
              if (await confirmAction({ title: 'Log out?', confirmLabel: 'Log out', destructive: true })) {
                await logout();
              }
            }}
          />
        </View>
      </Section>

      <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
        {versionLabel()}
      </ThemedText>
    </Screen>
  );
}

function versionLabel() {
  const parts = [`SGT Admin v${Application.nativeApplicationVersion ?? '—'} (${Application.nativeBuildVersion ?? '—'})`];
  if (Updates.updateId && !Updates.isEmbeddedLaunch) parts.push(`update ${Updates.updateId.slice(0, 8)}`);
  if (Updates.channel) parts.push(Updates.channel);
  return parts.join(' · ');
}
