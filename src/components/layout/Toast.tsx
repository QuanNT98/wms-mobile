import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '@/theme';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string }

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND: Record<ToastKind, { icon: keyof typeof Feather.glyphMap; color: string; soft: string; title: string }> = {
  success: { icon: 'check', color: colors.success, soft: colors.successSoft, title: 'Thành công' },
  error: { icon: 'x', color: colors.danger, soft: colors.dangerSoft, title: 'Không thực hiện được' },
  info: { icon: 'info', color: colors.primary, soft: colors.primarySoft, title: 'Thông báo' },
};

// Toast trượt từ trên xuống, tự ẩn sau 2.6s; chạm để tắt sớm. Chỉ hiện 1 toast tại một thời điểm.
function ToastView({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(hide, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(y, { toValue: -120, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => onDone());
  };

  const k = KIND[item.kind];
  return (
    <Animated.View pointerEvents="box-none" style={[s.wrap, { top: insets.top + 8, transform: [{ translateY: y }], opacity }]}>
      <TouchableOpacity activeOpacity={0.92} onPress={hide} style={s.toast}>
        <View style={[s.accent, { backgroundColor: k.color }]} />
        <View style={[s.iconWrap, { backgroundColor: k.soft }]}>
          <Feather name={k.icon} size={16} color={k.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{k.title}</Text>
          <Text style={s.text} numberOfLines={3}>{item.message}</Text>
        </View>
        <Feather name="x" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const seq = useRef(0);

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    seq.current += 1;
    setCurrent({ id: seq.current, kind, message });
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {current ? <ToastView key={current.id} item={current} onDone={() => setCurrent((c) => (c?.id === current.id ? null : c))} /> : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải được dùng bên trong ToastProvider');
  return ctx;
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 1000, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingRight: 14, paddingVertical: 12, borderRadius: radius.lg, maxWidth: 480, width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairline, overflow: 'hidden', ...shadow.float },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '700', color: colors.text },
  text: { color: colors.textSecondary, fontSize: 13, fontWeight: '500', lineHeight: 18, marginTop: 1 },
});
