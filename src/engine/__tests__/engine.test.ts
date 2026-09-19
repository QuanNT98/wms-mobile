import { INITIAL_DATA } from '@/data/initialData';
import * as E from '@/engine/engine';
import { cloneDB } from '@/utils/clone';
import { DB } from '@/types';


const stock = (db: DB, wh: string, sku: string) => db.inventory.find(i => i.warehouseId === wh && i.sku === sku)?.qty ?? 0;
const user = (db: DB, username: string) => db.users.find(u => u.username === username)!;
const throws = (fn: () => any, re: RegExp) => expect(fn).toThrow(re);

test('kịch bản nghiệp vụ A → B → C', () => {
let db = cloneDB(INITIAL_DATA);
const admin = user(db, 'admin'), khoA = user(db, 'qlkho1'), xeB = user(db, 'taixe1'), khoC = user(db, 'qlkho2');

// Kịch bản: Kho A xuất đơn cho khách, giao qua Xe B
db = E.createOutputOrder(db, khoA, 'KH001', 'KH001', [{ sku: 'SKU-88', qty: 10, price: 60000 }], 'XE-01');
const out = db.ordersOut[0];
expect(out.status).toBe('PENDING');
throws(() => E.processOutputOrder(db, xeB, out.id, 'DELIVER'), /kho\/xe nguồn/);          // xe B không được xuất kho A
db = E.processOutputOrder(db, khoA, out.id, 'DELIVER');
expect(db.ordersOut[0].status).toBe('LOADED');
expect(stock(db, 'KH001', 'SKU-88')).toBe(990);
expect(stock(db, 'XE-01', 'SKU-88')).toBe(110);
throws(() => E.processOutputOrder(db, khoA, out.id, 'COMPLETE_DELIVERY'), /xe\/nhân viên giao hàng/);
db = E.processOutputOrder(db, xeB, out.id, 'COMPLETE_DELIVERY');
expect(db.ordersOut[0].status).toBe('DELIVERED');
expect(stock(db, 'XE-01', 'SKU-88')).toBe(100);

// Giao không thành -> trả về kho
db = E.createOutputOrder(db, admin, 'KH001', 'KH001', [{ sku: 'SKU-99', qty: 5, price: 1 }], 'XE-01');
db = E.processOutputOrder(db, khoA, db.ordersOut[0].id, 'DELIVER');
db = E.processOutputOrder(db, xeB, db.ordersOut[0].id, 'RETURN_TO_SOURCE');
expect(db.ordersOut[0].status).toBe('PENDING');
expect(stock(db, 'KH001', 'SKU-99')).toBe(500);
expect(stock(db, 'XE-01', 'SKU-99')).toBe(50);

// Luân chuyển Xe B -> Kho C, kho C xác nhận
throws(() => E.createTransfer(db, khoC, 'XE-01', 'KH002', [{ sku: 'SKU-88', qty: 20 }]), /không có quyền/);
db = E.createTransfer(db, xeB, 'XE-01', 'KH002', [{ sku: 'SKU-88', qty: 20 }]);
expect(stock(db, 'XE-01', 'SKU-88')).toBe(80);
expect(stock(db, 'KH002', 'SKU-88')).toBe(0);
throws(() => E.confirmTransfer(db, xeB, db.transfers[0].id), /kho\/xe đích/);
db = E.confirmTransfer(db, khoC, db.transfers[0].id);
expect(db.transfers[0].status).toBe('COMPLETED');
expect(stock(db, 'KH002', 'SKU-88')).toBe(20);

// Hủy phiếu -> hoàn về nguồn
db = E.createTransfer(db, xeB, 'XE-01', 'KH002', [{ sku: 'SKU-88', qty: 5 }]);
db = E.cancelTransfer(db, xeB, db.transfers[0].id);
expect(stock(db, 'XE-01', 'SKU-88')).toBe(80);

// Không đủ tồn kho
throws(() => E.createTransfer(db, xeB, 'XE-01', 'KH002', [{ sku: 'SKU-88', qty: 999 }]), /không đủ tồn kho/);
throws(() => E.createTransfer(db, xeB, 'XE-01', 'XE-01', [{ sku: 'SKU-88', qty: 1 }]), /trùng/);

// Đơn nhập
db = E.createInputOrder(db, khoC, 'DT001', 'KH002', [{ sku: 'SKU-99', qty: 7, price: 850000 }]);
throws(() => E.processInputOrder(db, khoA, db.ordersIn[0].id, 'RECEIVE'), /kho\/xe đích/);
db = E.processInputOrder(db, khoC, db.ordersIn[0].id, 'RECEIVE');
expect(stock(db, 'KH002', 'SKU-99')).toBe(7);

// Báo hỏng: Xe B -> Kho C, xác nhận vào kho hỏng, sửa xong về tồn
db = E.createIncident(db, xeB, 'XE-01', 'DAMAGED', 'KH002', [{ sku: 'SKU-88', qty: 3 }], 'rơi vỡ');
expect(stock(db, 'XE-01', 'SKU-88')).toBe(77);
db = E.resolveIncident(db, khoC, db.incidents[0].id, 'CONFIRM');
expect(db.incidents[0].status).toBe('RECEIVED_DAMAGED');
expect(db.damagedStock.find(d => d.warehouseId === 'KH002' && d.sku === 'SKU-88')?.qty).toBe(3);
expect(stock(db, 'KH002', 'SKU-88')).toBe(20);
throws(() => E.resolveIncident(db, khoC, db.incidents[0].id, 'LIQUIDATE'), /Quản Trị Viên/);
db = E.resolveIncident(db, khoC, db.incidents[0].id, 'REPAIR_DONE');
expect(db.incidents[0].status).toBe('REPAIRED');
expect(stock(db, 'KH002', 'SKU-88')).toBe(23);
expect(!db.damagedStock.find(d => d.warehouseId === 'KH002' && d.sku === 'SKU-88')).toBeTruthy();

// Báo mất: chỉ admin xác nhận; hủy hoàn kho
db = E.createIncident(db, xeB, 'XE-01', 'LOST', null, [{ sku: 'SKU-88', qty: 2 }], '');
throws(() => E.resolveIncident(db, khoC, db.incidents[0].id, 'CONFIRM'), /Quản Trị Viên/);
db = E.resolveIncident(db, xeB, db.incidents[0].id, 'CANCEL');
expect(stock(db, 'XE-01', 'SKU-88')).toBe(77);
db = E.createIncident(db, xeB, 'XE-01', 'LOST', null, [{ sku: 'SKU-88', qty: 2 }], '');
db = E.resolveIncident(db, admin, db.incidents[0].id, 'CONFIRM');
expect(db.incidents[0].status).toBe('CONFIRMED');
expect(stock(db, 'XE-01', 'SKU-88')).toBe(75);

// Danh mục admin
throws(() => E.addOrUpdateDriver(db, khoA, '', 'XE-03', 'C', 'VEHICLE', '11A', '09'), /Quản Trị Viên/);
db = E.addOrUpdateDriver(db, admin, '', 'nv-c', 'Nhân viên C', 'EQUIPMENT', '', '0900');
expect(db.warehouses.find(w => w.id === 'NV-C' && w.type === 'NHÂN VIÊN GIỮ')).toBeTruthy();
db = E.addOrUpdateUser(db, admin, '', 'nvc', '1', 'NV C', 'MANAGER', 'NV-C');
db = E.addOrUpdateDriver(db, admin, 'NV-C', 'NV-C2', 'Nhân viên C', 'EQUIPMENT', 'TB-1', '0900');
expect(db.users.find(u => u.username === 'nvc')?.warehouseId).toBe('NV-C2');
throws(() => E.addOrUpdateProduct(db, admin, '', 'sku-88', 'x', 'y', 1, 2), /SKU đã tồn tại/);
db = E.addOrUpdateProduct(db, admin, 'SKU-88', 'SKU-88B', 'Thùng', 'Thùng', 1, 2);
expect(stock(db, 'KH001', 'SKU-88B')).toBe(990);

});
