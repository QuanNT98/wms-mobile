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
import { colors, type } from '@/theme';
import { formatQty } from '@/utils/format';

export default function FleetScreen() {
  const router = useRouter();
  const { db, user } = useDb();
  if (!isAdmin(user)) return <NoAccess />;

  return (
    <Screen fab={<Fab label="Thêm" onPress={() => router.push('/(app)/catalog/fleet/new' as never)} />}>
      <SectionHeader title="Nhân viên (xe / thiết bị)" count={db.drivers.length} />
      {db.drivers.length === 0 ? <EmptyText icon="truck">Chưa có nhân viên nào</EmptyText> : null}
      {db.drivers.map((d) => {
        const stock = db.inventory.filter((i) => i.warehouseId === d.id).reduce((sum, i) => sum + i.qty, 0);
        const vehicle = (d.holdingType || 'VEHICLE') === 'VEHICLE';
        const manager = db.users.find((u) => u.warehouseId === d.id);
        return (
          <TouchableOpacity key={d.id} activeOpacity={0.8} onPress={() => router.push({ pathname: '/(app)/catalog/fleet/[id]', params: { id: d.id } } as never)}>
            <Card>
              <View style={s.head}>
                <IconChip icon={vehicle ? 'truck' : 'tool'} tone={vehicle ? 'primary' : 'violet'} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={type.body}>{d.name}</Text>
                  <Text style={type.caption}>{d.id} · {d.phone}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </View>
              <View style={s.meta}>
                <Badge text={vehicle ? `Xe · ${d.plate}` : `Thiết bị${d.plate ? ` · ${d.plate}` : ''}`} tone={vehicle ? 'primary' : 'violet'} />
                <Badge text={manager ? manager.username : 'Chưa có tài khoản'} tone={manager ? 'success' : 'neutral'} />
                <View style={{ flex: 1 }} />
                <Text style={s.stock}>{formatQty(stock)} <Text style={type.caption}>SP đang giữ</Text></Text>
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 10, marginTop: 2 },
  stock: { fontSize: 15, fontWeight: '800', color: colors.text },
});
