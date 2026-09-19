import { DB, User } from '../types';
import { canManageWarehouse, isAdmin } from '../engine/permissions';

// "Việc cần làm" = các chứng từ đang chờ CHÍNH user này xác nhận/xử lý.
// Dùng cho badge trên tab và hộp việc trên màn Tổng quan.
export interface PendingTasks {
  ordersIn: number;      // đơn nhập chờ kho đích nhập kho
  ordersOut: number;     // đơn xuất chờ xuất kho (kho nguồn) hoặc chờ xe xác nhận giao (xe)
  transfers: number;     // phiếu chuyển chờ kho đích nhận
  incidents: number;     // báo cáo chờ xác nhận nhận hàng / chờ admin xác nhận mất / hàng hỏng chờ xử lý
  total: number;
}

export function countPendingTasks(db: DB, user: User | null): PendingTasks {
  const t: PendingTasks = { ordersIn: 0, ordersOut: 0, transfers: 0, incidents: 0, total: 0 };
  if (!user) return t;
  const can = (id: string | null | undefined) => canManageWarehouse(user, id);

  db.ordersIn.forEach((o) => { if (o.status === 'PENDING' && can(o.warehouseId)) t.ordersIn++; });
  db.ordersOut.forEach((o) => {
    if (o.status === 'PENDING' && can(o.warehouseId)) t.ordersOut++;
    else if (o.status === 'LOADED' && can(o.deliveryVehicleId)) t.ordersOut++;
  });
  db.transfers.forEach((x) => { if (x.status === 'PENDING' && can(x.toId)) t.transfers++; });
  db.incidents.forEach((inc) => {
    if (inc.status === 'PENDING') {
      if (inc.type === 'LOST' ? isAdmin(user) : can(inc.targetWarehouseId)) t.incidents++;
    } else if (inc.status === 'RECEIVED_DAMAGED' && can(inc.targetWarehouseId)) {
      t.incidents++;
    }
  });
  t.total = t.ordersIn + t.ordersOut + t.transfers + t.incidents;
  return t;
}
