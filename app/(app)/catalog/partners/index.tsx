import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useDb } from '@/store/DbContext';
import { isAdmin } from '@/engine/permissions';
import { NoAccess } from '@/components/domain/NoAccess';
import { Card, EmptyText, IconChip, SectionHeader } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { Fab } from '@/components/layout/Fab';
import { colors, spacing, type } from '@/theme';

export default function PartnersScreen() {
  const router = useRouter();
  const { db, user } = useDb();
  if (!isAdmin(user)) return <NoAccess />;

  const suppliers = db.partners.filter((p) => p.type === 'SUPPLIER');
  const customers = db.partners.filter((p) => p.type === 'CUSTOMER');

  const Group = ({ title, list }: { title: string; list: typeof db.partners }) => (
    <>
      <SectionHeader title={title} count={list.length} />
      {list.length === 0 ? <EmptyText icon="users">Chưa có đơn vị nào</EmptyText> : (
        <Card padded={false}>
          {list.map((p, i) => (
            <TouchableOpacity key={p.id} style={[s.row, i < list.length - 1 && s.rowBorder]} activeOpacity={0.7} onPress={() => router.push({ pathname: '/(app)/catalog/partners/[id]', params: { id: p.id } } as never)}>
              <IconChip icon={p.type === 'SUPPLIER' ? 'truck' : 'shopping-bag'} tone={p.type === 'SUPPLIER' ? 'violet' : 'teal'} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={type.body} numberOfLines={1}>{p.name}</Text>
                <Text style={type.caption} numberOfLines={1}>{p.id} · {p.phone}{p.address ? ` · ${p.address}` : ''}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>
      )}
    </>
  );

  return (
    <Screen fab={<Fab label="Thêm" onPress={() => router.push('/(app)/catalog/partners/new' as never)} />}>
      <Group title="Đối tác đầu vào" list={suppliers} />
      <Group title="Khách hàng đầu ra" list={customers} />
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
});
