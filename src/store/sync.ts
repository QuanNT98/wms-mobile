/**
 * Đồng bộ DB của app với inka.vn.
 *
 * Mỗi phần tử (kho, sản phẩm, dòng tồn, chứng từ…) là một dòng trong bảng cùng tên, kèm:
 *   _key  khoá nghiệp vụ (id, sku, hoặc "kho|sku")
 *   _seq  thứ tự trong danh sách
 *   _ts   thời điểm ghi – khi hai máy cùng tạo một khoá, dòng ghi sau thắng
 *   _rec  id gốc của chính dòng đó, để máy khác sửa lại được (xem updateRow)
 *   _del  true = đã xoá. Không xoá dòng thật: xoá dòng làm hỏng bảng trên server này.
 *
 * Bảng `users` không chứa mật khẩu: mật khẩu do tài khoản inka giữ (xem services/inka.ts).
 */
import type { DB } from '@/types';
import { createRow, listRows, updateRow, type Row } from '@/services/inka';
import { INKA, type Collection } from '@/services/inkaConfig';

type Entity = Record<string, unknown>;

export const COLLECTIONS: Collection[] = [
  'users', 'partners', 'drivers', 'warehouses', 'products', 'inventory',
  'ordersIn', 'ordersOut', 'transfers', 'incidents', 'damagedStock',
];

// Chứng từ hiển thị mới nhất trước (engine dùng unshift); danh mục và tồn kho giữ thứ tự thêm vào
const NEWEST_FIRST: Collection[] = ['ordersIn', 'ordersOut', 'transfers', 'incidents'];

export function keyOf(collection: Collection, e: Entity): string {
  if (collection === 'products') return String(e.sku);
  if (collection === 'inventory' || collection === 'damagedStock') return `${e.warehouseId}|${e.sku}`;
  return String(e.id);
}

/** Dòng đang giữ từng khoá trên server. */
export interface RowRef {
  rec: string;
  seq: number;
  deleted: boolean;
}
export type Refs = Record<Collection, Map<string, RowRef>>;

export const emptyRefs = (): Refs => Object.fromEntries(COLLECTIONS.map((c) => [c, new Map<string, RowRef>()])) as Refs;

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);

/** Các dòng của một bảng → danh sách phần tử còn sống + bảng tra dòng theo khoá. */
export function rowsToEntities(collection: Collection, rows: Row[]): { entities: Entity[]; refs: Map<string, RowRef> } {
  const latest = new Map<string, Row>();
  for (const row of rows) {
    const key = typeof row.content._key === 'string' ? row.content._key : '';
    if (!key) continue;
    const seen = latest.get(key);
    if (!seen || num(row.content._ts) >= num(seen.content._ts)) latest.set(key, row);
  }
  const refs = new Map<string, RowRef>();
  const live: { seq: number; entity: Entity }[] = [];
  for (const [key, row] of latest) {
    const { _key, _seq, _ts, _rec, _del, ...entity } = row.content;
    if (collection === 'users') entity.password = '';
    const seq = num(_seq);
    const deleted = _del === true;
    refs.set(key, { rec: typeof _rec === 'string' && _rec ? _rec : row.rc_id, seq, deleted });
    if (!deleted) live.push({ seq, entity });
  }
  const dir = NEWEST_FIRST.includes(collection) ? -1 : 1;
  live.sort((a, b) => dir * (a.seq - b.seq));
  return { entities: live.map((x) => x.entity), refs };
}

export interface Change {
  collection: Collection;
  key: string;
  /** null = phần tử bị xoá */
  entity: Entity | null;
}

/** Những phần tử khác nhau giữa hai trạng thái DB. */
export function diffDb(prev: DB, next: DB): Change[] {
  const changes: Change[] = [];
  for (const collection of COLLECTIONS) {
    const before = new Map((prev[collection] as unknown as Entity[]).map((e) => [keyOf(collection, e), JSON.stringify(e)]));
    const after = next[collection] as unknown as Entity[];
    const kept = new Set<string>();
    for (const entity of after) {
      const key = keyOf(collection, entity);
      kept.add(key);
      if (before.get(key) !== JSON.stringify(entity)) changes.push({ collection, key, entity });
    }
    for (const key of before.keys()) if (!kept.has(key)) changes.push({ collection, key, entity: null });
  }
  return changes;
}

const withoutPassword = ({ password: _password, ...rest }: Entity): Entity => rest;

/** Tải toàn bộ DB từ server. */
export async function pull(): Promise<{ db: DB; refs: Refs }> {
  const results = await Promise.all(COLLECTIONS.map(async (c) => rowsToEntities(c, await listRows(INKA.tables[c]))));
  const db = {} as Record<Collection, unknown>;
  const refs = emptyRefs();
  COLLECTIONS.forEach((c, i) => {
    db[c] = results[i].entities;
    refs[c] = results[i].refs;
  });
  return { db: db as unknown as DB, refs };
}

/**
 * Đẩy các thay đổi lên server, lần lượt từng dòng. `refs` được cập nhật ngay khi một dòng ghi xong,
 * nên nếu đứt giữa chừng thì lần đẩy lại chỉ sửa tiếp, không tạo dòng trùng.
 */
export async function push(changes: Change[], refs: Refs): Promise<void> {
  let seq = Date.now();
  for (const { collection, key, entity: raw } of changes) {
    const entity = raw && collection === 'users' ? withoutPassword(raw) : raw;
    const ref = refs[collection].get(key);
    if (!entity) {
      if (!ref || ref.deleted) continue;
      await updateRow(ref.rec, { _key: key, _seq: ref.seq, _ts: Date.now(), _rec: ref.rec, _del: true });
      ref.deleted = true;
    } else if (ref) {
      await updateRow(ref.rec, { ...entity, _key: key, _seq: ref.seq, _ts: Date.now(), _rec: ref.rec });
      ref.deleted = false;
    } else {
      const s = seq++;
      const rec = await createRow(INKA.tables[collection], { ...entity, _key: key, _seq: s, _ts: Date.now() });
      refs[collection].set(key, { rec, seq: s, deleted: false });
    }
  }
}
