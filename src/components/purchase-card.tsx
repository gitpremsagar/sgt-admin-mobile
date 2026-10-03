import { router } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, Card, Row } from '@/components/ui';
import { formatDate, formatNumber, humanize } from '@/lib/format';
import { purchaseStatusTone } from '@/lib/status';
import type { Purchase } from '@/types/models';

export function purchaseCartons(p: Purchase) {
  return p.PurchaseInvoice.reduce((s, inv) => s + inv.PurchaseInvoiceItem.reduce((a, i) => a + i.quantity, 0), 0);
}

export function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const invoices = purchase.PurchaseInvoice.map((i) => i.invoiceID).filter(Boolean);
  return (
    <Card onPress={() => router.push({ pathname: '/purchases/[id]', params: { id: purchase.id } })}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <ThemedText type="heading">{purchase.vehicleNumber || 'No vehicle'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {purchase.Transporter?.name} · {formatDate(purchase.purchaseDate)}
          </ThemedText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <ThemedText type="heading">{formatNumber(purchaseCartons(purchase))}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            CB
          </ThemedText>
        </View>
      </Row>
      <Row style={{ flexWrap: 'wrap' }}>
        <Badge label={humanize(purchase.purchaseTransportStatus)} tone={purchaseStatusTone(purchase.purchaseTransportStatus)} />
        {purchase.stockAddedAt ? <Badge label="In stock" tone="success" /> : null}
        {purchase.pricingComplete === false ? <Badge label="Pricing pending" tone="warning" /> : null}
        {invoices.length ? <Badge label={invoices.length > 2 ? `${invoices.length} invoices` : invoices.join(', ')} /> : null}
      </Row>
    </Card>
  );
}
