import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackHeaderProps } from 'expo-router/native-stack';
import { colors } from '@/theme';

// Header tự vẽ cho các màn mở chồng (có nút Back), thay header native để đồng nhất giữa iOS/Android:
// nền trắng, nút back tròn nhỏ viền mảnh bên trái, tiêu đề căn giữa, kẻ mảnh phía dưới.
export function AppHeader({ navigation, options, back }: NativeStackHeaderProps) {
  const insets = useSafeAreaInsets();
  const title = typeof options.title === 'string' ? options.title : '';
  const right = typeof options.headerRight === 'function' ? options.headerRight({ canGoBack: !!back, tintColor: colors.text }) : null;

  return (
    <View style={[s.wrap, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <View style={s.side}>
          {back ? (
            <TouchableOpacity onPress={navigation.goBack} style={s.backBtn} hitSlop={8} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Quay lại">
              <Feather name="chevron-left" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <View style={[s.side, { alignItems: 'flex-end' }]}>{right}</View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  bar: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  side: { width: 44, justifyContent: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text, ...Platform.select({ android: { includeFontPadding: false } }) },
});
