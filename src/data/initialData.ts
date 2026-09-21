import { DB, User } from '@/types';

// Thời điểm tương đối so với hôm nay để dữ liệu demo luôn "mới"
const at = (daysAgo: number, hour = 9, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const INITIAL_DATA: DB = {
  users: [
    { id: 'U-ADMIN', username: 'admin', password: 'admin123', name: 'Quản Trị Viên', role: 'ADMIN', warehouseId: null },
    { id: 'U-QLKHO1', username: 'qlkho1', password: '123456', name: 'Phạm Thị Quản (QL Kho A)', role: 'MANAGER', warehouseId: 'KH001' },
    { id: 'U-TAIXE1', username: 'taixe1', password: '123456', name: 'Nguyễn Văn A (Xe B)', role: 'MANAGER', warehouseId: 'XE-01' },
    { id: 'U-QLKHO2', username: 'qlkho2', password: '123456', name: 'Trần Văn Kho (QL Kho C)', role: 'MANAGER', warehouseId: 'KH002' },
    { id: 'U-TAIXE2', username: 'taixe2', password: '123456', name: 'Trần Văn B (Xe 02)', role: 'MANAGER', warehouseId: 'XE-02' },
    { id: 'U-QLKHO3', username: 'qlkho3', password: '123456', name: 'Lê Thị Hạnh (QL Kho HN)', role: 'MANAGER', warehouseId: 'KH003' },
    { id: 'U-NV03', username: 'nv03', password: '123456', name: 'Võ Minh Tuấn (KTV)', role: 'MANAGER', warehouseId: 'NV-03' },
  ],
  partners: [
    { id: 'DT001', name: 'Tập Đoàn Hóa Chất LG', type: 'SUPPLIER', phone: '0901112223', address: 'KCN Cát Lái, TP.HCM' },
    { id: 'DT002', name: 'Công ty Bao Bì Việt Long', type: 'SUPPLIER', phone: '0283777888', address: 'KCN Sóng Thần, Bình Dương' },
    { id: 'DT003', name: 'Samsung Electronics VN', type: 'SUPPLIER', phone: '0222399999', address: 'KCN Yên Phong, Bắc Ninh' },
    { id: 'KH001', name: 'Đại Lý Điện Máy Chi Nhánh 1', type: 'CUSTOMER', phone: '0988777666', address: 'Q.1, TP. Hồ Chí Minh' },
    { id: 'KH002', name: 'Siêu Thị Điện Máy Xanh Thủ Đức', type: 'CUSTOMER', phone: '0909123456', address: 'Võ Văn Ngân, Thủ Đức' },
    { id: 'KH003', name: 'Cửa Hàng Minh Phát', type: 'CUSTOMER', phone: '0918555444', address: 'Biên Hòa, Đồng Nai' },
    { id: 'KH004', name: 'Công ty TNHH Nhật Quang', type: 'CUSTOMER', phone: '0243888999', address: 'Cầu Giấy, Hà Nội' },
  ],
  drivers: [
    { id: 'XE-01', name: 'Tài xế Nguyễn Văn A', holdingType: 'VEHICLE', plate: '51C-123.45', phone: '0909888777' },
    { id: 'XE-02', name: 'Tài xế Trần Văn B', holdingType: 'VEHICLE', plate: '60C-888.99', phone: '0918111222' },
    { id: 'NV-03', name: 'KTV Võ Minh Tuấn', holdingType: 'EQUIPMENT', plate: 'TB-0021', phone: '0933444555' },
  ],
  warehouses: [
    { id: 'KH001', name: 'Kho Tổng Miền Nam', type: 'CENTRAL', location: 'Q.9, TP. Hồ Chí Minh' },
    { id: 'KH002', name: 'Bãi Xe & Kho Bình Dương', type: 'YARD', location: 'Dĩ An, Bình Dương' },
    { id: 'KH003', name: 'Kho Chi Nhánh Hà Nội', type: 'SUB', location: 'Long Biên, Hà Nội' },
    { id: 'XE-01', name: 'Xe 51C-123.45 (Tài xế Nguyễn Văn A)', type: 'VẬN CHUYỂN', location: 'Di động' },
    { id: 'XE-02', name: 'Xe 60C-888.99 (Tài xế Trần Văn B)', type: 'VẬN CHUYỂN', location: 'Di động' },
    { id: 'NV-03', name: 'KTV Võ Minh Tuấn - Giữ TB/Vật tư (Mã: TB-0021)', type: 'NHÂN VIÊN GIỮ', location: 'Di động' },
  ],
  products: [
    { sku: 'SKU-88', name: 'Thùng Carton X (Linh kiện)', unit: 'Thùng', buyPrice: 45000, sellPrice: 60000 },
    { sku: 'SKU-99', name: 'Thiết Bị Điện Tử Y', unit: 'Cái', buyPrice: 850000, sellPrice: 1050000 },
    { sku: 'SKU-101', name: 'Máy Lạnh Inverter 1.5HP', unit: 'Bộ', buyPrice: 6200000, sellPrice: 7900000 },
    { sku: 'SKU-102', name: 'Tủ Lạnh 2 Cánh 300L', unit: 'Cái', buyPrice: 5400000, sellPrice: 6990000 },
    { sku: 'SKU-103', name: 'Dây Cáp Điện 2x2.5mm', unit: 'Cuộn', buyPrice: 780000, sellPrice: 950000 },
    { sku: 'SKU-104', name: 'Bộ Dụng Cụ Lắp Đặt', unit: 'Bộ', buyPrice: 1200000, sellPrice: 1500000 },
    { sku: 'SKU-105', name: 'Pallet Nhựa 1.2x1.0m', unit: 'Cái', buyPrice: 320000, sellPrice: 420000 },
  ],
  inventory: [
    // Kho tổng
    { warehouseId: 'KH001', sku: 'SKU-88', qty: 1000 },
    { warehouseId: 'KH001', sku: 'SKU-99', qty: 500 },
    { warehouseId: 'KH001', sku: 'SKU-101', qty: 42 },
    { warehouseId: 'KH001', sku: 'SKU-102', qty: 28 },
    { warehouseId: 'KH001', sku: 'SKU-103', qty: 160 },
    { warehouseId: 'KH001', sku: 'SKU-105', qty: 300 },
    // Bãi Bình Dương
    { warehouseId: 'KH002', sku: 'SKU-101', qty: 12 },
    { warehouseId: 'KH002', sku: 'SKU-103', qty: 40 },
    { warehouseId: 'KH002', sku: 'SKU-105', qty: 120 },
    // Kho Hà Nội
    { warehouseId: 'KH003', sku: 'SKU-102', qty: 15 },
    { warehouseId: 'KH003', sku: 'SKU-103', qty: 60 },
    { warehouseId: 'KH003', sku: 'SKU-104', qty: 8 },
    // Xe 01 (đang giữ hàng của đơn OUT-2201 đang giao + hàng lẻ)
    { warehouseId: 'XE-01', sku: 'SKU-88', qty: 100 },
    { warehouseId: 'XE-01', sku: 'SKU-99', qty: 50 },
    { warehouseId: 'XE-01', sku: 'SKU-101', qty: 3 },
    // Xe 02
    { warehouseId: 'XE-02', sku: 'SKU-103', qty: 10 },
    { warehouseId: 'XE-02', sku: 'SKU-105', qty: 20 },
    // KTV giữ thiết bị / vật tư
    { warehouseId: 'NV-03', sku: 'SKU-104', qty: 2 },
    { warehouseId: 'NV-03', sku: 'SKU-103', qty: 5 },
  ],
  ordersIn: [
    { id: 'IN-2408', timestamp: at(0, 8, 15), supplierId: 'DT003', warehouseId: 'KH001', items: [{ sku: 'SKU-101', qty: 20, price: 6200000 }, { sku: 'SKU-102', qty: 10, price: 5400000 }], status: 'PENDING' },
    { id: 'IN-2407', timestamp: at(0, 7, 40), supplierId: 'DT002', warehouseId: 'KH002', items: [{ sku: 'SKU-105', qty: 200, price: 320000 }], status: 'PENDING' },
    { id: 'IN-2406', timestamp: at(1, 15, 20), supplierId: 'DT001', warehouseId: 'KH003', items: [{ sku: 'SKU-103', qty: 50, price: 780000 }], status: 'PENDING' },
    { id: 'IN-2405', timestamp: at(2, 10, 5), supplierId: 'DT003', warehouseId: 'KH001', items: [{ sku: 'SKU-101', qty: 30, price: 6150000 }, { sku: 'SKU-102', qty: 20, price: 5350000 }], status: 'RECEIVED' },
    { id: 'IN-2404', timestamp: at(4, 9, 30), supplierId: 'DT002', warehouseId: 'KH001', items: [{ sku: 'SKU-88', qty: 500, price: 44000 }, { sku: 'SKU-105', qty: 300, price: 320000 }], status: 'RECEIVED' },
    { id: 'IN-2403', timestamp: at(6, 14, 0), supplierId: 'DT001', warehouseId: 'KH002', items: [{ sku: 'SKU-103', qty: 40, price: 780000 }], status: 'RECEIVED' },
    { id: 'IN-2402', timestamp: at(9, 11, 10), supplierId: 'DT003', warehouseId: 'KH001', items: [{ sku: 'SKU-99', qty: 300, price: 850000 }], status: 'RECEIVED' },
    { id: 'IN-2401', timestamp: at(12, 16, 45), supplierId: 'DT002', warehouseId: 'KH003', items: [{ sku: 'SKU-104', qty: 10, price: 1200000 }], status: 'CANCELLED' },
  ],
  ordersOut: [
    { id: 'OUT-2205', timestamp: at(0, 9, 0), warehouseId: 'KH001', customerId: 'KH002', items: [{ sku: 'SKU-101', qty: 4, price: 7900000 }, { sku: 'SKU-103', qty: 10, price: 950000 }], deliveryVehicleId: 'XE-02', status: 'PENDING' },
    { id: 'OUT-2204', timestamp: at(0, 8, 30), warehouseId: 'KH002', customerId: 'KH003', items: [{ sku: 'SKU-105', qty: 30, price: 420000 }], deliveryVehicleId: null, status: 'PENDING' },
    { id: 'OUT-2203', timestamp: at(1, 10, 20), warehouseId: 'KH003', customerId: 'KH004', items: [{ sku: 'SKU-102', qty: 3, price: 6990000 }], deliveryVehicleId: null, status: 'PENDING' },
    // Đang trên Xe 01 chờ tài xế xác nhận giao khách
    { id: 'OUT-2201', timestamp: at(1, 7, 50), warehouseId: 'KH001', customerId: 'KH001', items: [{ sku: 'SKU-101', qty: 3, price: 7900000 }, { sku: 'SKU-88', qty: 100, price: 60000 }], deliveryVehicleId: 'XE-01', status: 'LOADED' },
    { id: 'OUT-2199', timestamp: at(3, 14, 15), warehouseId: 'KH001', customerId: 'KH002', items: [{ sku: 'SKU-99', qty: 20, price: 1050000 }], deliveryVehicleId: 'XE-02', status: 'DELIVERED' },
    { id: 'OUT-2198', timestamp: at(5, 9, 45), warehouseId: 'KH002', customerId: 'KH003', items: [{ sku: 'SKU-105', qty: 50, price: 420000 }, { sku: 'SKU-103', qty: 5, price: 950000 }], deliveryVehicleId: null, status: 'DELIVERED' },
    { id: 'OUT-2197', timestamp: at(7, 16, 0), warehouseId: 'KH001', customerId: 'KH001', items: [{ sku: 'SKU-102', qty: 6, price: 6990000 }], deliveryVehicleId: 'XE-01', status: 'DELIVERED' },
    { id: 'OUT-2196', timestamp: at(10, 11, 30), warehouseId: 'KH003', customerId: 'KH004', items: [{ sku: 'SKU-104', qty: 2, price: 1500000 }], deliveryVehicleId: null, status: 'CANCELLED' },
  ],
  transfers: [
    // Chờ Xe 01 xác nhận đã nhận
    { id: 'TRF-3105', timestamp: at(0, 8, 0), fromId: 'KH001', toId: 'XE-01', items: [{ sku: 'SKU-103', qty: 20 }], status: 'PENDING', createdBy: 'U-QLKHO1', confirmedBy: null },
    // Chờ Kho C xác nhận đã nhận
    { id: 'TRF-3104', timestamp: at(0, 7, 30), fromId: 'XE-02', toId: 'KH002', items: [{ sku: 'SKU-105', qty: 20 }], status: 'PENDING', createdBy: 'U-TAIXE2', confirmedBy: null },
    // Chờ KTV xác nhận nhận vật tư
    { id: 'TRF-3103', timestamp: at(1, 9, 15), fromId: 'KH001', toId: 'NV-03', items: [{ sku: 'SKU-104', qty: 1 }, { sku: 'SKU-103', qty: 5 }], status: 'PENDING', createdBy: 'U-ADMIN', confirmedBy: null },
    { id: 'TRF-3102', timestamp: at(2, 13, 40), fromId: 'KH001', toId: 'KH002', items: [{ sku: 'SKU-101', qty: 12 }], status: 'COMPLETED', createdBy: 'U-QLKHO1', confirmedBy: 'U-QLKHO2' },
    { id: 'TRF-3101', timestamp: at(4, 10, 0), fromId: 'KH001', toId: 'XE-01', items: [{ sku: 'SKU-88', qty: 100 }, { sku: 'SKU-99', qty: 50 }], status: 'COMPLETED', createdBy: 'U-QLKHO1', confirmedBy: 'U-TAIXE1' },
    { id: 'TRF-3100', timestamp: at(8, 15, 20), fromId: 'KH002', toId: 'KH003', items: [{ sku: 'SKU-105', qty: 40 }], status: 'CANCELLED', createdBy: 'U-QLKHO2', confirmedBy: null },
  ],
  incidents: [
    // Chờ admin xác nhận mất
    { id: 'BC-4106', timestamp: at(0, 8, 45), warehouseId: 'XE-02', type: 'LOST', targetWarehouseId: null, items: [{ sku: 'SKU-103', qty: 2 }], note: 'Rơi 2 cuộn cáp trên đường QL13, không tìm lại được', status: 'PENDING', reportedBy: 'U-TAIXE2', resolvedBy: null },
    // Chờ Kho A xác nhận nhận hàng hỏng thu hồi
    { id: 'BC-4105', timestamp: at(0, 7, 20), warehouseId: 'XE-01', type: 'DAMAGED', targetWarehouseId: 'KH001', items: [{ sku: 'SKU-101', qty: 1 }], note: 'Máy lạnh móp vỏ ngoài khi bốc xếp', status: 'PENDING', reportedBy: 'U-TAIXE1', resolvedBy: null },
    // Chờ Kho C xác nhận nhận hoàn trả
    { id: 'BC-4104', timestamp: at(1, 11, 0), warehouseId: 'NV-03', type: 'RETURN', targetWarehouseId: 'KH002', items: [{ sku: 'SKU-103', qty: 3 }], note: 'Vật tư dư sau công trình Dĩ An', status: 'PENDING', reportedBy: 'U-NV03', resolvedBy: null },
    // Đã nhận về Kho C, đang chờ sửa / thanh lý
    { id: 'BC-4103', timestamp: at(3, 9, 30), warehouseId: 'XE-02', type: 'DAMAGED', targetWarehouseId: 'KH002', items: [{ sku: 'SKU-102', qty: 2 }], note: 'Tủ lạnh trầy cánh, cần kiểm tra gas', status: 'RECEIVED_DAMAGED', reportedBy: 'U-TAIXE2', resolvedBy: 'U-QLKHO2' },
    { id: 'BC-4102', timestamp: at(5, 14, 10), warehouseId: 'XE-01', type: 'RETURN', targetWarehouseId: 'KH001', items: [{ sku: 'SKU-88', qty: 20 }], note: 'Khách không nhận đủ, trả lại kho', status: 'COMPLETED', reportedBy: 'U-TAIXE1', resolvedBy: 'U-QLKHO1' },
    { id: 'BC-4101', timestamp: at(7, 10, 0), warehouseId: 'XE-01', type: 'DAMAGED', targetWarehouseId: 'KH001', items: [{ sku: 'SKU-99', qty: 1 }], note: 'Lỗi nguồn, đã thay linh kiện', status: 'REPAIRED', reportedBy: 'U-TAIXE1', resolvedBy: 'U-QLKHO1', repairResolvedBy: 'U-QLKHO1' },
    { id: 'BC-4100', timestamp: at(9, 16, 30), warehouseId: 'KH002', type: 'DAMAGED', targetWarehouseId: 'KH001', items: [{ sku: 'SKU-105', qty: 4 }], note: 'Pallet gãy không sửa được', status: 'LIQUIDATED', reportedBy: 'U-QLKHO2', resolvedBy: 'U-QLKHO1', repairResolvedBy: 'U-ADMIN' },
    { id: 'BC-4099', timestamp: at(11, 9, 0), warehouseId: 'XE-02', type: 'LOST', targetWarehouseId: null, items: [{ sku: 'SKU-88', qty: 5 }], note: 'Thiếu 5 thùng khi kiểm đếm', status: 'CONFIRMED', reportedBy: 'U-TAIXE2', resolvedBy: 'U-ADMIN' },
    { id: 'BC-4098', timestamp: at(13, 15, 0), warehouseId: 'NV-03', type: 'LOST', targetWarehouseId: null, items: [{ sku: 'SKU-104', qty: 1 }], note: 'Báo nhầm, đã tìm thấy', status: 'CANCELLED', reportedBy: 'U-NV03', resolvedBy: 'U-NV03' },
  ],
  // Hàng hỏng đã thu hồi về kho, chờ sửa / thanh lý (khớp BC-4103)
  damagedStock: [
    { warehouseId: 'KH002', sku: 'SKU-102', qty: 2 },
  ],
};

// Danh sách trắng: khách hàng tự nhập dữ liệu của mình để dùng thử.
// Tài khoản admin sẽ được giữ lại từ người đang thực hiện đặt lại (xem DbContext.resetData).
export function makeBlankData(admin: User): DB {
  return {
    users: [{ ...admin, role: 'ADMIN', warehouseId: null }],
    partners: [], drivers: [], warehouses: [], products: [], inventory: [],
    ordersIn: [], ordersOut: [], transfers: [], incidents: [], damagedStock: [],
  };
}

export const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', label: 'Quản Trị Viên', badge: 'QT', color: 'danger' as const },
  { username: 'qlkho1', password: '123456', label: 'QL Kho Tổng - "Kho A"', badge: 'A', color: 'info' as const },
  { username: 'taixe1', password: '123456', label: 'Tài xế Xe 01 - "Xe B"', badge: 'B', color: 'primary' as const },
  { username: 'qlkho2', password: '123456', label: 'QL Bãi Bình Dương - "Kho C"', badge: 'C', color: 'warning' as const },
];
