@AGENTS.md

# Ghi chú dự án
- App Expo SDK 57 + Expo Router (bottom tabs + stack). Port từ file `index.html` (WMS demo thuần HTML/JS).
- Toàn bộ nghiệp vụ nằm trong `src/engine/engine.ts` dưới dạng hàm thuần `(db, user, ...args) => DB mới`, ném `Error` khi sai quyền/nghiệp vụ. UI gọi qua `useDb().mutate(fn, successMsg?)` – KHÔNG mutate db trực tiếp trong màn hình.
- Kiểm tra trước khi kết thúc: `npm run typecheck` và `npm test`.
- Không cài thêm dep bằng `npm install <pkg>` cho package native; dùng `npx expo install <pkg>`.
- UI: chỉ dùng token trong `src/theme` (`colors`, `type`, `tone()`, `shadow`). Không thêm màu mới ngoài theme; submit/FAB luôn primary, màu semantic chỉ cho trạng thái.
- Cấu trúc: `app/` chỉ chứa route mỏng; màn form ở `src/screens`, logic React ở `src/hooks`, component chia `ui / layout / domain`. Import bằng alias `@/` (= `src/`).
