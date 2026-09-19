import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, Tone, tone } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

export function Badge({ text, tone: t = 'neutral', dot, icon }: { text: string; tone?: Tone; dot?: boolean; outline?: boolean; icon?: IconName }) {
  const c = tone(t);
  return (
    <View style={[s.badge, { backgroundColor: c.soft }]}>
      {icon ? <Feather name={icon} size={12} color={c.text} /> : dot ? <View style={[s.badgeDot, { backgroundColor: c.solid }]} /> : null}
      <Text style={[s.badgeText, { color: c.text }]}>{text}</Text>
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

const s = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
});
