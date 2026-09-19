import { Tone } from '../theme';
import { DB, Warehouse } from '../types';

export const whOptions = (list: Warehouse[]) => list.map((w) => ({ value: w.id, label: w.name, sub: `[${w.type}] ${w.id}` }));

export const whName = (db: DB, id: string | null | undefined) => (id ? db.warehouses.find((w) => w.id === id)?.name || id : '-');
// Tên rút gọn để hiển thị trên card/tuyến đi: bỏ phần trong ngoặc và phần sau " - "
export const whShort = (db: DB, id: string | null | undefined) => whName(db, id).split(' (')[0].split(' - ')[0];
export const partnerName = (db: DB, id: string) => db.partners.find((p) => p.id === id)?.name || id;

export const ORDER_IN_STATUS: Record<string, { text: string; tone: Tone }> = {
  PENDING: { text: 'Chờ tiếp nhận', tone: 'amber' },
  RECEIVED: { text: 'Đã nhập kho', tone: 'emerald' },
  CANCELLED: { text: 'Đã hủy', tone: 'slate' },
};

export const ORDER_OUT_STATUS: Record<string, { text: string; tone: Tone }> = {
  PENDING: { text: 'Chờ xuất kho', tone: 'amber' },
  LOADED: { text: 'Đang Giao (Trên Xe)', tone: 'indigo' },
  DELIVERED: { text: 'Đã Giao / Hoàn Tất', tone: 'emerald' },
  CANCELLED: { text: 'Đã hủy', tone: 'slate' },
};

export const TRANSFER_STATUS: Record<string, { text: string; tone: Tone }> = {
  PENDING: { text: 'Đang vận chuyển', tone: 'amber' },
  COMPLETED: { text: 'Hoàn tất', tone: 'emerald' },
  CANCELLED: { text: 'Đã hủy', tone: 'slate' },
};

export const INCIDENT_TYPE: Record<string, { text: string; tone: Tone }> = {
  LOST: { text: 'Báo Mất', tone: 'rose' },
  DAMAGED: { text: 'Báo Hỏng', tone: 'amber' },
  RETURN: { text: 'Hoàn Trả', tone: 'blue' },
};

export const INCIDENT_STATUS: Record<string, { text: string; tone: Tone }> = {
  PENDING: { text: 'Chờ Xử Lý', tone: 'orange' },
  RECEIVED_DAMAGED: { text: 'Đã Nhận - Đang Sửa', tone: 'amber' },
  REPAIRED: { text: 'Đã Sửa - Về Kho', tone: 'emerald' },
  LIQUIDATED: { text: 'Đã Thanh Lý', tone: 'slate' },
  COMPLETED: { text: 'Đã Thu Hồi', tone: 'emerald' },
  CONFIRMED: { text: 'Đã Xác Nhận Mất', tone: 'rose' },
  CANCELLED: { text: 'Đã Hủy', tone: 'slate' },
};

export const WH_TYPE_LABEL: Record<string, string> = {
  CENTRAL: 'Kho tổng',
  SUB: 'Kho chi nhánh',
  YARD: 'Bãi xe / Container',
  'VẬN CHUYỂN': 'Xe vận chuyển',
  'NHÂN VIÊN GIỮ': 'Nhân viên giữ',
};
