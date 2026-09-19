import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, type } from '@/theme';

export function Field({ label, required, hint, style, ...props }: TextInputProps & { label?: string; required?: boolean; hint?: string; style?: StyleProp<ViewStyle> }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[fieldStyles.field, style]}>
      {label ? <Text style={fieldStyles.label}>{label}{required ? <Text style={{ color: colors.danger }}> *</Text> : null}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[fieldStyles.input, props.multiline && fieldStyles.inputMultiline, focused && fieldStyles.inputFocused]}
      />
      {hint ? <Text style={type.caption}>{hint}</Text> : null}
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={fieldStyles.label}>{children}</Text>;
}

// Dùng chung cho Field, Select, ItemsEditor để mọi ô nhập cùng một kiểu
export const fieldStyles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: { borderWidth: 1.5, borderColor: colors.hairlineStrong, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 9, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  inputFocused: { borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
});
