import { diffDb, emptyRefs, keyOf, push, rowsToEntities } from '@/store/sync';
import { makeBlankData } from '@/data/initialData';
import { createRow, updateRow } from '@/services/inka';
import type { DB, User } from '@/types';

// Không gọi mạng trong test
jest.mock('@/services/inka', () => ({ listRows: jest.fn(), createRow: jest.fn(async () => 'new-rec'), updateRow: jest.fn(async () => {}) }));

const admin: User = { id: 'U-ADMIN', username: 'admin', password: 'x', name: 'Admin', role: 'ADMIN', warehouseId: null };
const blank = (): DB => makeBlankData(admin);

describe('keyOf', () => {
  it('dùng id, sku hoặc kho|sku tuỳ bảng', () => {
    expect(keyOf('users', { id: 'U-1' })).toBe('U-1');
    expect(keyOf('products', { sku: 'SKU-1' })).toBe('SKU-1');
    expect(keyOf('inventory', { warehouseId: 'KH001', sku: 'SKU-1', qty: 3 })).toBe('KH001|SKU-1');
  });
});

describe('diffDb', () => {
  it('không có thay đổi khi hai DB giống nhau', () => {
    expect(diffDb(blank(), blank())).toEqual([]);
  });

  it('phát hiện thêm, sửa và xoá', () => {
    const prev = blank();
    prev.inventory = [{ warehouseId: 'A', sku: 'S1', qty: 5 }, { warehouseId: 'A', sku: 'S2', qty: 1 }];
    const next = blank();
    next.inventory = [{ warehouseId: 'A', sku: 'S1', qty: 4 }];
    next.products = [{ sku: 'S3', name: 'Mới', unit: 'Cái', buyPrice: 1, sellPrice: 2 }];
    const changes = diffDb(prev, next);
    expect(changes).toContainEqual({ collection: 'inventory', key: 'A|S1', entity: { warehouseId: 'A', sku: 'S1', qty: 4 } });
    expect(changes).toContainEqual({ collection: 'inventory', key: 'A|S2', entity: null });
    expect(changes).toContainEqual({ collection: 'products', key: 'S3', entity: next.products[0] });
    expect(changes).toHaveLength(3);
  });
});

describe('rowsToEntities', () => {
  it('bỏ dòng đã xoá, giữ dòng ghi sau cùng cho mỗi khoá, nhớ id gốc', () => {
    const { entities, refs } = rowsToEntities('products', [
      { rc_id: 'r2', content: { _key: 'S1', _seq: 1, _ts: 20, _rec: 'r1', sku: 'S1', name: 'Mới' } },
      { rc_id: 'r9', content: { _key: 'S1', _seq: 1, _ts: 10, sku: 'S1', name: 'Cũ' } },
      { rc_id: 'r3', content: { _key: 'S2', _seq: 2, _ts: 5, _del: true } },
      { rc_id: 'r4', content: { _key: 'S0', _seq: 0, _ts: 5, sku: 'S0', name: 'Đầu' } },
    ]);
    expect(entities).toEqual([{ sku: 'S0', name: 'Đầu' }, { sku: 'S1', name: 'Mới' }]);
    expect(refs.get('S1')).toEqual({ rec: 'r1', seq: 1, deleted: false });
    expect(refs.get('S2')).toEqual({ rec: 'r3', seq: 2, deleted: true });
    expect(refs.get('S0')?.rec).toBe('r4');
  });

  it('chứng từ xếp mới nhất trước', () => {
    const { entities } = rowsToEntities('ordersIn', [
      { rc_id: 'a', content: { _key: 'IN-1', _seq: 1, _ts: 1, id: 'IN-1' } },
      { rc_id: 'b', content: { _key: 'IN-2', _seq: 2, _ts: 1, id: 'IN-2' } },
    ]);
    expect(entities.map((e) => e.id)).toEqual(['IN-2', 'IN-1']);
  });
});

describe('push', () => {
  beforeEach(() => jest.clearAllMocks());

  it('tạo dòng mới cho khoá chưa có và nhớ id gốc', async () => {
    const refs = emptyRefs();
    await push([{ collection: 'products', key: 'S1', entity: { sku: 'S1', name: 'A' } }], refs);
    expect(createRow).toHaveBeenCalledTimes(1);
    expect((createRow as jest.Mock).mock.calls[0][1]).toMatchObject({ sku: 'S1', name: 'A', _key: 'S1' });
    expect(refs.products.get('S1')).toMatchObject({ rec: 'new-rec', deleted: false });
  });

  it('sửa qua id gốc, xoá bằng cách đánh dấu, và làm sống lại khoá đã xoá', async () => {
    const refs = emptyRefs();
    refs.inventory.set('A|S1', { rec: 'orig-1', seq: 7, deleted: false });
    await push([{ collection: 'inventory', key: 'A|S1', entity: { warehouseId: 'A', sku: 'S1', qty: 2 } }], refs);
    expect(updateRow).toHaveBeenLastCalledWith('orig-1', expect.objectContaining({ qty: 2, _key: 'A|S1', _seq: 7, _rec: 'orig-1' }));

    await push([{ collection: 'inventory', key: 'A|S1', entity: null }], refs);
    expect(updateRow).toHaveBeenLastCalledWith('orig-1', expect.objectContaining({ _del: true, _rec: 'orig-1' }));
    expect(refs.inventory.get('A|S1')?.deleted).toBe(true);

    await push([{ collection: 'inventory', key: 'A|S1', entity: { warehouseId: 'A', sku: 'S1', qty: 9 } }], refs);
    expect(createRow).not.toHaveBeenCalled();
    expect(refs.inventory.get('A|S1')?.deleted).toBe(false);
    expect((updateRow as jest.Mock).mock.calls[2][1]._del).toBeUndefined();
  });
});
