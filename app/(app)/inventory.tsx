import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDb } from '@/store/DbContext';
import { isMobileWarehouse } from '@/engine/permissions';
import { Badge, Card, EmptyText, IconChip, SectionHeader } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { Select } from '@/components/ui/Select';
import { colors, spacing, type } from '@/theme';
import { formatQty } from '@/utils/format';
import { WH_TYPE_LABEL, whOptions } from '@/utils/labels';

export default function InventoryScreen() {
  const { db } = useDb();
  const [filter, setFilter] = useState('ALL');

  const list = useMemo(() => {
    let inv = db.inventory.filter((i) => i.qty > 0);
    if (filter !== 'ALL') inv = inv.filter((i) => i.warehouseId === filter);
    return inv;
  }, [db.inventory, filter]);

  // Nhóm theo vị trí để đọc trên mobile dễ hơn bảng phẳng
  const groups = useMemo(() => {
    const map = new Map<string, typeof list>();
    list.forEach((i) => { map.set(i.warehouseId, [...(map.get(i.warehouseId) || []), i]); });
    return Array.from(map.entries());
  }, [list]);

  const total = list.reduce((s, i) => s + i.qty, 0);

  return (
    <Screen>
      <Select label="Vị trí kho / xe" value={filter} options={[{ value: 'ALL', label: 'Tất cả vị trí' }, ...whOptions(db.warehouses)]} onChange={setFilter} hint='Chỉ hiển thị hàng khả dụng. Hàng chờ sửa / thanh lý xem tại "Sự cố hàng hóa".' />

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
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: 11 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  qty: { fontSize: 15, fontWeight: '800', color: colors.text },
  unit: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
});
