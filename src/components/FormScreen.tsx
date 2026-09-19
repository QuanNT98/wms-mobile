import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, type } from '../theme';

// Khung màn hình tạo/sửa: nội dung cuộn + thanh hành động dính đáy (tổng kết + nút submit)
export function FormScreen({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer ? <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

// Một nhóm trường trong form, có tiêu đề nhỏ phía trên card
export function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ paddingHorizontal: 2 }}>
        <Text style={type.heading}>{title}</Text>
        {hint ? <Text style={[type.caption, { marginTop: 2, lineHeight: 17 }]}>{hint}</Text> : null}
      </View>
      <View style={s.section}>{children}</View>
    </View>
  );
}

// Thanh đáy: bên trái tóm tắt (label + giá trị), bên phải nút submit
export function FooterSummary({ label, value, children }: { label?: string; value?: string; children: React.ReactNode }) {
  return (
    <View style={s.summaryRow}>
      {label ? (
        <View style={{ flex: 1 }}>
          <Text style={type.caption}>{label}</Text>
          {value ? <Text style={s.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text> : null}
        </View>
      ) : null}
      <View style={{ flex: label ? 1.2 : 1 }}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: 32 },
  section: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairline, padding: spacing.lg, gap: spacing.lg, ...shadow.card },
  footer: { backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.hairline, ...shadow.bar },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
});
