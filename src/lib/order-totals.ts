import type { Order, OrderItem, Product } from '@/types/models';

/** Ported from frontend/src/lib/orders/orderItemInvoiceRates.ts — keep the two in sync. */

function cartonFromPacket(packetRate: number, storedCarton: number, ppc: number | null | undefined) {
  return ppc && ppc > 0 ? parseFloat((packetRate * ppc).toFixed(4)) : storedCarton;
}

function snapshotRates(item: OrderItem): { carton: number; gstPercent: number } | null {
  if (item.gstPercentage === null || item.gstPercentage === undefined) return null;
  const gstPercent = item.gstPercentage ?? 0;
  const ppc = item.packetsPerCarton;
  const finish = (pkt: number, stored: number) => ({ carton: cartonFromPacket(pkt, stored, ppc), gstPercent });

  switch (item.pricingTier) {
    case 'RSS':
      return finish(item.sellingPricePerPacketForRss ?? 0, item.sellingPricePerCartonForRss ?? 0);
    case 'SS':
      return finish(item.costPricePerPacket ?? 0, item.costPricePerCarton ?? 0);
    case 'DB':
      return finish(item.sellingPricePerPacketForDb ?? 0, item.sellingPricePerCartonForDb ?? 0);
  }
  if (item.sellingPricePerCartonForRss != null)
    return finish(item.sellingPricePerPacketForRss ?? 0, item.sellingPricePerCartonForRss);
  if (item.costPricePerCarton != null) return finish(item.costPricePerPacket ?? 0, item.costPricePerCarton);
  if (item.sellingPricePerCartonForDb != null)
    return finish(item.sellingPricePerPacketForDb ?? 0, item.sellingPricePerCartonForDb);
  if (item.sellingPricePerPacketForRss != null)
    return finish(item.sellingPricePerPacketForRss, item.sellingPricePerCartonForRss ?? 0);
  if (item.costPricePerPacket != null) return finish(item.costPricePerPacket, item.costPricePerCarton ?? 0);
  if (item.sellingPricePerPacketForDb != null)
    return finish(item.sellingPricePerPacketForDb, item.sellingPricePerCartonForDb ?? 0);
  return null;
}

export function catalogCartonRate(product: Partial<Product> | null | undefined, dbCategory: string) {
  if (!product) return { carton: 0, gstPercent: 0 };
  let pkt: number;
  let stored: number;
  if (dbCategory === 'RSS') {
    pkt = product.sellingPricePerPacketForRss ?? 0;
    stored = product.sellingPricePerCartonForRss ?? 0;
  } else if (dbCategory === 'SS') {
    pkt = product.costPricePerPacket ?? 0;
    stored = product.costPricePerCarton ?? 0;
  } else {
    pkt = product.sellingPricePerPacketForDb ?? 0;
    stored = product.sellingPricePerCartonForDb ?? 0;
  }
  return { carton: cartonFromPacket(pkt, stored, product.packetsPerCarton), gstPercent: product.gstPercentage ?? 0 };
}

export interface LineTotals {
  item: OrderItem;
  cartonRate: number;
  gstPercent: number;
  basic: number;
  scheme: number;
  itemDiscount: number;
  taxable: number;
  gst: number;
  total: number;
}

export interface OrderTotals {
  lines: LineTotals[];
  basic: number;
  scheme: number;
  itemDiscount: number;
  taxable: number;
  gst: number;
  cashDiscount: number;
  invoiceValue: number;
  netChargeable: number;
  cartons: number;
}

export function orderDbCategory(order: Pick<Order, 'Customer'>) {
  return order.Customer?.CustomerDetail?.[0]?.dbCategory ?? 'DISTRIBUTOR';
}

export function computeOrderTotals(order: Order): OrderTotals {
  const dbCategory = orderDbCategory(order);
  const lines = (order.OrderItem ?? []).map<LineTotals>((item) => {
    const rates = snapshotRates(item) ?? catalogCartonRate(item.Product, dbCategory);
    const basic = item.quantity * rates.carton;
    const scheme = (basic * (item.schemeDiscountPercent ?? 0)) / 100;
    const itemDiscount = (basic * (item.itemDiscountPercent ?? 0)) / 100;
    const taxable = basic - scheme - itemDiscount;
    const gst = (taxable * rates.gstPercent) / 100;
    return {
      item,
      cartonRate: rates.carton,
      gstPercent: rates.gstPercent,
      basic,
      scheme,
      itemDiscount,
      taxable,
      gst,
      total: taxable + gst,
    };
  });
  const sum = (k: keyof Omit<LineTotals, 'item'>) => lines.reduce((acc, l) => acc + l[k], 0);
  const taxable = sum('taxable');
  const cashDiscount = (taxable * (order.cashDiscountPercent ?? 0)) / 100;
  const invoiceValue = sum('total') - cashDiscount;
  return {
    lines,
    basic: sum('basic'),
    scheme: sum('scheme'),
    itemDiscount: sum('itemDiscount'),
    taxable,
    gst: sum('gst'),
    cashDiscount,
    invoiceValue,
    netChargeable: invoiceValue + (order.ledgerBalance ?? 0),
    cartons: lines.reduce((acc, l) => acc + l.item.quantity, 0),
  };
}
