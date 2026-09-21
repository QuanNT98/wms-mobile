import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDb } from '@/store/DbContext';
import { getVisibleInventory, isAdmin, isMobileWarehouse } from '@/engine/permissions';
import { Badge, Card, EmptyText, IconChip, SectionHeader } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { Select } from '@/components/ui/Select';
import { colors, spacing, type } from '@/theme';
import { formatQty } from '@/utils/format';
import { WH_TYPE_LABEL, whOptions } from '@/utils/labels';

export default function InventoryScreen() {
  const { db, user } = useDb();
  const admin = isAdmin(user);
  const [filter, setFilter] = useState('ALL');
  // Manager chỉ nhìn thấy tồn của vị trí mình; admin mới được xem/lọc tất cả vị trí
  const myWarehouse = !admin ? db.warehouses.find((w) => w.id === user?.warehouseId) : null;

  const list = useMemo(() => {
    let inv = getVisibleInventory(db, user).filter((i) => i.qty > 0);
    if (admin && filter !== 'ALL') inv = inv.filter((i) => i.warehouseId === filter);
    return inv;
  }, [db, user, admin, filter]);

  // Nhóm theo vị trí để đọc trên mobile dễ hơn bảng phẳng
  const groups = useMemo(() => {
    const map = new Map<string, typeof list>();
    list.forEach((i) => { map.set(i.warehouseId, [...(map.get(i.warehouseId) || []), i]); });
    return Array.from(map.entries());
  }, [list]);

  const total = list.reduce((s, i) => s + i.qty, 0);

  return (
    <Screen>
      {admin ? (
        <Select label="Vị trí kho / xe" value={filter} options={[{ value: 'ALL', label: 'Tất cả vị trí' }, ...whOptions(db.warehouses)]} onChange={setFilter} hint='Chỉ hiển thị hàng khả dụng. Hàng chờ sửa / thanh lý xem tại "Sự cố hàng hóa".' />
      ) : (
        <Card style={st.scope}>
          <IconChip icon="lock" tone="neutral" size={36} />
          <View style={{ flex: 1 }}>
            <Text style={type.bodySm}>Tồn kho tại: <Text style={{ fontWeight: '700' }}>{myWarehouse?.name || 'Chưa gán vị trí'}</Text></Text>
            <Text style={type.caption}>Bạn chỉ xem được vị trí mình quản lý. Chỉ Quản trị viên xem được tất cả vị trí.</Text>
          </View>
        </Card>
      )}

      <SectionHeader title={`Tổng ${formatQty(total)} sản phẩm`} count={groups.length} />
      {groups.length === 0 ? <EmptyText icon="package">Không có hàng tồn ở vị trí này</EmptyText> : null}
      {groups.map(([whId, items]) => {
        const wh = db.warehouses.find((w) => w.id === whId);
        const mobile = isMobileWarehouse(wh);
        const sum = items.reduce((s, i) => s + i.qty, 0);
        return (
          <Card key={whId} padded={false}>
            <View style={st.head}>
              <IconChip icon={mobile ? 'truck' : 'home'} tone={mobile ? 'primary' : 'teal'} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={type.body} numberOfLines={2}>{wh?.name || 'N/A'}</Text>
                <Text style={type.caption}>{whId} · {formatQty(sum)} SP</Text>
              </View>
              <Badge text={wh ? (WH_TYPE_LABEL[wh.type] || wh.type) : 'Kho'} tone={mobile ? 'primary' : 'teal'} />
            </View>
            {items.map((i, idx) => {
              const prod = db.products.find((p) => p.sku === i.sku);
              return (
                <View key={i.sku} style={[st.row, idx < items.length - 1 && st.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={type.bodySm}>{prod?.name || i.sku}</Text>
                    <Text style={type.caption}>{i.sku}</Text>
                  </View>
                  <Text style={st.qty}>{formatQty(i.qty)} <Text style={st.unit}>{prod?.unit || ''}</Text></Text>
                </View>
              );
            })}
          </Card>
        );
      })}
    </Screen>
  );
}

const st = StyleSheet.create({
  scope: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  qty: { fontSize: 15, fontWeight: '800', color: colors.text },
  unit: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
});
