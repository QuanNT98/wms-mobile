import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

// Stack bao ngoài: (tabs) là màn chính; các màn còn lại mở chồng lên có nút Back
export const PAGE_TITLES: Record<string, string> = {
  partners: 'Đối tác & khách hàng',
  fleet: 'Nhân viên & xe',
  users: 'Người dùng',
  incidents: 'Sự cố hàng hóa',
  products: 'Sản phẩm',
  locations: 'Kho & bãi',
  inventory: 'Tồn kho',
  accounting: 'Cân đối kế toán',
  // Màn tạo / sửa
  'new-order-in': 'Tạo đơn nhập',
  'new-order-out': 'Tạo đơn xuất',
  'new-transfer': 'Tạo phiếu luân chuyển',
  'new-incident': 'Báo cáo sự cố',
  'partner-form': 'Đối tác / khách hàng',
  'driver-form': 'Nhân viên / xe',
  'user-form': 'Tài khoản',
  'product-form': 'Sản phẩm',
  'warehouse-form': 'Kho / bãi',
};

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 17, fontWeight: '700' },
        headerBackButtonDisplayMode: 'minimal',
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
