import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/theme';

// Trong tab: tab bar đã chừa inset nên bottom = 0; ở màn Stack (edge-to-edge Android) phải tự chừa
export function Screen({ children, contentStyle, fab }: { children: React.ReactNode; contentStyle?: StyleProp<ViewStyle>; fab?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom;
  return (
    <View style={s.flex}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView
          style={s.flex}
          contentContainerStyle={[s.screenContent, { paddingBottom: (fab ? 110 : 40) + bottom }, contentStyle]}
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

const s = StyleSheet.create({
  flex: { flex: 1 },
  screenContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 40 },
});
