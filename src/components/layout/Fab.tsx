import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, shadow } from '@/theme';

export function Fab({ onPress, label, icon = 'plus' }: { onPress: () => void; label?: string; icon?: keyof typeof Feather.glyphMap }) {
  return (
    <TouchableOpacity style={s.fab} onPress={onPress} activeOpacity={0.85}>
      <Feather name={icon} size={18} color={colors.white} />
      {label ? <Text style={s.fabText}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  fab: { marginRight: 16, marginBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 46, borderRadius: 23, backgroundColor: colors.primary, ...shadow.float },
  fabText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
