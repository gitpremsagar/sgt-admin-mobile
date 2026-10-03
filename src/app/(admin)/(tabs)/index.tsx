import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { BarList } from '@/components/bar-list';
import { ThemedText } from '@/components/themed-text';
import {
  Card,
  ErrorState,
  FilterChips,
  KeyValue,
  ListRow,
  Row,
  Screen,
  Section,
  Skeleton,
  StatCard,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { qk } from '@/hooks/api/lookups';
import { financialYearOf, formatCompactCurrency, formatDate, formatNumber, recentFinancialYears } from '@/lib/format';
import { dashboardService } from '@/services/dashboard';
import { useAuthStore } from '@/stores/auth';

const LINKS: { title: string; href: string; subtitle: string }[] = [
  { title: 'Month-wise sales', href: '/dashboard/month-wise-sales', subtitle: 'Targets, tally and DMS by month' },
  { title: 'Month-wise purchases', href: '/dashboard/month-wise-purchases', subtitle: 'Purchase targets vs achieved' },
  { title: 'Shipment vs achieve', href: '/dashboard/shipment-vs-achieve', subtitle: 'Quarterly shipment targets' },
  { title: 'SS / DB forecast', href: '/dashboard/forecasts', subtitle: 'Forecast vs achieved by party' },
  { title: 'Near expiry', href: '/dashboard/near-expiry', subtitle: 'Batches expiring in 30 days' },
  { title: 'Actual stock', href: '/dashboard/actual-stock', subtitle: 'Cartons on hand by product' },
];

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [fy, setFy] = useState(financialYearOf());
  const summary = useQuery({
    queryKey: [...qk.dashboard, 'summary', fy],
    queryFn: () => dashboardService.summary(fy),
  });

  const data = summary.data;
  const quarterly = data?.currentFinancialYear.quarterly ?? [];

  return (
    <Screen refreshing={summary.isRefetching} onRefresh={summary.refetch}>
      <View>
        <ThemedText type="small" themeColor="textSecondary">
          Welcome back
        </ThemedText>
        <ThemedText type="title">{user?.name?.split(' ')[0] ?? 'Admin'}</ThemedText>
      </View>

      <FilterChips
        options={recentFinancialYears(4).map((y) => ({ value: y, label: `FY ${y}` }))}
        value={fy}
        onChange={setFy}
      />

      {summary.isLoading ? (
        <Skeleton height={90} count={3} />
      ) : summary.error ? (
        <ErrorState error={summary.error} onRetry={summary.refetch} />
      ) : data ? (
        <>
          <Row style={{ flexWrap: 'wrap', alignItems: 'stretch' }}>
            <StatCard
              label="Till-date sale (month)"
              value={formatCompactCurrency(data.currentMonth.tillDateSale)}
              sub="Tap for orders"
              icon="trending_up"
              tone="success"
              onPress={() => router.push('/dashboard/till-date-sale')}
            />
            <StatCard
              label="Till-date purchase"
              value={formatCompactCurrency(data.currentMonth.tillDatePurchase)}
              sub="Tap for vehicles"
              icon="local_shipping"
              tone="info"
              onPress={() => router.push('/dashboard/till-date-purchase')}
            />
          </Row>

          <Section title={`Quarterly targets · FY ${data.currentFinancialYear.year}`}>
            <Card>
              {quarterly.length ? (
                <BarList
                  data={quarterly.map((q) => ({
                    label: q.quarter,
                    value: q.achieved,
                    secondary: q.target,
                    display: `${formatCompactCurrency(q.achieved)} / ${formatCompactCurrency(q.target)}`,
                  }))}
                  secondaryLabel="target"
                />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  No targets set.
                </ThemedText>
              )}
            </Card>
          </Section>

          <Section title="Month-wise sales">
            <Card onPress={() => router.push('/dashboard/month-wise-sales')}>
              <BarList
                data={data.monthWiseSales.map((m) => ({ label: m.month, value: m.value }))}
                format={formatCompactCurrency}
              />
            </Card>
          </Section>

          <Section title="Near expiry (top 5)">
            <Card onPress={() => router.push('/dashboard/near-expiry')}>
              {data.reports.nearExpiryProducts.length ? (
                data.reports.nearExpiryProducts.slice(0, 5).map((b) => (
                  <KeyValue
                    key={b.id}
                    label={`${b.product.name} (${b.product.productCode})`}
                    value={`${formatNumber(b.stockQuantity)} · ${formatDate(b.expiryDate)}`}
                  />
                ))
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  Nothing expiring in the next 30 days.
                </ThemedText>
              )}
            </Card>
          </Section>
        </>
      ) : null}

      <Section title="Reports">
        <View style={{ gap: Spacing.two }}>
          {LINKS.map((l) => (
            <ListRow key={l.href} title={l.title} subtitle={l.subtitle} onPress={() => router.push(l.href as Href)} />
          ))}
        </View>
      </Section>
    </Screen>
  );
}
