@AGENTS.md

# Ghi chú dự án
- App Expo SDK 57 + Expo Router (bottom tabs + stack). Port từ file `index.html` (WMS demo thuần HTML/JS).
- Toàn bộ nghiệp vụ nằm trong `src/engine/engine.ts` dưới dạng hàm thuần `(db, user, ...args) => DB mới`, ném `Error` khi sai quyền/nghiệp vụ. UI gọi qua `useDb().mutate(fn, successMsg?)` – KHÔNG mutate db trực tiếp trong màn hình.
- Kiểm tra trước khi kết thúc: `npm run typecheck` và `npm test`.
- Không cài thêm dep bằng `npm install <pkg>` cho package native; dùng `npx expo install <pkg>`.
- UI: chỉ dùng token trong `src/theme` (`colors`, `type`, `tone()`, `shadow`). Không thêm màu mới ngoài theme; submit/FAB luôn primary, màu semantic chỉ cho trạng thái.
- Cấu trúc: `app/` chỉ chứa route mỏng; màn form ở `src/screens`, logic React ở `src/hooks`, component chia `ui / layout / domain`. Import bằng alias `@/` (= `src/`).

# Máy chủ inka.vn (bản demo)
- Dữ liệu dùng chung nằm trên inka.vn: database `wms_demo`, mỗi bảng của `DB` là một bảng cùng tên (ID trong `src/services/inkaConfig.ts`, do `node scripts/setup-inka.mjs <admin> <mật khẩu>` tạo và ghi vào; `dbId` rỗng = app chỉ lưu trên máy như cũ).
- Engine giữ nguyên. `DbContext` áp thay đổi lên máy ngay, rồi `src/store/sync.ts` đẩy phần khác biệt lên server (hàng đợi nối đuôi) và tải lại mỗi 15 giây / khi mở lại app. Chưa tải được dữ liệu server thì chặn thao tác.
- Tài khoản WMS (admin, qlkho1…) là dữ liệu trong bảng `users`; app nối với inka bằng tài khoản khách (`/api/try-now/`).
- Né lỗi của inka, đừng bỏ: không xoá dòng (đánh dấu `_del`), sửa dòng qua id gốc lưu trong `_rec`, nhận dòng schema theo hình dạng chứ không theo vị trí, mỗi dòng dưới ~900 byte, mỗi bảng chỉ đọc được 255 dòng mới nhất.
- Không có khoá/giao dịch: hai máy sửa cùng một dòng thì máy ghi sau thắng. Chỉ hợp demo dữ liệu nhỏ.
- Mạng văn phòng chặn cổng 8000–8063 của inka.vn; thử bằng 4G. iOS cần bản build native (Expo Go trên iPhone không ghi được).
