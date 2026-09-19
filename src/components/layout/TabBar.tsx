import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { colors, shadow } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

// Tab bar tự vẽ: tab đang chọn có nền bo tròn ôm cả icon + nhãn
export function TabBar({ state, descriptors, navigation, icons }: BottomTabBarProps & { icons: Record<string, IconName> }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.tabBarLabel ?? options.title ?? route.name) as string;
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <TouchableOpacity key={route.key} accessibilityRole="button" accessibilityState={focused ? { selected: true } : {}} onPress={onPress} activeOpacity={0.7} style={[s.tab, focused && s.tabActive]}>
            <Feather name={icons[route.name] || 'circle'} size={22} color={focused ? colors.primary : colors.textMuted} />
            <Text style={[s.label, focused && s.labelActive]} numberOfLines={1}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.surface, paddingTop: 10, paddingHorizontal: 4, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...shadow.bar },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, paddingHorizontal: 2, marginHorizontal: 2, borderRadius: 16 },
  tabActive: { backgroundColor: colors.primarySoft, borderRadius: 16, overflow: 'hidden' },
  label: { fontSize: 11, fontWeight: '600', color: colors.textMuted, letterSpacing: -0.2 },
  labelActive: { color: colors.primary, fontWeight: '700' },
});
