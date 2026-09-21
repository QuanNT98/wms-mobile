import { DB, User, Warehouse } from '@/types';

export function isAdmin(u: User | null): boolean {
  return !!u && u.role === 'ADMIN';
}

export function isManagerOf(u: User | null, warehouseId: string | null | undefined): boolean {
  return !!u && u.role === 'MANAGER' && !!warehouseId && u.warehouseId === warehouseId;
}

// Quyền thao tác (tạo đơn / xác nhận) tại 1 vị trí kho-xe cụ thể
export function canManageWarehouse(u: User | null, warehouseId: string | null | undefined): boolean {
  return isAdmin(u) || isManagerOf(u, warehouseId);
}

// Danh sách kho/xe mà user hiện tại được phép chọn làm nguồn/đích khi tạo đơn
export function getManageableWarehouses(db: DB, u: User | null): Warehouse[] {
  if (!u) return [];
  if (u.role === 'ADMIN') return db.warehouses;
  return db.warehouses.filter((w) => w.id === u.warehouseId);
}

// Quyền XEM số liệu tồn kho tại 1 vị trí: admin xem mọi nơi, manager chỉ xem vị trí mình quản lý.
// (Khác với canManageWarehouse ở chỗ dùng cho hiển thị, nhưng hiện tại quy tắc trùng nhau - tách riêng để sau này nới/siết độc lập.)
export function canViewStock(u: User | null, warehouseId: string | null | undefined): boolean {
  return canManageWarehouse(u, warehouseId);
}

// Tồn kho user được phép nhìn thấy - mọi màn hiển thị tồn phải đi qua đây để không lộ số liệu kho khác
export function getVisibleInventory(db: DB, u: User | null): DB['inventory'] {
  if (!u) return [];
  if (u.role === 'ADMIN') return db.inventory;
  return db.inventory.filter((i) => i.warehouseId === u.warehouseId);
}

export function isMobileWarehouse(w: Warehouse | undefined | null): boolean {
  return !!w && (w.type === 'VẬN CHUYỂN' || w.type === 'NHÂN VIÊN GIỮ');
}

export const ADMIN_ONLY_TABS = ['partners', 'fleet', 'products', 'users', 'accounting'] as const;
