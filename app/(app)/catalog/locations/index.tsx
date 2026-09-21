import React from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useDb } from '@/store/DbContext';
import { isAdmin, isMobileWarehouse } from '@/engine/permissions';
import { Badge, Button, Card, EmptyText, IconChip, Row, SectionHeader } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { Fab } from '@/components/layout/Fab';
import { colors, type } from '@/theme';
import { formatQty } from '@/utils/format';
import { WH_TYPE_LABEL } from '@/utils/labels';

export default function LocationsScreen() {
  const router = useRouter();
  const { db, user } = useDb();
  const admin = isAdmin(user);
  // Giống màn Tồn kho: manager chỉ thấy vị trí mình quản lý, admin thấy tất cả
  const visible = admin ? db.warehouses : db.warehouses.filter((w) => w.id === user?.warehouseId);
  const myWarehouse = !admin ? visible[0] : null;

  return (
    <Screen fab={admin ? <Fab label="Thêm kho" onPress={() => router.push('/(app)/catalog/locations/new' as never)} /> : undefined}>
      {!admin ? (
        <Card style={st.scope}>
          <IconChip icon="lock" tone="neutral" size={36} />
          <View style={{ flex: 1 }}>
            <Text style={type.bodySm}>Vị trí của bạn: <Text style={{ fontWeight: '700' }}>{myWarehouse?.name || 'Chưa gán vị trí'}</Text></Text>
            <Text style={type.caption}>Bạn chỉ xem được vị trí mình quản lý. Chỉ Quản trị viên xem được tất cả vị trí.</Text>
          </View>
        </Card>
      ) : null}
      <SectionHeader title="Điểm lưu kho" count={visible.length} />
      {visible.length === 0 ? <EmptyText>{admin ? 'Chưa có kho nào' : 'Bạn chưa được gán vị trí nào'}</EmptyText> : null}
      {visible.map((w) => {
        const stock = db.inventory.filter((i) => i.warehouseId === w.id).reduce((s, i) => s + i.qty, 0);
        const mobile = isMobileWarehouse(w);
        const manager = db.users.find((u) => u.warehouseId === w.id);
        const mine = user?.warehouseId === w.id;
        return (
          <Card key={w.id} style={mine ? st.mine : undefined}>
            <View style={st.head}>
              <IconChip icon={mobile ? 'truck' : 'home'} tone={mobile ? 'primary' : 'teal'} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={type.body} numberOfLines={2}>{w.name}</Text>
                <Text style={type.caption}>{w.id} · {w.location || ''}</Text>
              </View>
            </View>
            <Row>
              <Badge text={WH_TYPE_LABEL[w.type] || w.type} tone={mobile ? 'primary' : 'teal'} />
              {mine ? <Badge text="Vị trí của bạn" tone="success" dot /> : null}
            </Row>
            <View style={st.foot}>
              <View style={{ flex: 1 }}>
                <Text style={type.caption}>Người quản lý</Text>
                <Text style={type.bodySm} numberOfLines={1}>{manager ? manager.name : 'Chưa chỉ định'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={type.caption}>Tồn kho</Text>
                <Text style={st.stock}>{formatQty(stock)} <Text style={st.unit}>SP</Text></Text>
              </View>
              {admin && !mobile ? (
                <Button title="Sửa" size="sm" variant="soft" tone="neutral" icon="edit-2" onPress={() => router.push({ pathname: '/(app)/catalog/locations/[id]', params: { id: w.id } } as never)} />
              ) : null}
            </View>
          </Card>
        );
      })}

    </Screen>
  );
}

const st = StyleSheet.create({
  scope: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mine: { borderColor: colors.primary, borderWidth: 1.5 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 10, marginTop: 2 },
  stock: { fontSize: 16, fontWeight: '800', color: colors.text },
  unit: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
});
