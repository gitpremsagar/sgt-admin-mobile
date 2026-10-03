/** Ported from frontend bulkEditProductUtils (computeDerivedFields) — keep in sync. */

const r4 = (n: number) => parseFloat(n.toFixed(4));
const r2 = (n: number) => parseFloat(n.toFixed(2));

export interface PricingInput {
  packetsPerCarton?: number;
  gstPercentage?: number;
  costPricePerPacket?: number;
  sellingPricePerPacketForDb?: number;
  sellingPricePerPacketForRss?: number;
  festivePricePerPacket?: number;
}

export function derivePricing(p: PricingInput) {
  const ppc = p.packetsPerCarton;
  const gst = p.gstPercentage;
  const carton = (pkt?: number) => (pkt !== undefined && ppc !== undefined ? r4(pkt * ppc) : undefined);
  const withGst = (v?: number) => (v !== undefined && gst !== undefined ? r4(v * (1 + gst / 100)) : undefined);
  const margin = (sell?: number) =>
    sell !== undefined && p.costPricePerPacket !== undefined && p.costPricePerPacket > 0
      ? r2(((sell - p.costPricePerPacket) / p.costPricePerPacket) * 100)
      : undefined;

  const costPricePerCarton = carton(p.costPricePerPacket);
  const sellingPricePerCartonForDb = carton(p.sellingPricePerPacketForDb);
  const sellingPricePerCartonForRss = carton(p.sellingPricePerPacketForRss);
  const marginPercentageForDb = margin(p.sellingPricePerPacketForDb);
  const marginPercentageForRss = margin(p.sellingPricePerPacketForRss);

  return {
    costPricePerCarton,
    costPricePerPacketWithGst: withGst(p.costPricePerPacket),
    costPricePerCartonWithGst: withGst(costPricePerCarton),
    sellingPricePerCartonForDb,
    sellingPricePerPacketForDbWithGst: withGst(p.sellingPricePerPacketForDb),
    sellingPricePerCartonForDbWithGst: withGst(sellingPricePerCartonForDb),
    sellingPricePerCartonForRss,
    sellingPricePerPacketForRssWithGst: withGst(p.sellingPricePerPacketForRss),
    sellingPricePerCartonForRssWithGst: withGst(sellingPricePerCartonForRss),
    marginPercentageForDb,
    marginPercentageForRss,
    marginDiff:
      marginPercentageForDb !== undefined && marginPercentageForRss !== undefined
        ? r2(marginPercentageForDb - marginPercentageForRss)
        : undefined,
    festivePricePerCarton: carton(p.festivePricePerPacket),
  };
}
