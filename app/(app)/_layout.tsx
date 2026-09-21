import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme';
import { AppHeader } from '@/components/layout/AppHeader';

// Stack bao ngoài: (tabs) là màn chính; các màn còn lại mở chồng lên có nút Back
export const PAGE_TITLES: Record<string, string> = {
  inventory: 'Tồn kho',
  accounting: 'Cân đối kế toán',
  'incidents/index': 'Sự cố hàng hóa',
  'incidents/new': 'Báo cáo sự cố',
  'orders/new-in': 'Tạo đơn nhập',
  'orders/new-out': 'Tạo đơn xuất',
  'transfers/new': 'Tạo phiếu luân chuyển',
  'catalog/partners/index': 'Đối tác & khách hàng',
  'catalog/partners/new': 'Thêm đối tác',
  'catalog/partners/[id]': 'Sửa đối tác',
  'catalog/fleet/index': 'Nhân viên & xe',
  'catalog/fleet/new': 'Thêm nhân viên',
  'catalog/fleet/[id]': 'Sửa nhân viên',
  'catalog/products/index': 'Sản phẩm',
  'catalog/products/new': 'Thêm sản phẩm',
  'catalog/products/[sku]': 'Sửa sản phẩm',
  'catalog/locations/index': 'Kho & bãi',
  'catalog/locations/new': 'Thêm kho',
  'catalog/locations/[id]': 'Sửa kho',
  'catalog/users/index': 'Người dùng',
  'catalog/users/new': 'Tạo tài khoản',
  'catalog/users/[id]': 'Sửa tài khoản',
};

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        // Header tự vẽ (xem AppHeader) thay cho header native để giống design trên mọi nền tảng
        header: (props) => <AppHeader {...props} />,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {Object.entries(PAGE_TITLES).map(([name, title]) => (
        <Stack.Screen key={name} name={name} options={{ title }} />
      ))}
    </Stack>
  );
}
