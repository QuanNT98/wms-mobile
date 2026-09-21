import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDb } from '@/store/DbContext';
import { useToast } from '@/components/layout/Toast';
import { DEMO_ACCOUNTS } from '@/data/initialData';
import { colors, radius, spacing, tone, type } from '@/theme';
import { Button, fieldStyles as ui } from '@/components/ui';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { db, login } = useDb();
  // Sau khi "Danh sách trắng", các tài khoản demo không còn -> ẩn nút đăng nhập nhanh tương ứng
  const demoAccounts = DEMO_ACCOUNTS.filter((acc) => db.users.some((u) => u.username === acc.username && u.password === acc.password));
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [focus, setFocus] = useState<'u' | 'p' | null>(null);

  const submit = (u = username, p = password) => {
    if (!u.trim() || !p) { toast.error('Vui lòng nhập tên đăng nhập và mật khẩu'); return; }
    if (!login(u, p)) { toast.error('Sai tên đăng nhập hoặc mật khẩu'); return; }
    setUsername(''); setPassword('');
  };

  return (
    <View style={s.root}>
      {/* Header brand trên nền navy */}
      <View style={[s.brand, { paddingTop: insets.top + 12 }]}>
        <View style={s.logo}><Feather name="box" size={26} color={colors.white} /></View>
        <Text style={s.brandTitle}>Quản Lý Kho</Text>
        <Text style={s.brandSub}>Kho hàng & đội xe vận chuyển</Text>
      </View>

      {/* Sheet trắng bo góc trên, chiếm hết phần còn lại */}
      <KeyboardAvoidingView style={s.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[s.sheetContent, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ gap: 4 }}>
            <Text style={[type.title, { fontSize: 22 }]}>Đăng nhập</Text>
            <Text style={type.bodySm}>Nhập tài khoản được cấp để tiếp tục</Text>
          </View>

          <View style={{ gap: spacing.lg }}>
            <View style={ui.field}>
              <Text style={ui.label}>Tên đăng nhập</Text>
              <View style={[s.inputWrap, focus === 'u' && s.inputFocus]}>
                <Feather name="user" size={16} color={focus === 'u' ? colors.primary : colors.textMuted} />
                <TextInput style={s.input} value={username} onChangeText={setUsername} onFocus={() => setFocus('u')} onBlur={() => setFocus(null)} autoCapitalize="none" autoCorrect={false} textContentType="username" placeholder="admin" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
            <View style={ui.field}>
              <Text style={ui.label}>Mật khẩu</Text>
              <View style={[s.inputWrap, focus === 'p' && s.inputFocus]}>
                <Feather name="lock" size={16} color={focus === 'p' ? colors.primary : colors.textMuted} />
                <TextInput style={s.input} value={password} onChangeText={setPassword} onFocus={() => setFocus('p')} onBlur={() => setFocus(null)} secureTextEntry={!showPw} textContentType="password" placeholder="••••••••" placeholderTextColor={colors.textMuted} onSubmitEditing={() => submit()} />
                <TouchableOpacity onPress={() => setShowPw((v) => !v)} hitSlop={8}><Feather name={showPw ? 'eye-off' : 'eye'} size={16} color={colors.textMuted} /></TouchableOpacity>
              </View>
            </View>
            <Button title="Đăng nhập" onPress={() => submit()} icon="arrow-right" />
          </View>

          {demoAccounts.length > 0 ? (<>
          <View style={s.dividerRow}><View style={s.dividerLine} /><Text style={type.overline}>TÀI KHOẢN DEMO</Text><View style={s.dividerLine} /></View>

          <View style={{ gap: 8 }}>
            {demoAccounts.map((acc) => {
              const c = tone(acc.color);
              return (
                <TouchableOpacity key={acc.username} style={s.demoBtn} onPress={() => submit(acc.username, acc.password)} activeOpacity={0.7}>
                  <View style={[s.avatar, { backgroundColor: c.soft }]}><Text style={[s.avatarText, { color: c.text }]}>{acc.badge}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.demoLabel} numberOfLines={1}>{acc.label}</Text>
                    <Text style={type.caption}>{acc.username}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
          </>) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  brand: { alignItems: 'center', gap: 4, paddingBottom: 22 },
  logo: { width: 54, height: 54, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  brandTitle: { fontSize: 22, fontWeight: '800', color: colors.white, letterSpacing: -0.3 },
  brandSub: { fontSize: 13, color: colors.textOnDarkMuted, fontWeight: '500' },
  sheet: { flex: 1, backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  sheetContent: { padding: spacing.xl, paddingTop: 24, gap: spacing.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14, height: 50, borderWidth: 1.5, borderColor: colors.hairlineStrong },
  inputFocus: { borderColor: colors.primary },
  input: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.hairline },
  demoBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.hairlineStrong, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9 },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '800' },
  demoLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
});
