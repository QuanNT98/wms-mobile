import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, Tone, tone } from '@/theme';

type IconName = keyof typeof Feather.glyphMap;

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
      style={[s.btn, size === 'sm' && s.btnSm, { backgroundColor: bg, borderColor: border }, disabled && { opacity: 0.45 }, style]}
    >
      {icon ? <Feather name={icon} size={size === 'sm' ? 14 : 16} color={fg} /> : null}
      <Text style={[s.btnText, size === 'sm' && s.btnTextSm, { color: fg }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, paddingHorizontal: 18, borderRadius: radius.md, borderWidth: 1 },
  btnSm: { height: 34, paddingHorizontal: 14, borderRadius: 9, gap: 6 },
  btnText: { fontSize: 15, fontWeight: '700' },
  btnTextSm: { fontSize: 12.5 },
});
