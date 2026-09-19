import assert from 'node:assert/strict';
import { INITIAL_DATA } from '../src/data/initialData';
import * as E from '../src/engine/engine';
import { cloneDB } from '../src/utils/clone';
import { DB } from '../src/types';

const stock = (db: DB, wh: string, sku: string) => db.inventory.find(i => i.warehouseId === wh && i.sku === sku)?.qty ?? 0;
const user = (db: DB, username: string) => db.users.find(u => u.username === username)!;
const throws = (fn: () => any, re: RegExp) => assert.throws(fn, re);

let db = cloneDB(INITIAL_DATA);
const admin = user(db, 'admin'), khoA = user(db, 'qlkho1'), xeB = user(db, 'taixe1'), khoC = user(db, 'qlkho2');

// Kịch bản: Kho A xuất đơn cho khách, giao qua Xe B
db = E.createOutputOrder(db, khoA, 'KH001', 'KH001', [{ sku: 'SKU-88', qty: 10, price: 60000 }], 'XE-01');
const out = db.ordersOut[0];
assert.equal(out.status, 'PENDING');
throws(() => E.processOutputOrder(db, xeB, out.id, 'DELIVER'), /kho\/xe nguồn/);          // xe B không được xuất kho A
db = E.processOutputOrder(db, khoA, out.id, 'DELIVER');
assert.equal(db.ordersOut[0].status, 'LOADED');
assert.equal(stock(db, 'KH001', 'SKU-88'), 990);
assert.equal(stock(db, 'XE-01', 'SKU-88'), 110);
throws(() => E.processOutputOrder(db, khoA, out.id, 'COMPLETE_DELIVERY'), /xe\/nhân viên giao hàng/);
db = E.processOutputOrder(db, xeB, out.id, 'COMPLETE_DELIVERY');
assert.equal(db.ordersOut[0].status, 'DELIVERED');
assert.equal(stock(db, 'XE-01', 'SKU-88'), 100);

// Giao không thành -> trả về kho
db = E.createOutputOrder(db, admin, 'KH001', 'KH001', [{ sku: 'SKU-99', qty: 5, price: 1 }], 'XE-01');
db = E.processOutputOrder(db, khoA, db.ordersOut[0].id, 'DELIVER');
db = E.processOutputOrder(db, xeB, db.ordersOut[0].id, 'RETURN_TO_SOURCE');
assert.equal(db.ordersOut[0].status, 'PENDING');
assert.equal(stock(db, 'KH001', 'SKU-99'), 500);
assert.equal(stock(db, 'XE-01', 'SKU-99'), 50);

// Luân chuyển Xe B -> Kho C, kho C xác nhận
throws(() => E.createTransfer(db, khoC, 'XE-01', 'KH002', [{ sku: 'SKU-88', qty: 20 }]), /không có quyền/);
db = E.createTransfer(db, xeB, 'XE-01', 'KH002', [{ sku: 'SKU-88', qty: 20 }]);
assert.equal(stock(db, 'XE-01', 'SKU-88'), 80);
assert.equal(stock(db, 'KH002', 'SKU-88'), 0);
throws(() => E.confirmTransfer(db, xeB, db.transfers[0].id), /kho\/xe đích/);
db = E.confirmTransfer(db, khoC, db.transfers[0].id);
assert.equal(db.transfers[0].status, 'COMPLETED');
assert.equal(stock(db, 'KH002', 'SKU-88'), 20);

// Hủy phiếu -> hoàn về nguồn
db = E.createTransfer(db, xeB, 'XE-01', 'KH002', [{ sku: 'SKU-88', qty: 5 }]);
db = E.cancelTransfer(db, xeB, db.transfers[0].id);
assert.equal(stock(db, 'XE-01', 'SKU-88'), 80);

// Không đủ tồn kho
throws(() => E.createTransfer(db, xeB, 'XE-01', 'KH002', [{ sku: 'SKU-88', qty: 999 }]), /không đủ tồn kho/);
throws(() => E.createTransfer(db, xeB, 'XE-01', 'XE-01', [{ sku: 'SKU-88', qty: 1 }]), /trùng/);

// Đơn nhập
db = E.createInputOrder(db, khoC, 'DT001', 'KH002', [{ sku: 'SKU-99', qty: 7, price: 850000 }]);
throws(() => E.processInputOrder(db, khoA, db.ordersIn[0].id, 'RECEIVE'), /kho\/xe đích/);
db = E.processInputOrder(db, khoC, db.ordersIn[0].id, 'RECEIVE');
assert.equal(stock(db, 'KH002', 'SKU-99'), 7);

// Báo hỏng: Xe B -> Kho C, xác nhận vào kho hỏng, sửa xong về tồn
db = E.createIncident(db, xeB, 'XE-01', 'DAMAGED', 'KH002', [{ sku: 'SKU-88', qty: 3 }], 'rơi vỡ');
assert.equal(stock(db, 'XE-01', 'SKU-88'), 77);
db = E.resolveIncident(db, khoC, db.incidents[0].id, 'CONFIRM');
assert.equal(db.incidents[0].status, 'RECEIVED_DAMAGED');
assert.equal(db.damagedStock.find(d => d.warehouseId === 'KH002' && d.sku === 'SKU-88')?.qty, 3);
assert.equal(stock(db, 'KH002', 'SKU-88'), 20);
throws(() => E.resolveIncident(db, khoC, db.incidents[0].id, 'LIQUIDATE'), /Quản Trị Viên/);
db = E.resolveIncident(db, khoC, db.incidents[0].id, 'REPAIR_DONE');
assert.equal(db.incidents[0].status, 'REPAIRED');
assert.equal(stock(db, 'KH002', 'SKU-88'), 23);
assert.ok(!db.damagedStock.find(d => d.warehouseId === 'KH002' && d.sku === 'SKU-88'));

// Báo mất: chỉ admin xác nhận; hủy hoàn kho
db = E.createIncident(db, xeB, 'XE-01', 'LOST', null, [{ sku: 'SKU-88', qty: 2 }], '');
throws(() => E.resolveIncident(db, khoC, db.incidents[0].id, 'CONFIRM'), /Quản Trị Viên/);
db = E.resolveIncident(db, xeB, db.incidents[0].id, 'CANCEL');
assert.equal(stock(db, 'XE-01', 'SKU-88'), 77);
db = E.createIncident(db, xeB, 'XE-01', 'LOST', null, [{ sku: 'SKU-88', qty: 2 }], '');
db = E.resolveIncident(db, admin, db.incidents[0].id, 'CONFIRM');
assert.equal(db.incidents[0].status, 'CONFIRMED');
assert.equal(stock(db, 'XE-01', 'SKU-88'), 75);

// Danh mục admin
throws(() => E.addOrUpdateDriver(db, khoA, '', 'XE-03', 'C', 'VEHICLE', '11A', '09'), /Quản Trị Viên/);
db = E.addOrUpdateDriver(db, admin, '', 'nv-c', 'Nhân viên C', 'EQUIPMENT', '', '0900');
assert.ok(db.warehouses.find(w => w.id === 'NV-C' && w.type === 'NHÂN VIÊN GIỮ'));
db = E.addOrUpdateUser(db, admin, '', 'nvc', '1', 'NV C', 'MANAGER', 'NV-C');
db = E.addOrUpdateDriver(db, admin, 'NV-C', 'NV-C2', 'Nhân viên C', 'EQUIPMENT', 'TB-1', '0900');
assert.equal(db.users.find(u => u.username === 'nvc')?.warehouseId, 'NV-C2');
throws(() => E.addOrUpdateProduct(db, admin, '', 'sku-88', 'x', 'y', 1, 2), /SKU đã tồn tại/);
db = E.addOrUpdateProduct(db, admin, 'SKU-88', 'SKU-88B', 'Thùng', 'Thùng', 1, 2);
assert.equal(stock(db, 'KH001', 'SKU-88B'), 990);

console.log('✅ All engine scenario checks passed');
