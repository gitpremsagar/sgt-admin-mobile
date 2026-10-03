import { router } from 'expo-router';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, Card, Row } from '@/components/ui';
import { customerName } from '@/hooks/api/lookups';
import { formatCurrency, formatDate } from '@/lib/format';
import { computeOrderTotals } from '@/lib/order-totals';
import { orderStatusLabel, orderStatusTone } from '@/lib/status';
import type { Order } from '@/types/models';

export function OrderCard({ order }: { order: Order }) {
  const totals = computeOrderTotals(order);
  return (
    <Card onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })}>
      <Row style={{ justifyContent: 'space-between' }}>
        <ThemedText type="heading" style={{ flex: 1 }} numberOfLines={1}>
          {customerName(order.Customer)}
        </ThemedText>
        <ThemedText type="heading" style={{ flexShrink: 0 }}>
          {formatCurrency(totals.invoiceValue)}
        </ThemedText>
      </Row>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>
          #{order.customeOrderId} · {formatDate(order.orderDate)}
        </ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary" style={{ flexShrink: 0 }}>
          {totals.cartons} CB
        </ThemedText>
      </Row>
      <Row style={{ flexWrap: 'wrap' }}>
        <Badge label={orderStatusLabel(order.OrderStatusType)} tone={orderStatusTone(order.OrderStatusType?.name)} />
        {order.isVerifiedByAdmin ? <Badge label="Verified" tone="success" /> : <Badge label="Draft" tone="warning" />}
        {order.Vehicle?.vehicleNumber ? <Badge label={order.Vehicle.vehicleNumber} /> : null}
        {order.tallyInvoiceId ? <Badge label={order.tallyInvoiceId} tone="info" /> : null}
      </Row>
      {order.OrderCreator ? (
        <View>
          <ThemedText type="caption" themeColor="textSecondary">
            Created by {order.OrderCreator.name}
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );
}
