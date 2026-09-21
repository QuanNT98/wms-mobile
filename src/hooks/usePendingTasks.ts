import { useMemo } from 'react';
import { Feather } from '@expo/vector-icons';
import { DB, User } from '@/types';
import { Tone } from '@/theme';
import { canManageWarehouse, isAdmin } from '@/engine/permissions';
import { partnerName, whShort } from '@/utils/labels';
import { useDb } from '@/store/DbContext';

type IconName = keyof typeof Feather.glyphMap;

// "Việc cần làm" = các chứng từ đang chờ CHÍNH user này xác nhận/xử lý.
// Dùng cho badge trên tab và hộp việc trên màn Tổng quan.
export interface PendingTasks {
  ordersIn: number;      // đơn nhập chờ kho đích nhập kho
  ordersOut: number;     // đơn xuất chờ xuất kho / chờ nhận lại hàng trả về (kho nguồn) hoặc chờ xe xác nhận giao (xe)
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
    else if (o.status === 'RETURNING' && can(o.warehouseId)) t.ordersOut++;
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

export interface PendingTask { key: string; icon: IconName; tone: Tone; title: string; sub: string; route: string }

// Gom các chứng từ đang chờ chính user này xử lý thành danh sách "việc cần làm"
export function buildPendingTasks(db: DB, user: User | null): PendingTask[] {
  const out: PendingTask[] = [];
  if (!user) return out;
  const can = (id: string | null | undefined) => canManageWarehouse(user, id);
  const admin = isAdmin(user);

  db.ordersIn.forEach((o) => {
    if (o.status === 'PENDING' && can(o.warehouseId)) out.push({ key: o.id, icon: 'download', tone: 'success', title: `Nhập kho ${o.id}`, sub: `${partnerName(db, o.supplierId)} → ${whShort(db, o.warehouseId)}`, route: '/(app)/(tabs)/orders-in' });
  });
  db.ordersOut.forEach((o) => {
    if (o.status === 'PENDING' && can(o.warehouseId)) out.push({ key: o.id, icon: 'upload', tone: 'warning', title: `Xuất kho ${o.id}`, sub: `${whShort(db, o.warehouseId)} → ${partnerName(db, o.customerId)}${o.deliveryVehicleId ? ` · qua ${whShort(db, o.deliveryVehicleId)}` : ''}`, route: '/(app)/(tabs)/orders-out' });
    else if (o.status === 'LOADED' && can(o.deliveryVehicleId)) out.push({ key: o.id, icon: 'truck', tone: 'primary', title: `Đang giao ${o.id}`, sub: `Giao cho ${partnerName(db, o.customerId)} · xác nhận khi giao xong`, route: '/(app)/(tabs)/orders-out' });
    else if (o.status === 'RETURNING' && can(o.warehouseId)) out.push({ key: o.id, icon: 'corner-down-left', tone: 'orange', title: `Nhận lại hàng ${o.id}`, sub: `Từ ${whShort(db, o.deliveryVehicleId)} trả về · xác nhận đã nhận`, route: '/(app)/(tabs)/orders-out' });
  });
  db.transfers.forEach((t) => {
    if (t.status === 'PENDING' && can(t.toId)) out.push({ key: t.id, icon: 'repeat', tone: 'info', title: `Nhận hàng ${t.id}`, sub: `Từ ${whShort(db, t.fromId)} · xác nhận đã nhận`, route: '/(app)/(tabs)/internal' });
  });
  db.incidents.forEach((inc) => {
    const label = inc.type === 'LOST' ? 'Báo mất' : inc.type === 'DAMAGED' ? 'Báo hỏng' : 'Hoàn trả';
    if (inc.status === 'PENDING' && (inc.type === 'LOST' ? admin : can(inc.targetWarehouseId))) {
      out.push({ key: inc.id, icon: 'alert-triangle', tone: 'orange', title: `${label} ${inc.id}`, sub: `Từ ${whShort(db, inc.warehouseId)} · chờ xác nhận`, route: '/(app)/incidents' });
    } else if (inc.status === 'RECEIVED_DAMAGED' && can(inc.targetWarehouseId)) {
      out.push({ key: inc.id, icon: 'tool', tone: 'warning', title: `Hàng hỏng ${inc.id}`, sub: `Tại ${whShort(db, inc.targetWarehouseId)} · sửa xong hoặc thanh lý`, route: '/(app)/incidents' });
    }
  });
  return out;
}

// Hook cho màn hình: danh sách việc chờ user hiện tại
export function usePendingTasks(): PendingTask[] {
  const { db, user } = useDb();
  return useMemo(() => buildPendingTasks(db, user), [db, user]);
}

export function usePendingTaskCounts(): PendingTasks {
  const { db, user } = useDb();
  return useMemo(() => countPendingTasks(db, user), [db, user]);
}
