import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useDb } from '../../../src/store/DbContext';
import { isAdmin } from '../../../src/engine/permissions';
import { TabBar } from '../../../src/components/TabBar';
import { colors } from '../../../src/theme';

type IconName = keyof typeof Feather.glyphMap;

const TAB_ICONS: Record<string, IconName> = {
  index: 'home',
  'orders-in': 'download',
  'orders-out': 'upload',
  internal: 'repeat',
  more: 'grid',
};

function HeaderReset() {
  const { user, resetData } = useDb();
  if (!isAdmin(user)) return null;
  return (
    <TouchableOpacity onPress={resetData} style={s.resetBtn} hitSlop={8}>
      <Feather name="rotate-ccw" size={15} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { user } = useDb();
  const admin = isAdmin(user);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} icons={TAB_ICONS} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 18, fontWeight: '700' },
        headerTitleAlign: 'left',
        headerRight: () => <HeaderReset />,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: admin ? 'Tổng quan' : 'Vị trí của tôi', tabBarLabel: 'Trang chủ' }} />
      <Tabs.Screen name="orders-in" options={{ title: 'Đơn nhập', tabBarLabel: 'Nhập kho' }} />
      <Tabs.Screen name="orders-out" options={{ title: 'Đơn xuất', tabBarLabel: 'Xuất kho' }} />
      <Tabs.Screen name="internal" options={{ title: 'Luân chuyển', tabBarLabel: 'Luân chuyển' }} />
      <Tabs.Screen name="more" options={{ title: 'Mở rộng', tabBarLabel: 'Mở rộng' }} />
    </Tabs>
  );
}

const s = StyleSheet.create({
  resetBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
});
