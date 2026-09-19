import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, Tone, tone, type } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

export function Card({ children, style, tone: t, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: Tone; padded?: boolean }) {
  const tinted = t && t !== 'neutral' && t !== 'slate';
  return (
    <View style={[s.card, !padded && { padding: 0 }, tinted && { backgroundColor: tone(t).soft, borderColor: tone(t).soft }, style]}>
      {children}
    </View>
  );
}

export function CardTitle({ icon, title, tone: t = 'primary', subtitle }: { icon?: IconName; title: string; tone?: Tone; subtitle?: string }) {
  return (
    <View style={{ marginBottom: spacing.sm, gap: 4 }}>
      <View style={s.cardTitleRow}>
        {icon ? <View style={[s.iconChip, { backgroundColor: tone(t).soft }]}><Feather name={icon} size={15} color={tone(t).solid} /></View> : null}
        <Text style={[type.title, { flex: 1 }]}>{title}</Text>
      </View>
      {subtitle ? <Text style={type.caption}>{subtitle}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.lg, padding: spacing.lg, backgroundColor: colors.surface, gap: spacing.sm, ...shadow.card },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconChip: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
