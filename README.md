# Quản Lý Kho – WMS Mobile (Expo / React Native)

Bản port React Native của app demo `index.html` (Hệ thống quản lý kho & nhân viên vận chuyển).
Toàn bộ dữ liệu lưu **local** trên máy bằng AsyncStorage – không cần backend.

## Chạy thử

```bash
npm install
npx expo start        # quét QR bằng Expo Go, hoặc bấm i (iOS simulator) / a (Android emulator)
```

Kiểm tra nhanh không cần thiết bị:

```bash
npm run typecheck     # tsc --noEmit
npm run test:engine   # chạy kịch bản nghiệp vụ A → B → C trên engine thuần
```

## Tài khoản demo

| Tài khoản | Mật khẩu | Vai trò |
|-----------|----------|---------|
| `admin`   | `admin123` | Quản trị viên (toàn quyền) |
| `qlkho1`  | `123456`   | QL Kho Tổng – "Kho A" (KH001) |
| `taixe1`  | `123456`   | Tài xế Xe 01 – "Xe B" (XE-01) |
| `qlkho2`  | `123456`   | QL Bãi Bình Dương – "Kho C" (KH002) |
| `taixe2`  | `123456`   | Tài xế Xe 02 (XE-02) |
| `qlkho3`  | `123456`   | QL Kho Chi Nhánh Hà Nội (KH003) |
| `nv03`    | `123456`   | KTV giữ thiết bị / vật tư (NV-03) |

Dữ liệu mẫu (`src/data/initialData.ts`) có sẵn 7 sản phẩm, 6 vị trí kho/xe, 8 đơn nhập, 8 đơn xuất, 6 phiếu luân chuyển, 9 báo cáo sự cố ở đủ mọi trạng thái; mỗi tài khoản đều có việc đang chờ xử lý. Thời gian chứng từ tính tương đối so với ngày mở app. Bấm nút ⟲ (admin) để đặt lại.

Màn đăng nhập có nút đăng nhập nhanh cho 4 tài khoản trên.

## Cấu trúc

Điều hướng kiểu mobile: **bottom tab** cho việc dùng hàng ngày, màn phụ mở dạng Stack có nút Back. Form tạo/sửa là **màn riêng** (`new-*.tsx`, `*-form.tsx`) mở từ nút ⊕ hoặc chạm vào dòng; lưu xong hiện **toast** và tự quay lại.

```
app/
  _layout.tsx                # Provider + auth gate (Stack.Protected) + StatusBar theo trạng thái đăng nhập
  login.tsx                  # Màn đăng nhập
  (app)/_layout.tsx          # Stack: (tabs) + các màn phụ có header Back
  (app)/(tabs)/_layout.tsx   # 5 tab: Tổng quan · Nhập · Xuất · Luân chuyển · Thêm (badge = số việc chờ bạn)
  (app)/(tabs)/index.tsx     # Admin: số liệu toàn hệ thống; Manager/Tài xế: "Vị trí của tôi" + việc cần làm
  (app)/(tabs)/orders-in.tsx # Đơn nhập  (chip lọc Cần xử lý / Tất cả, ⊕ tạo đơn)
  (app)/(tabs)/orders-out.tsx# Đơn xuất
  (app)/(tabs)/internal.tsx  # Luân chuyển nội bộ
  (app)/(tabs)/more.tsx      # Lưới mục còn lại + thẻ user + đăng xuất (nhóm Quản trị chỉ admin thấy)
  (app)/incidents.tsx        # Báo mất / hỏng / hoàn trả + kho hàng hỏng
  (app)/inventory.tsx        # Tồn kho chi tiết (nhóm theo vị trí)
  (app)/locations.tsx        # Kho & Bãi
  (app)/partners.tsx         # Đối tác & Khách hàng   (admin)
  (app)/fleet.tsx            # Nhân viên & Xe         (admin)
  (app)/products.tsx         # Sản phẩm               (admin)
  (app)/users.tsx            # Người dùng & Phân quyền(admin)
  (app)/accounting.tsx       # Cân đối Nhập – Xuất – Tồn (admin)
  (app)/new-order-in|out.tsx # Màn tạo đơn nhập / xuất (FormScreen + ItemsEditor)
  (app)/new-transfer.tsx     # Tạo phiếu luân chuyển
  (app)/new-incident.tsx     # Gửi báo cáo sự cố
  (app)/*-form.tsx           # Thêm/sửa đối tác, nhân viên, người dùng, sản phẩm, kho (nhận id qua params)
src/
  types/                     # Kiểu dữ liệu DB
  data/initialData.ts        # Dữ liệu mẫu (giống INITIAL_DATA bản web)
  engine/engine.ts           # Toàn bộ nghiệp vụ (port từ SyncEngine) – hàm thuần, (db, user, ...) => db mới
  engine/permissions.ts
  store/storage.ts           # Đọc/ghi AsyncStorage
  store/DbContext.tsx        # React Context: db, user, login/logout, mutate()
  components/                # Card, Field, Select (modal), ItemsEditor (stepper), OrderCard (thu gọn), FormScreen, Fab, Chips, Toast...
  utils/tasks.ts             # Đếm "việc cần làm" cho badge tab & hộp việc
scripts/engine.test.ts       # Test kịch bản nghiệp vụ chạy bằng tsx
```

## Hệ thống thiết kế (src/theme/index.ts)

- **Màu**: 1 màu chủ đạo `primary` (#3B5BDB) + `navy` cho hero/login; nền `bg` #F4F6FB; card trắng, bóng mềm, viền hairline.
  Màu semantic (`success / warning / danger / info / orange / violet / teal`) chỉ dùng cho **trạng thái, badge, icon** — không dùng tô nút submit/FAB.
- **Chữ** (`type`): display 26/700 · title 17/700 · heading 15/700 · body 15/500 · bodySm 13/500 · caption 12/500 · overline 11/600.
- **Thành phần**: input filled (nền xám nhạt, viền primary khi focus), nút cao 48 bo 12, badge pill có chấm màu, card bo 16, FAB pill có bóng, tab bar không viền.
- Dùng `tone('success')` → `{ solid, soft, text }` thay vì hard-code màu.

## Khác biệt so với bản web

- Sidebar 12 mục → bottom tab 5 mục + màn "Thêm"; form đặt trên đầu trang → sheet mở từ nút ⊕.
- Màn Tổng quan theo vai trò, có hộp "Việc cần làm" và badge trên tab (bản web không có).
- Bảng (table) chuyển thành danh sách card cho phù hợp màn hình dọc.
- `<select>` thay bằng modal chọn (không cần native picker).
- `alert()` thay bằng **toast** (thành công / lỗi nghiệp vụ); `confirm()` cho hành động không hoàn tác vẫn dùng `Alert.alert`.
- Bộ lọc ngày ở Kế toán nhập dạng `YYYY-MM-DD`, kèm nút nhanh Hôm nay / 7 ngày / Tháng này.
- Màn "Kho & Bãi" có thêm nút Sửa cho kho cố định (engine bản web đã hỗ trợ nhưng UI web chưa gắn nút).
