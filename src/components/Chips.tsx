import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, shadow } from '../theme';

// Segmented control: khay xám, ô đang chọn nổi trắng
export function Chips<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string; count?: number }[]; onChange: (v: T) => void }) {
  return (
    <View style={s.tray}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity key={o.value} style={[s.seg, active && s.segActive]} onPress={() => onChange(o.value)} activeOpacity={0.8}>
            <Text style={[s.text, active && s.textActive]}>{o.label}</Text>
            {typeof o.count === 'number' ? (
              <View style={[s.count, active && s.countActive]}><Text style={[s.countText, active && s.countTextActive]}>{o.count}</Text></View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  tray: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.neutralSoft, borderRadius: radius.full, padding: 3 },
  seg: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 14, paddingRight: 8, height: 34, borderRadius: radius.full },
  segActive: { backgroundColor: colors.surface, ...shadow.card },
  text: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  textActive: { color: colors.text, fontWeight: '700' },
  count: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: colors.hairlineStrong, alignItems: 'center', justifyContent: 'center' },
  countActive: { backgroundColor: colors.primary },
  countText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  countTextActive: { color: colors.white },
});
