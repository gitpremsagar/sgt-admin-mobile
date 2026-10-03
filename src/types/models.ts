/** API models, trimmed to the fields the mobile app reads. Ported from frontend/src/lib/types. */

export interface PaginationA {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginationB {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export type DbCategory = 'RSS' | 'DISTRIBUTOR' | 'SS' | 'WB' | 'CHK' | 'OTHER';

export interface CustomerDetail {
  id: string;
  dbUserId?: string;
  dbName: string;
  dbCategory: DbCategory;
  email?: string;
  area?: string;
  state?: string;
  address?: string;
  pincode?: string | null;
  vehicleType?: string | null;
  panNumber?: string | null;
  gstinNumber?: string | null;
  salesOfficerName?: string | null;
  salesOfficerContact?: string | null;
  contact2?: string | null;
  creditLimit?: number;
  paymentTerms?: 'ADVANCE' | 'ONE_BILL_CREDIT';
  isCashDiscountAllowed?: boolean;
  cashDiscountPercentage?: 'POINT_5' | 'POINT_75' | null;
  twoSideDistance?: number;
  partyReportTagId?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  userType?: string;
  CustomerDetail: CustomerDetail[];
}

export interface DeliveryAddress {
  id: string;
  userId: string;
  default: boolean;
  address: string;
  twoSideDistance: number;
  pincode: string;
  state: string;
  area: string;
  vehicleType: string;
}

export interface VehicleType {
  id: string;
  name: string;
}

export interface Vehicle {
  id: string;
  vehicleName: string;
  vehicleNumber: string;
  vehicleTypeId: string;
  capacity: number;
  mileage: number | null;
  VehicleType?: VehicleType | null;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  userType: string;
  department?: 'WAREHOUSE' | 'ADMINISTRATION' | null;
  warehouseCategory?: 'STAFF' | 'DRIVER' | 'LABOR' | 'WB_LABOR' | null;
  createdAt?: string;
}

export interface OrderStatusType {
  id: string;
  name: string;
  displayName: string | null;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  position?: number;
}

export interface NamedEntity {
  id: string;
  name: string;
}

export interface ProductScheme {
  id: string;
  productId: string;
  schemePercentage?: number | null;
  slab1MinCb?: number | null;
  slab1MaxCb?: number | null;
  slab1Percent?: number | null;
  slab2MinCb?: number | null;
  slab2MaxCb?: number | null;
  slab2Percent?: number | null;
  slab3MinCb?: number | null;
  slab3MaxCb?: number | null;
  slab3Percent?: number | null;
  slab4MinCb?: number | null;
  slab4MaxCb?: number | null;
  slab4Percent?: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  Product?: { id: string; name: string; productCode: string };
}

export interface ProductPrices {
  gstPercentage?: number | null;
  packetsPerCarton?: number | null;
  costPricePerPacket?: number | null;
  costPricePerPacketWithGst?: number | null;
  costPricePerCarton?: number | null;
  costPricePerCartonWithGst?: number | null;
  sellingPricePerPacketForDb?: number | null;
  sellingPricePerPacketForDbWithGst?: number | null;
  sellingPricePerCartonForDb?: number | null;
  sellingPricePerCartonForDbWithGst?: number | null;
  marginPercentageForDb?: number | null;
  sellingPricePerPacketForRss?: number | null;
  sellingPricePerPacketForRssWithGst?: number | null;
  sellingPricePerCartonForRss?: number | null;
  sellingPricePerCartonForRssWithGst?: number | null;
  marginPercentageForRss?: number | null;
  marginDiff?: number | null;
  festivePricePerPacket?: number | null;
  festivePricePerCarton?: number | null;
}

export interface StockBatch {
  id: string;
  productId?: string;
  manufacturingDate: string;
  arrivalDate: string;
  expiryDate: string;
  stockQuantity: number;
  isArchived?: boolean;
  reservedQuantity?: number;
  inWarehouseQuantity?: number;
  PurchaseInvoice?: { id: string; invoiceID: string | null; invoiceDate: string | null } | null;
  reservedOrders?: {
    orderId: string;
    orderNo: string;
    dbName: string;
    orderDate: string;
    orderStatusTypeName: string;
    reservedQuantity: number;
  }[];
}

export interface Product extends ProductPrices {
  id: string;
  name: string;
  mrp: number;
  productCode: string;
  lowStockLimit: number;
  overStockLimit: number;
  categoryId: string;
  subCategoryId?: string | null;
  productGroupId?: string | null;
  plantId?: string | null;
  grammage?: number;
  lifeOfProduct?: number | null;
  imageUrl?: string | null;
  cartonsPerPallet?: number | null;
  schemePercentage?: number | null;
  isDiscontinued?: boolean;
  tallyQuantity?: number | null;
  dmsQuantity?: number | null;
  Category?: Category;
  SubCategory?: NamedEntity | null;
  ProductGroup?: NamedEntity | null;
  Plant?: NamedEntity | null;
  ProductTagRelation?: { id: string; productTagId: string; ProductTag: NamedEntity }[];
  ProductScheme?: ProductScheme[];
  StockBatch?: StockBatch[];
  stockQuantity?: number;
  nearestExpiryDate?: string | null;
  oldestArrivalDate?: string | null;
  lastOrderDate?: string | null;
}

export type PricingTier = 'RSS' | 'SS' | 'DB';

export interface OrderItem {
  id: string;
  orderId?: string;
  productId: string;
  quantity: number;
  schemeDiscountPercent?: number | null;
  itemDiscountPercent?: number | null;
  pricingTier?: PricingTier | null;
  gstPercentage?: number | null;
  packetsPerCarton?: number | null;
  costPricePerCarton?: number | null;
  costPricePerPacket?: number | null;
  sellingPricePerCartonForDb?: number | null;
  sellingPricePerPacketForDb?: number | null;
  sellingPricePerCartonForRss?: number | null;
  sellingPricePerPacketForRss?: number | null;
  isFestivePrice?: boolean | null;
  Product?: Product;
}

export interface Order {
  id: string;
  customeOrderId: string;
  orderDate: string;
  deliveryDate?: string | null;
  completionDate?: string | null;
  customerId: string;
  vehicleId: string | null;
  deliveryAddressId: string | null;
  driverId: string | null;
  orderStatusTypeId?: string | null;
  isVerifiedByAdmin?: boolean | null;
  verifiedAt?: string | null;
  discountPercent?: number | null;
  cashDiscountPercent?: number | null;
  ledgerBalance?: number | null;
  narration?: string | null;
  tallyInvoiceId?: string | null;
  receivingStatus?: 'PENDING' | 'RECEIVED';
  createdAt?: string;
  Customer: Customer;
  DeliveryAddress?: DeliveryAddress | null;
  OrderCreator?: { id: string; name: string; userType: string } | null;
  OrderStatusType?: OrderStatusType | null;
  Driver?: { id: string; name: string } | null;
  Vehicle: (Partial<Vehicle> & { vehicleNumber: string }) | null;
  OrderItem: OrderItem[];
}

export interface OrderItemScheme {
  orderItemId: string;
  productId: string;
  quantity: number;
  scheme: (ProductScheme & { effectivePercentage: number }) | null;
}

export type PurchaseTransportStatus =
  | 'PENDING'
  | 'LOADING'
  | 'LOADED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'UNLOADING'
  | 'UNLOADED'
  | 'EXITED'
  | 'COMPLETED';

export interface Transporter {
  id: string;
  name: string;
  transporterContact: string | null;
  area: string | null;
}

export interface PurchaseInvoiceItem {
  id: string;
  productId: string;
  quantity: number;
  palletQuantity?: number;
  mrp?: number | null;
  costPricePerCarton?: number | null;
  gstPercentage?: number | null;
  product: { id: string; name: string; productCode: string; mrp?: number };
}

export interface PurchaseInvoice {
  id: string;
  invoiceID: string | null;
  invoiceDate: string | null;
  invoiceAmount: number | null;
  PurchaseInvoiceItem: PurchaseInvoiceItem[];
}

export interface Purchase {
  id: string;
  purchaseDate: string;
  markedArrivedAt?: string | null;
  TargetUnloadingDate?: string | null;
  markedUnloadingAt?: string | null;
  markedUnloadedAt?: string | null;
  VehicleExitedAt?: string | null;
  markedCompletedAt?: string | null;
  stockAddedAt?: string | null;
  StockAddedByUser?: { id: string; name: string } | null;
  transporterId: string;
  vehicleNumber: string | null;
  driverContact: string | null;
  grnNumber?: string | null;
  purchaseTransportStatus: PurchaseTransportStatus;
  pricingComplete?: boolean;
  Transporter: Transporter;
  PurchaseInvoice: PurchaseInvoice[];
  stockBatches?: (StockBatch & { product: { id: string; name: string; productCode: string } })[];
}

export interface ReturnItem {
  id: string;
  productId: string;
  quantity: number;
  Product: { id: string; name: string; productCode: string };
}

export interface SalesReturn {
  id: string;
  customerId: string;
  orderId: string;
  returnDate: string;
  returnReason: string;
  customer: { id: string; name: string; CustomerDetail: { dbName: string; dbCategory: DbCategory }[] };
  order: { id: string; customeOrderId: string; orderDate: string };
  SalesReturnItem: ReturnItem[];
}

export interface CreditNote {
  id: string;
  customerId: string;
  orderId: string;
  noteDate: string;
  noteReason: string;
  customer: { id: string; name: string; CustomerDetail: { dbName: string; dbCategory: DbCategory }[] };
  order: { id: string; customeOrderId: string; orderDate: string };
  CreditNoteItem: ReturnItem[];
}

export interface DispatchTrip {
  id: string;
  tripNumber: number;
  tripDate: string;
  distributorId: string | null;
  orderId: string | null;
  vehicleId: string | null;
  driverId: string | null;
  remarks: string | null;
  vehiclePosition: number | null;
  Vehicle: Vehicle | null;
  Order: { id: string; customeOrderId: string } | null;
  Distributor: { id: string; name: string } | null;
  Driver: { id: string; name: string; phone?: string | null } | null;
}

export interface PendingDistributor {
  id: string;
  distributorId: string;
  remarks: string | null;
  sortOrder: number;
  Distributor: { id: string; name: string; CustomerDetail: { dbName: string }[] };
}
