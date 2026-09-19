import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
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

// Tab bar đã chừa inset đáy, nên các màn bên trong tab không cần chừa thêm
function TabScene({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <SafeAreaInsetsContext.Provider value={{ ...insets, bottom: 0 }}>{children}</SafeAreaInsetsContext.Provider>;
}

export default function TabsLayout() {
  const { user } = useDb();
  const admin = isAdmin(user);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} icons={TAB_ICONS} />}
      screenLayout={({ children }) => <TabScene>{children}</TabScene>}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: 18, fontWeight: '700' },
        headerTitleAlign: 'left',
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
