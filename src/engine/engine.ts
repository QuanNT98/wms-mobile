import {
  DB, User, OrderItem, Role, PartnerType, HoldingType, FixedWarehouseType, IncidentType, StockItem,
} from '@/types';
import { canManageWarehouse, isAdmin } from '@/engine/permissions';
import { cloneDB } from '@/utils/clone';

// Mỗi hàm nhận DB hiện tại + user đang đăng nhập, trả về DB mới (đã clone).
// Lỗi nghiệp vụ / quyền hạn được ném ra dưới dạng Error để UI hiển thị.

const genId = (prefix: string, len = 4) => `${prefix}-${Date.now().toString().slice(-len)}`;

function cleanup(db: DB): DB {
  db.inventory = db.inventory.filter((i) => i.qty > 0);
  db.damagedStock = db.damagedStock.filter((i) => i.qty > 0);
  return db;
}

function addStock(list: StockItem[], warehouseId: string, sku: string, qty: number) {
  const s = list.find((i) => i.warehouseId === warehouseId && i.sku === sku);
  if (s) s.qty += qty;
  else list.push({ warehouseId, sku, qty });
}

function productName(db: DB, sku: string) {
  return db.products.find((p) => p.sku === sku)?.name || sku;
}

function assertEnoughStock(db: DB, warehouseId: string, items: OrderItem[], msg: (name: string) => string) {
  for (const item of items) {
    const stock = db.inventory.find((i) => i.warehouseId === warehouseId && i.sku === item.sku);
    if (!stock || stock.qty < item.qty) throw new Error(msg(productName(db, item.sku)));
  }
}

// ============ USERS ============
export function addOrUpdateUser(
  db0: DB, user: User | null,
  editId: string, username: string, password: string, name: string, role: Role, warehouseId: string,
): DB {
  if (!isAdmin(user)) throw new Error('Chỉ Quản Trị Viên mới được quản lý tài khoản!');
  const db = cloneDB(db0);
  username = (username || '').trim().toLowerCase();
  name = (name || '').trim();
  if (!username || !password || !name) throw new Error('Vui lòng nhập đầy đủ thông tin!');
  if (role === 'MANAGER' && !warehouseId) throw new Error('Vui lòng chọn kho/xe được quản lý!');

  if (editId) {
    const u = db.users.find((x) => x.id === editId);
    if (!u) throw new Error('Không tìm thấy tài khoản!');
    if (db.users.some((x) => x.username === username && x.id !== editId)) throw new Error('Tên đăng nhập đã tồn tại!');
    u.username = username; u.password = password; u.name = name; u.role = role;
    u.warehouseId = role === 'MANAGER' ? warehouseId : null;
  } else {
    if (db.users.some((u) => u.username === username)) throw new Error('Tên đăng nhập đã tồn tại!');
    db.users.push({
      id: `U-${Date.now().toString().slice(-6)}`,
      username, password, name, role,
      warehouseId: role === 'MANAGER' ? warehouseId : null,
    });
  }
  return cleanup(db);
}

// ============ DRIVERS (NHÂN VIÊN & XE) ============
export function addOrUpdateDriver(
  db0: DB, user: User | null,
  editId: string, id: string, name: string, holdingType: HoldingType, plate: string, phone: string,
): DB {
  if (!isAdmin(user)) throw new Error('Chỉ Quản Trị Viên mới được quản lý nhân viên & xe!');
  const db = cloneDB(db0);
  id = id.trim().toUpperCase();
  name = name.trim();
  plate = (plate || '').trim();
  phone = (phone || '').trim();
  if (!id || !name || !phone) throw new Error('Vui lòng nhập đầy đủ thông tin bắt buộc!');
  holdingType = holdingType === 'EQUIPMENT' ? 'EQUIPMENT' : 'VEHICLE';
  if (holdingType === 'VEHICLE' && !plate) throw new Error('Vui lòng nhập biển số xe!');

  const whType = holdingType === 'VEHICLE' ? 'VẬN CHUYỂN' : 'NHÂN VIÊN GIỮ';
  const whName = holdingType === 'VEHICLE'
    ? `Xe ${plate} (${name})`
    : (plate ? `${name} - Giữ TB/Vật tư (Mã: ${plate})` : `${name} - Giữ Thiết Bị/Vật Tư`);

  if (editId) {
    if (editId !== id && (db.drivers.some((d) => d.id === id) || db.warehouses.some((w) => w.id === id))) {
      throw new Error('Mã Nhân viên / Xe này đã tồn tại!');
    }
    const d = db.drivers.find((x) => x.id === editId);
    if (d) { d.id = id; d.name = name; d.holdingType = holdingType; d.plate = plate; d.phone = phone; }
    // Cập nhật tên/loại kho di động tương ứng
    const wh = db.warehouses.find((w) => w.id === editId);
    if (wh) { wh.id = id; wh.name = whName; wh.type = whType; }
    // Cập nhật liên kết user quản lý + tồn kho (nếu mã kho xe đổi)
    if (editId !== id) {
      db.users.forEach((u) => { if (u.warehouseId === editId) u.warehouseId = id; });
      db.inventory.forEach((i) => { if (i.warehouseId === editId) i.warehouseId = id; });
      db.damagedStock.forEach((i) => { if (i.warehouseId === editId) i.warehouseId = id; });
    }
  } else {
    if (db.drivers.some((d) => d.id === id) || db.warehouses.some((w) => w.id === id)) {
      throw new Error('Mã Nhân viên / Xe này đã tồn tại!');
    }
    db.drivers.push({ id, name, holdingType, plate, phone });
    // Tự động tạo một Kho Di Động gắn với nhân viên (Xe hoặc Thiết bị/Vật tư)
    db.warehouses.push({ id, name: whName, type: whType, location: 'Di động' });
  }
  return cleanup(db);
}

// ============ PARTNERS ============
export function addOrUpdatePartner(
  db0: DB, user: User | null,
  editId: string, id: string, name: string, type: PartnerType, phone: string, address: string,
): DB {
  if (!isAdmin(user)) throw new Error('Chỉ Quản Trị Viên mới được quản lý đối tác/khách hàng!');
  const db = cloneDB(db0);
  id = id.trim().toUpperCase();
  name = name.trim();
  phone = phone.trim();
  if (!id || !name || !phone) throw new Error('Vui lòng nhập đầy đủ thông tin bắt buộc!');
  if (editId) {
    if (editId !== id && db.partners.some((p) => p.id === id)) throw new Error('Mã Đối tác đã tồn tại!');
    const p = db.partners.find((x) => x.id === editId);
    if (p) { p.id = id; p.name = name; p.type = type; p.phone = phone; p.address = address; }
  } else {
    if (db.partners.some((p) => p.id === id)) throw new Error('Mã Đối tác đã tồn tại!');
    db.partners.push({ id, name, type, phone, address });
  }
  return cleanup(db);
}

// ============ PRODUCTS ============
export function addOrUpdateProduct(
  db0: DB, user: User | null,
  oldSku: string, sku: string, name: string, unit: string, buyPrice: number | string, sellPrice: number | string,
): DB {
  if (!isAdmin(user)) throw new Error('Chỉ Quản Trị Viên mới được quản lý sản phẩm!');
  const db = cloneDB(db0);
  sku = sku.trim().toUpperCase();
  name = name.trim();
  unit = unit.trim();
  if (!sku || !name || !unit) throw new Error('Vui lòng nhập đầy đủ thông tin bắt buộc!');
  const buy = Number(buyPrice) || 0;
  const sell = Number(sellPrice) || 0;
  if (oldSku) {
    if (oldSku !== sku && db.products.some((p) => p.sku === sku)) throw new Error('SKU đã tồn tại!');
    const p = db.products.find((x) => x.sku === oldSku);
    if (p) {
      p.sku = sku; p.name = name; p.unit = unit; p.buyPrice = buy; p.sellPrice = sell;
      if (oldSku !== sku) {
        db.inventory.forEach((i) => { if (i.sku === oldSku) i.sku = sku; });
        db.damagedStock.forEach((i) => { if (i.sku === oldSku) i.sku = sku; });
      }
    }
  } else {
    if (db.products.some((p) => p.sku === sku)) throw new Error('SKU đã tồn tại!');
    db.products.push({ sku, name, unit, buyPrice: buy, sellPrice: sell });
  }
  return cleanup(db);
}

// ============ WAREHOUSES ============
export function addOrUpdateWarehouse(
  db0: DB, user: User | null,
  editId: string, id: string, name: string, type: FixedWarehouseType, location: string,
): DB {
  if (!isAdmin(user)) throw new Error('Chỉ Quản Trị Viên mới được quản lý kho/bãi!');
  const db = cloneDB(db0);
  id = id.trim().toUpperCase();
  name = name.trim();
  location = location.trim();
  if (!id || !name || !location) throw new Error('Vui lòng nhập đầy đủ thông tin bắt buộc!');
  if (editId) {
    if (editId !== id && db.warehouses.some((w) => w.id === id)) throw new Error('Mã kho đã tồn tại!');
    const wh = db.warehouses.find((w) => w.id === editId);
    if (wh) { wh.id = id; wh.name = name; wh.type = type; wh.location = location; }
    if (editId !== id) {
      db.users.forEach((u) => { if (u.warehouseId === editId) u.warehouseId = id; });
      db.inventory.forEach((i) => { if (i.warehouseId === editId) i.warehouseId = id; });
      db.damagedStock.forEach((i) => { if (i.warehouseId === editId) i.warehouseId = id; });
    }
  } else {
    if (db.warehouses.some((w) => w.id === id)) throw new Error('Mã kho đã tồn tại!');
    db.warehouses.push({ id, name, type, location });
  }
  return cleanup(db);
}

// ============ INPUT ORDERS ============
export function createInputOrder(db0: DB, user: User | null, supplierId: string, warehouseId: string, items: OrderItem[]): DB {
  if (!canManageWarehouse(user, warehouseId)) throw new Error('Bạn không có quyền tạo đơn nhập cho vị trí này!');
  if (!supplierId) throw new Error('Vui lòng chọn đối tác cung cấp!');
  if (!items.length) throw new Error('Vui lòng thêm ít nhất 1 sản phẩm!');
  const db = cloneDB(db0);
  db.ordersIn.unshift({
    id: genId('IN'),
    timestamp: new Date().toISOString(),
    supplierId, warehouseId, items,
    status: 'PENDING',
  });
  return cleanup(db);
}

export function processInputOrder(db0: DB, user: User | null, orderId: string, action: 'RECEIVE' | 'CANCEL'): DB {
  const db = cloneDB(db0);
  const order = db.ordersIn.find((o) => o.id === orderId);
  if (!order) return db0;
  if (order.status !== 'PENDING') return db0;
  if (!canManageWarehouse(user, order.warehouseId)) throw new Error('Chỉ người quản lý kho/xe đích mới được xử lý đơn này!');

  if (action === 'RECEIVE') {
    order.status = 'RECEIVED';
    order.items.forEach((item) => addStock(db.inventory, order.warehouseId, item.sku, item.qty));
  } else {
    order.status = 'CANCELLED';
  }
  return cleanup(db);
}

// ============ OUTPUT ORDERS ============
export function createOutputOrder(
  db0: DB, user: User | null,
  warehouseId: string, customerId: string, items: OrderItem[], deliveryVehicleId: string | null,
): DB {
  if (!canManageWarehouse(user, warehouseId)) throw new Error('Bạn không có quyền xuất hàng từ vị trí này!');
  if (!customerId) throw new Error('Vui lòng chọn khách hàng nhận!');
  if (!items.length) throw new Error('Vui lòng thêm ít nhất 1 sản phẩm!');
  const db = cloneDB(db0);

  deliveryVehicleId = deliveryVehicleId || null;
  if (deliveryVehicleId) {
    if (deliveryVehicleId === warehouseId) throw new Error('Xe giao hàng phải khác với kho/xe xuất hàng nguồn!');
    if (!db.warehouses.some((w) => w.id === deliveryVehicleId)) throw new Error('Xe/Nhân viên giao hàng không hợp lệ!');
  }

  assertEnoughStock(db, warehouseId, items, (n) => `Sản phẩm "${n}" không đủ tồn kho tại vị trí này!`);

  db.ordersOut.unshift({
    id: genId('OUT'),
    timestamp: new Date().toISOString(),
    warehouseId, customerId, items, deliveryVehicleId,
    status: 'PENDING',
  });
  return cleanup(db);
}

export type OutputOrderAction = 'DELIVER' | 'CANCEL' | 'COMPLETE_DELIVERY' | 'START_RETURN' | 'CONFIRM_RETURN';

// 'DELIVER'  (PENDING) - Không có xe giao: xuất kho, giao thẳng cho khách -> DELIVERED
//                      - Có xe giao: xuất kho, hàng lên xe (luân chuyển nội bộ) -> LOADED
// 'CANCEL'   (PENDING) - Hủy đơn, chưa xuất kho nên không cần hoàn hàng
// 'COMPLETE_DELIVERY' (LOADED)    - Xe xác nhận đã giao thành công -> DELIVERED
// 'START_RETURN'      (LOADED)    - Giao không thành, CHỈ xe bấm trả về: trừ tồn xe, hàng đang về kho -> RETURNING
// 'CONFIRM_RETURN'    (RETURNING) - CHỈ kho nguồn xác nhận đã nhận lại: cộng tồn kho -> PENDING (xử lý lại đơn)
export function processOutputOrder(db0: DB, user: User | null, orderId: string, action: OutputOrderAction): DB {
  const db = cloneDB(db0);
  const order = db.ordersOut.find((o) => o.id === orderId);
  if (!order) return db0;

  if (action === 'DELIVER') {
    if (order.status !== 'PENDING') return db0;
    if (!canManageWarehouse(user, order.warehouseId)) throw new Error('Chỉ người quản lý kho/xe nguồn mới được xử lý đơn này!');
    assertEnoughStock(db, order.warehouseId, order.items, (n) => `Không đủ tồn kho cho sản phẩm: ${n}`);
    order.items.forEach((item) => addStock(db.inventory, order.warehouseId, item.sku, -item.qty));
    if (order.deliveryVehicleId) {
      // Luân chuyển nội bộ: hàng lên xe/nhân viên được đề xuất để đi giao
      order.items.forEach((item) => addStock(db.inventory, order.deliveryVehicleId!, item.sku, item.qty));
      order.status = 'LOADED';
    } else {
      order.status = 'DELIVERED';
    }
  } else if (action === 'CANCEL') {
    if (order.status !== 'PENDING') return db0;
    if (!canManageWarehouse(user, order.warehouseId)) throw new Error('Chỉ người quản lý kho/xe nguồn mới được hủy đơn này!');
    order.status = 'CANCELLED';
  } else if (action === 'COMPLETE_DELIVERY') {
    if (order.status !== 'LOADED') return db0;
    if (!canManageWarehouse(user, order.deliveryVehicleId)) throw new Error('Chỉ người quản lý xe/nhân viên giao hàng mới được xác nhận đã giao!');
    assertEnoughStock(db, order.deliveryVehicleId!, order.items, (n) => `Dữ liệu tồn kho trên xe không khớp cho sản phẩm: ${n}`);
    // Hàng đã giao thành công cho khách - rời khỏi hệ thống
    order.items.forEach((item) => addStock(db.inventory, order.deliveryVehicleId!, item.sku, -item.qty));
    order.status = 'DELIVERED';
  } else if (action === 'START_RETURN') {
    if (order.status !== 'LOADED') return db0;
    // Hàng đang thuộc quyền kiểm soát của xe -> kho nguồn không được tự "lấy" về
    if (!canManageWarehouse(user, order.deliveryVehicleId)) throw new Error('Chỉ người quản lý xe/nhân viên giao hàng mới được trả hàng về kho!');
    assertEnoughStock(db, order.deliveryVehicleId!, order.items, (n) => `Dữ liệu tồn kho trên xe không khớp cho sản phẩm: ${n}`);
    // Trừ tồn xe ngay - hàng coi như đang trên đường về kho, chưa cộng vào kho cho tới khi kho xác nhận
    order.items.forEach((item) => addStock(db.inventory, order.deliveryVehicleId!, item.sku, -item.qty));
    order.status = 'RETURNING';
  } else if (action === 'CONFIRM_RETURN') {
    if (order.status !== 'RETURNING') return db0;
    if (!canManageWarehouse(user, order.warehouseId)) throw new Error('Chỉ người quản lý kho nguồn mới được xác nhận đã nhận lại hàng!');
    order.items.forEach((item) => addStock(db.inventory, order.warehouseId, item.sku, item.qty));
    order.status = 'PENDING'; // Quay lại chờ xử lý: có thể xuất lại hoặc hủy
  }
  return cleanup(db);
}

// ============ INTERNAL TRANSFERS ============
// Bước 1: Kho/xe NGUỒN tạo phiếu -> hàng xuất khỏi nguồn ngay (đang vận chuyển)
export function createTransfer(db0: DB, user: User | null, fromId: string, toId: string, items: OrderItem[]): DB {
  if (!canManageWarehouse(user, fromId)) throw new Error('Bạn không có quyền xuất hàng từ vị trí nguồn này!');
  if (!toId) throw new Error('Vui lòng chọn vị trí đích!');
  if (fromId === toId) throw new Error('Vị trí nguồn và vị trí đích không được trùng nhau!');
  if (!items.length) throw new Error('Vui lòng chọn sản phẩm luân chuyển!');
  const db = cloneDB(db0);
  assertEnoughStock(db, fromId, items, (n) => `Kho/Xe nguồn không đủ tồn kho cho sản phẩm: "${n}"`);
  items.forEach((item) => addStock(db.inventory, fromId, item.sku, -item.qty));
  db.transfers.unshift({
    id: genId('TRF'),
    timestamp: new Date().toISOString(),
    fromId, toId, items,
    status: 'PENDING',
    createdBy: user?.id ?? null,
    confirmedBy: null,
  });
  return cleanup(db);
}

// Bước 2: Kho/xe ĐÍCH xác nhận đã nhận hàng -> cộng vào tồn kho đích
export function confirmTransfer(db0: DB, user: User | null, transferId: string): DB {
  const db = cloneDB(db0);
  const t = db.transfers.find((x) => x.id === transferId);
  if (!t || t.status !== 'PENDING') return db0;
  if (!canManageWarehouse(user, t.toId)) throw new Error('Chỉ người quản lý kho/xe đích mới được xác nhận nhận hàng!');
  t.items.forEach((item) => addStock(db.inventory, t.toId, item.sku, item.qty));
  t.status = 'COMPLETED';
  t.confirmedBy = user?.id ?? null;
  return cleanup(db);
}

// Hủy phiếu khi còn đang vận chuyển -> hoàn trả hàng về kho nguồn
export function cancelTransfer(db0: DB, user: User | null, transferId: string): DB {
  const db = cloneDB(db0);
  const t = db.transfers.find((x) => x.id === transferId);
  if (!t || t.status !== 'PENDING') return db0;
  if (!canManageWarehouse(user, t.fromId)) throw new Error('Chỉ người quản lý kho/xe nguồn (hoặc quản trị viên) mới được hủy phiếu!');
  t.items.forEach((item) => addStock(db.inventory, t.fromId, item.sku, item.qty));
  t.status = 'CANCELLED';
  return cleanup(db);
}

// ============ INCIDENTS: LOST / DAMAGED / RETURN ============
export function createIncident(
  db0: DB, user: User | null,
  warehouseId: string, type: IncidentType, targetWarehouseId: string | null, items: OrderItem[], note: string,
): DB {
  if (!canManageWarehouse(user, warehouseId)) throw new Error('Bạn không có quyền báo cáo cho vị trí này!');
  if (!['LOST', 'DAMAGED', 'RETURN'].includes(type)) throw new Error('Loại báo cáo không hợp lệ!');
  if (!items || items.length === 0) throw new Error('Vui lòng chọn ít nhất 1 sản phẩm!');
  const db = cloneDB(db0);

  if (type !== 'LOST') {
    if (!targetWarehouseId) throw new Error('Vui lòng chọn kho nhận thu hồi!');
    if (targetWarehouseId === warehouseId) throw new Error('Kho nhận thu hồi phải khác vị trí báo cáo!');
  }

  assertEnoughStock(db, warehouseId, items, (n) => `Không đủ tồn kho tại vị trí báo cáo cho sản phẩm: "${n}"`);
  // Trừ tồn kho vị trí báo cáo ngay - hàng coi như đang chờ xử lý
  items.forEach((item) => addStock(db.inventory, warehouseId, item.sku, -item.qty));

  db.incidents.unshift({
    id: genId('BC'),
    timestamp: new Date().toISOString(),
    warehouseId, type,
    targetWarehouseId: type !== 'LOST' ? targetWarehouseId : null,
    items,
    note: note || '',
    status: 'PENDING',
    reportedBy: user?.id ?? null,
    resolvedBy: null,
  });
  return cleanup(db);
}

export type IncidentAction = 'CONFIRM' | 'CANCEL' | 'REPAIR_DONE' | 'LIQUIDATE';

export function resolveIncident(db0: DB, user: User | null, incidentId: string, action: IncidentAction): DB {
  const db = cloneDB(db0);
  const inc = db.incidents.find((x) => x.id === incidentId);
  if (!inc) return db0;
  const uid = user?.id ?? null;

  if (action === 'CANCEL') {
    if (inc.status !== 'PENDING') return db0;
    if (!canManageWarehouse(user, inc.warehouseId)) throw new Error('Chỉ người quản lý vị trí báo cáo mới được hủy / hoàn lại báo cáo này!');
    inc.items.forEach((item) => addStock(db.inventory, inc.warehouseId, item.sku, item.qty));
    inc.status = 'CANCELLED';
    inc.resolvedBy = uid;
  } else if (action === 'CONFIRM') {
    if (inc.status !== 'PENDING') return db0;
    if (inc.type === 'LOST') {
      if (!isAdmin(user)) throw new Error('Chỉ Quản Trị Viên mới được xác nhận báo mất!');
      inc.status = 'CONFIRMED'; // Ghi nhận mất hẳn
    } else if (inc.type === 'DAMAGED') {
      if (!canManageWarehouse(user, inc.targetWarehouseId)) throw new Error('Chỉ người quản lý kho nhận thu hồi mới được xác nhận đã nhận hàng!');
      // Hàng hỏng KHÔNG cộng vào tồn kho - đưa vào kho hàng hỏng riêng
      inc.items.forEach((item) => addStock(db.damagedStock, inc.targetWarehouseId!, item.sku, item.qty));
      inc.status = 'RECEIVED_DAMAGED';
    } else {
      if (!canManageWarehouse(user, inc.targetWarehouseId)) throw new Error('Chỉ người quản lý kho nhận thu hồi mới được xác nhận đã nhận hàng!');
      inc.items.forEach((item) => addStock(db.inventory, inc.targetWarehouseId!, item.sku, item.qty));
      inc.status = 'COMPLETED';
    }
    inc.resolvedBy = uid;
  } else if (action === 'REPAIR_DONE') {
    if (inc.type !== 'DAMAGED' || inc.status !== 'RECEIVED_DAMAGED') return db0;
    if (!canManageWarehouse(user, inc.targetWarehouseId)) throw new Error('Chỉ người quản lý kho nhận thu hồi mới được xác nhận sửa xong!');
    for (const item of inc.items) {
      const dmg = db.damagedStock.find((i) => i.warehouseId === inc.targetWarehouseId && i.sku === item.sku);
      if (!dmg || dmg.qty < item.qty) throw new Error(`Dữ liệu kho hàng hỏng không khớp cho SKU: ${item.sku}`);
    }
    inc.items.forEach((item) => {
      addStock(db.damagedStock, inc.targetWarehouseId!, item.sku, -item.qty);
      addStock(db.inventory, inc.targetWarehouseId!, item.sku, item.qty);
    });
    inc.status = 'REPAIRED';
    inc.repairResolvedBy = uid;
  } else if (action === 'LIQUIDATE') {
    if (inc.type !== 'DAMAGED' || inc.status !== 'RECEIVED_DAMAGED') return db0;
    if (!isAdmin(user)) throw new Error('Chỉ Quản Trị Viên mới được thanh lý hàng hỏng không sửa được!');
    for (const item of inc.items) {
      const dmg = db.damagedStock.find((i) => i.warehouseId === inc.targetWarehouseId && i.sku === item.sku);
      if (!dmg || dmg.qty < item.qty) throw new Error(`Dữ liệu kho hàng hỏng không khớp cho SKU: ${item.sku}`);
    }
    inc.items.forEach((item) => addStock(db.damagedStock, inc.targetWarehouseId!, item.sku, -item.qty));
    inc.status = 'LIQUIDATED';
    inc.repairResolvedBy = uid;
  }
  return cleanup(db);
}
