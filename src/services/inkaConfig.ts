/**
 * IDs trên inka.vn cho app này. Do `node scripts/setup-inka.mjs` ghi vào
 * (chạy ở mạng tới được inka.vn cổng 8000–8063, ví dụ 4G).
 *
 * Khi dbId rỗng, app chạy như cũ: dữ liệu chỉ lưu trên máy.
 */
import type { DB } from '@/types';

export type Collection = keyof DB;

export const INKA: { dbId: string; tables: Record<Collection, string> } = {
  dbId: '00000000001dc180',
  tables: {
    users: '00000000001dc200',
    partners: '00000000001dc280',
    drivers: '00000000001dc300',
    warehouses: '00000000001dc380',
    products: '00000000001dc400',
    inventory: '00000000001dc480',
    ordersIn: '00000000001dc500',
    ordersOut: '00000000001dc580',
    transfers: '00000000001dc600',
    incidents: '00000000001dc680',
    damagedStock: '00000000001dc700',
  },
};

export const serverEnabled = () => INKA.dbId !== '';
