import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useDb } from '@/store/DbContext';
import { isAdmin } from '@/engine/permissions';
import { NoAccess } from '@/components/domain/NoAccess';
import { Badge, Card, EmptyText, IconChip, SectionHeader } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { Fab } from '@/components/layout/Fab';
import { colors, spacing, type } from '@/theme';
import { whShort } from '@/utils/labels';

export default function UsersScreen() {
  const router = useRouter();
  const { db, user } = useDb();
  if (!isAdmin(user)) return <NoAccess />;

  return (
    <Screen fab={<Fab label="Thêm" onPress={() => router.push('/(app)/catalog/users/new' as never)} />}>
      <SectionHeader title="Tài khoản đăng nhập" count={db.users.length} />
      {db.users.length === 0 ? <EmptyText icon="users">Chưa có tài khoản nào</EmptyText> : (
        <Card padded={false}>
          {db.users.map((u, i) => {
            const admin = u.role === 'ADMIN';
            return (
              <TouchableOpacity key={u.id} style={[s.row, i < db.users.length - 1 && s.rowBorder]} activeOpacity={0.7} onPress={() => router.push({ pathname: '/(app)/catalog/users/[id]', params: { id: u.id } } as never)}>
                <IconChip icon={admin ? 'shield' : 'user'} tone={admin ? 'danger' : 'primary'} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={type.body} numberOfLines={1}>{u.name}</Text>
                  <Text style={type.caption} numberOfLines={1}>@{u.username} · {admin ? 'Toàn hệ thống' : whShort(db, u.warehouseId)}</Text>
                </View>
                <Badge text={admin ? 'Admin' : 'Quản lý'} tone={admin ? 'danger' : 'primary'} />
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
});
