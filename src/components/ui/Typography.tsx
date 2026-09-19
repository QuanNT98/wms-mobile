import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, Tone, tone, type } from '@/theme';
import { IconChip } from '@/components/ui/Badge';

type IconName = keyof typeof Feather.glyphMap;

export function SectionHeader({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={type.heading}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {typeof count === 'number' ? <View style={s.countPill}><Text style={s.countText}>{count}</Text></View> : null}
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
    <View style={s.empty}>
      <View style={s.emptyIcon}><Feather name={icon} size={22} color={colors.textMuted} /></View>
      <Text style={[type.bodySm, { textAlign: 'center' }]}>{children}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={s.divider} />;
}

export function Loading() {
  return (
    <View style={[s.flex, s.center, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function KV({ k, v, vStyle }: { k: string; v: React.ReactNode; vStyle?: StyleProp<TextStyle> }) {
  return (
    <View style={s.kv}>
      <Text style={s.kvKey}>{k}</Text>
      {typeof v === 'string' || typeof v === 'number'
        ? <Text style={[s.kvVal, vStyle]}>{v}</Text>
        : <View style={{ flex: 1, alignItems: 'flex-end' }}>{v}</View>}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.row, style]}>{children}</View>;
}

export function StatCard({ label, value, sub, tone: t = 'primary', icon }: { label: string; value: string; sub?: string; tone?: Tone; icon?: IconName }) {
  const c = tone(t);
  return (
    <View style={s.stat}>
      {icon ? <IconChip icon={icon} tone={t} size={34} /> : null}
      <View>
        <Text style={[type.display, { fontSize: 22, color: c.text === colors.textSecondary ? colors.text : c.text }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={[type.bodySm, { marginTop: 2 }]}>{label}</Text>
        {sub ? <Text style={type.caption}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs, paddingHorizontal: 2 },
  countPill: { minWidth: 24, height: 22, paddingHorizontal: 8, borderRadius: radius.full, backgroundColor: colors.neutralSoft, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  empty: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.neutralSoft, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.hairline },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, paddingVertical: 3 },
  kvKey: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  kvVal: { fontSize: 14, color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  stat: { flex: 1, minWidth: '45%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.lg, padding: spacing.lg, gap: 12, ...shadow.card },
});
