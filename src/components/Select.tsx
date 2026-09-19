import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, type } from '../theme';
import { styles as ui } from './ui';

export interface SelectOption { value: string; label: string; sub?: string }

interface SelectProps {
  label?: string; required?: boolean; value: string; options: SelectOption[];
  onChange: (value: string) => void; placeholder?: string; hint?: string; disabled?: boolean;
}

// Thay <select>: ô filled giống input, bấm mở bottom sheet chọn
export function Select({ label, required, value, options, onChange, placeholder = 'Chọn...', hint, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={ui.field}>
      {label ? <Text style={ui.label}>{label}{required ? <Text style={{ color: colors.danger }}> *</Text> : null}</Text> : null}
      <TouchableOpacity style={[ui.input, s.trigger, disabled && { opacity: 0.5 }]} onPress={() => !disabled && setOpen(true)} activeOpacity={0.7}>
        <Text style={[s.triggerText, !selected && { color: colors.textMuted }]} numberOfLines={1}>{selected ? selected.label : placeholder}</Text>
        <Feather name="chevron-down" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {hint ? <Text style={type.caption}>{hint}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.grabber} />
            <View style={s.sheetHeader}>
              <Text style={type.title}>{label || 'Chọn'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10} style={s.close}>
                <Feather name="x" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {options.length === 0 ? (
              <Text style={[type.bodySm, { textAlign: 'center', padding: 24 }]}>Không có lựa chọn nào</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={(o) => o.value || '__empty'}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 12 }}
                renderItem={({ item }) => {
                  const active = item.value === value;
                  return (
                    <TouchableOpacity style={[s.option, active && s.optionActive]} onPress={() => { onChange(item.value); setOpen(false); }} activeOpacity={0.7}>
                      <View style={{ flex: 1 }}>
                        <Text style={[type.body, active && { color: colors.primaryDark }]}>{item.label}</Text>
                        {item.sub ? <Text style={type.caption}>{item.sub}</Text> : null}
                      </View>
                      {active ? <View style={s.check}><Feather name="check" size={14} color={colors.white} /></View> : null}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  triggerText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  backdrop: { flex: 1, backgroundColor: 'rgba(17,26,63,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '72%', paddingBottom: 20 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.hairlineStrong, marginTop: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.neutralSoft, alignItems: 'center', justifyContent: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 13, borderRadius: radius.md },
  optionActive: { backgroundColor: colors.primarySoft },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
