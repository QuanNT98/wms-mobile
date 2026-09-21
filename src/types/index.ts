export type Role = 'ADMIN' | 'MANAGER';
export type PartnerType = 'SUPPLIER' | 'CUSTOMER';
export type HoldingType = 'VEHICLE' | 'EQUIPMENT';
export type FixedWarehouseType = 'CENTRAL' | 'SUB' | 'YARD';
// Kho di động sinh tự động từ nhân viên/xe giữ nguyên nhãn tiếng Việt như bản web
export type WarehouseType = FixedWarehouseType | 'VẬN CHUYỂN' | 'NHÂN VIÊN GIỮ';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: Role;
  warehouseId: string | null;
}

export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  phone: string;
  address: string;
}

export interface Driver {
  id: string;
  name: string;
  holdingType?: HoldingType;
  plate: string;
  phone: string;
}

export interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  location: string;
}

export interface Product {
  sku: string;
  name: string;
  unit: string;
  buyPrice: number;
  sellPrice: number;
}

export interface StockItem {
  warehouseId: string;
  sku: string;
  qty: number;
}

export interface OrderItem {
  sku: string;
  qty: number;
  price?: number;
}

export type OrderInStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';
export interface OrderIn {
  id: string;
  timestamp: string;
  supplierId: string;
  warehouseId: string;
  items: OrderItem[];
  status: OrderInStatus;
}

// RETURNING: xe giao không thành, đã bấm trả về – hàng đang trên đường về kho nguồn, chờ kho xác nhận nhận
export type OrderOutStatus = 'PENDING' | 'LOADED' | 'RETURNING' | 'DELIVERED' | 'CANCELLED';
export interface OrderOut {
  id: string;
  timestamp: string;
  warehouseId: string;
  customerId: string;
  items: OrderItem[];
  // null = khách hàng tự đến kho nhận hàng; có giá trị = xe/nhân viên nội bộ giao hàng
  deliveryVehicleId: string | null;
  status: OrderOutStatus;
}

export type TransferStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export interface Transfer {
  id: string;
  timestamp: string;
  fromId: string;
  toId: string;
  items: OrderItem[];
  status: TransferStatus;
  createdBy: string | null;
  confirmedBy: string | null;
}

export type IncidentType = 'LOST' | 'DAMAGED' | 'RETURN';
export type IncidentStatus =
  | 'PENDING'
  | 'RECEIVED_DAMAGED'
  | 'REPAIRED'
  | 'LIQUIDATED'
  | 'COMPLETED'
  | 'CONFIRMED'
  | 'CANCELLED';
export interface Incident {
  id: string;
  timestamp: string;
  warehouseId: string;
  type: IncidentType;
  targetWarehouseId: string | null;
  items: OrderItem[];
  note: string;
  status: IncidentStatus;
  reportedBy: string | null;
  resolvedBy: string | null;
  repairResolvedBy?: string | null;
}

export interface DB {
  users: User[];
  partners: Partner[];
  drivers: Driver[];
  warehouses: Warehouse[];
  products: Product[];
  inventory: StockItem[];
  ordersIn: OrderIn[];
  ordersOut: OrderOut[];
  transfers: Transfer[];
  incidents: Incident[];
  damagedStock: StockItem[];
}
