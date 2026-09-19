import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TextInputProps,
  TouchableOpacity, View, ViewStyle, StyleProp, TextStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing, Tone, tone, type } from '../theme';

type IconName = keyof typeof Feather.glyphMap;

// ---------- Layout ----------
// Trong tab: tab bar đã chừa inset nên bottom = 0; ở màn Stack (edge-to-edge Android) phải tự chừa
export function Screen({ children, contentStyle, fab }: { children: React.ReactNode; contentStyle?: StyleProp<ViewStyle>; fab?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom;
  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.screenContent, { paddingBottom: (fab ? 110 : 40) + bottom }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      {fab ? <View style={{ position: 'absolute', right: 0, bottom }}>{fab}</View> : null}
    </View>
  );
}

export function Card({ children, style, tone: t, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: Tone; padded?: boolean }) {
  const tinted = t && t !== 'neutral' && t !== 'slate';
  return (
    <View style={[styles.card, !padded && { padding: 0 }, tinted && { backgroundColor: tone(t).soft, borderColor: tone(t).soft }, style]}>
      {children}
    </View>
  );
}

export function CardTitle({ icon, title, tone: t = 'primary', subtitle }: { icon?: IconName; title: string; tone?: Tone; subtitle?: string }) {
  return (
    <View style={{ marginBottom: spacing.sm, gap: 4 }}>
      <View style={styles.cardTitleRow}>
        {icon ? <View style={[styles.iconChip, { backgroundColor: tone(t).soft }]}><Feather name={icon} size={15} color={tone(t).solid} /></View> : null}
        <Text style={[type.title, { flex: 1 }]}>{title}</Text>
      </View>
      {subtitle ? <Text style={type.caption}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionHeader({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={type.heading}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {typeof count === 'number' ? <View style={styles.countPill}><Text style={styles.countText}>{count}</Text></View> : null}
        {action}
      </View>
    </View>
  );
}

export function Hint({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.caption, { lineHeight: 17 }, style]}>{children}</Text>;
}

export function EmptyText({ children, icon = 'inbox' }: { children: React.ReactNode; icon?: IconName }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Feather name={icon} size={22} color={colors.textMuted} /></View>
      <Text style={[type.bodySm, { textAlign: 'center' }]}>{children}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

export function Loading() {
  return (
    <View style={[styles.flex, styles.center, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

// ---------- Form ----------
export function Field({ label, required, hint, style, ...props }: TextInputProps & { label?: string; required?: boolean; hint?: string; style?: StyleProp<ViewStyle> }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.label}>{label}{required ? <Text style={{ color: colors.danger }}> *</Text> : null}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[styles.input, props.multiline && styles.inputMultiline, focused && styles.inputFocused]}
      />
      {hint ? <Text style={type.caption}>{hint}</Text> : null}
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  tone?: Tone;
  variant?: 'solid' | 'soft' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}
export function Button({ title, onPress, tone: t = 'primary', variant = 'solid', size = 'md', icon, disabled, style }: ButtonProps) {
  const c = tone(t);
  const bg = variant === 'solid' ? c.solid : variant === 'soft' ? c.soft : 'transparent';
  const fg = variant === 'solid' ? colors.white : variant === 'soft' ? c.text : c.solid;
  const border = variant === 'outline' ? colors.hairlineStrong : 'transparent';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.btn, size === 'sm' && styles.btnSm, { backgroundColor: bg, borderColor: border }, disabled && { opacity: 0.45 }, style]}
    >
      {icon ? <Feather name={icon} size={size === 'sm' ? 14 : 16} color={fg} /> : null}
      <Text style={[styles.btnText, size === 'sm' && styles.btnTextSm, { color: fg }]}>{title}</Text>
    </TouchableOpacity>
  );
}

// ---------- Display ----------
export function Badge({ text, tone: t = 'neutral', dot, icon }: { text: string; tone?: Tone; dot?: boolean; outline?: boolean; icon?: IconName }) {
  const c = tone(t);
  return (
    <View style={[styles.badge, { backgroundColor: c.soft }]}>
      {icon ? <Feather name={icon} size={12} color={c.text} /> : dot ? <View style={[styles.badgeDot, { backgroundColor: c.solid }]} /> : null}
      <Text style={[styles.badgeText, { color: c.text }]}>{text}</Text>
    </View>
  );
}

export function IconChip({ icon, tone: t = 'primary', size = 36 }: { icon: IconName; tone?: Tone; size?: number }) {
  const c = tone(t);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2.8, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={icon} size={size * 0.46} color={c.solid} />
    </View>
  );
}

export function KV({ k, v, vStyle }: { k: string; v: React.ReactNode; vStyle?: StyleProp<TextStyle> }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvKey}>{k}</Text>
      {typeof v === 'string' || typeof v === 'number'
        ? <Text style={[styles.kvVal, vStyle]}>{v}</Text>
        : <View style={{ flex: 1, alignItems: 'flex-end' }}>{v}</View>}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function StatCard({ label, value, sub, tone: t = 'primary', icon }: { label: string; value: string; sub?: string; tone?: Tone; icon?: IconName }) {
  const c = tone(t);
  return (
    <View style={styles.stat}>
      {icon ? <IconChip icon={icon} tone={t} size={34} /> : null}
      <View>
        <Text style={[type.display, { fontSize: 22, color: c.text === colors.textSecondary ? colors.text : c.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={[type.bodySm, { marginTop: 2 }]}>{label}</Text>
        {sub ? <Text style={type.caption}>{sub}</Text> : null}
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  screenContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },
  card: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.lg, padding: spacing.lg, backgroundColor: colors.surface, gap: spacing.sm, ...shadow.card },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconChip: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs, paddingHorizontal: 2 },
  countPill: { minWidth: 24, height: 22, paddingHorizontal: 8, borderRadius: radius.full, backgroundColor: colors.neutralSoft, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.neutralSoft, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.hairline },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: { borderWidth: 1.5, borderColor: colors.hairlineStrong, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  inputFocused: { borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, paddingHorizontal: 18, borderRadius: radius.md, borderWidth: 1 },
  btnSm: { height: 34, paddingHorizontal: 14, borderRadius: 9, gap: 6 },
  btnText: { fontSize: 15, fontWeight: '700' },
  btnTextSm: { fontSize: 12.5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  kvKey: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  kvVal: { fontSize: 14, color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: '45%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.lg, padding: spacing.lg, gap: 12, ...shadow.card },
});
