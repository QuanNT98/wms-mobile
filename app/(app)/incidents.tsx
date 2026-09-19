import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useDb } from '../../src/store/DbContext';
import { canManageWarehouse, getManageableWarehouses, isAdmin } from '../../src/engine/permissions';
import { resolveIncident, IncidentAction } from '../../src/engine/engine';
import { Badge, Button, Card, EmptyText, Hint, Screen, SectionHeader } from '../../src/components/ui';
import { Chips } from '../../src/components/Chips';
import { Fab } from '../../src/components/Fab';
import { OrderCard } from '../../src/components/OrderCard';
import { colors } from '../../src/theme';
import { formatQty } from '../../src/utils/format';
import { INCIDENT_STATUS, INCIDENT_TYPE, whName, whShort } from '../../src/utils/labels';

export default function IncidentsScreen() {
  const router = useRouter();
  const { db, user, mutate } = useDb();
  const manageable = useMemo(() => getManageableWarehouses(db, user), [db, user]);
  const admin = isAdmin(user);

  const [filter, setFilter] = useState<'MINE' | 'ALL'>('MINE');
  const resolve = (id: string, action: IncidentAction) => {
    const confirmMsg: Partial<Record<IncidentAction, string>> = {
      CANCEL: 'Xác nhận hủy báo cáo này và hoàn lại hàng về tồn kho vị trí báo cáo?',
      REPAIR_DONE: 'Xác nhận đã sửa xong? Hàng sẽ được chuyển từ kho hàng hỏng về tồn kho bình thường.',
      LIQUIDATE: 'Xác nhận THANH LÝ (không sửa được)? Hàng sẽ bị loại bỏ vĩnh viễn khỏi hệ thống, không thể hoàn tác.',
    };
    const msg = confirmMsg[action];
    if (msg) {
      Alert.alert('Xác nhận', msg, [
        { text: 'Không', style: 'cancel' },
        { text: 'Đồng ý', style: action === 'LIQUIDATE' ? 'destructive' : 'default', onPress: () => mutate((d, u) => resolveIncident(d, u, id, action)) },
      ]);
      return;
    }
    mutate((d, u) => resolveIncident(d, u, id, action));
  };

  const damagedList = db.damagedStock.filter((d) => d.qty > 0);

  // Báo cáo đang chờ chính user này xử lý
  const isMine = (inc: typeof db.incidents[number]) => {
    if (inc.status === 'PENDING') return inc.type === 'LOST' ? (admin || canManageWarehouse(user, inc.warehouseId)) : (canManageWarehouse(user, inc.targetWarehouseId) || canManageWarehouse(user, inc.warehouseId));
    if (inc.status === 'RECEIVED_DAMAGED') return admin || canManageWarehouse(user, inc.targetWarehouseId);
    return false;
  };
  const mine = db.incidents.filter(isMine);
  const list = filter === 'MINE' ? mine : db.incidents;

  return (
    <Screen fab={manageable.length ? <Fab label="Gửi báo cáo" onPress={() => router.push('/(app)/new-incident' as never)} /> : undefined}>
      <Chips value={filter} onChange={setFilter} options={[{ value: 'MINE', label: 'Cần xử lý', count: mine.length }, { value: 'ALL', label: 'Tất cả', count: db.incidents.length }]} />
      {list.length === 0 ? <EmptyText>{filter === 'MINE' ? 'Không có báo cáo nào chờ bạn xử lý' : 'Chưa có báo cáo nào'}</EmptyText> : null}
      {list.map((inc) => {
        let actions: React.ReactNode = null;
        let secondary: React.ReactNode = null;
        if (inc.status === 'PENDING') {
          const canCancel = canManageWarehouse(user, inc.warehouseId);
          if (inc.type === 'LOST') {
            if (admin) actions = <Button title="Xác nhận mất" size="sm" tone="danger" icon="alert-triangle" onPress={() => resolve(inc.id, 'CONFIRM')} />;
            if (canCancel) secondary = <Button title="Hủy" size="sm" tone="danger" variant="soft" onPress={() => resolve(inc.id, 'CANCEL')} />;
            if (!admin && !canCancel) secondary = <Hint>Chờ Quản trị viên xác nhận</Hint>;
          } else {
            const canConfirm = canManageWarehouse(user, inc.targetWarehouseId);
            if (canConfirm) actions = <Button title="Đã nhận hàng" size="sm" tone="success" icon="check" onPress={() => resolve(inc.id, 'CONFIRM')} />;
            if (canCancel) secondary = <Button title="Hủy" size="sm" tone="danger" variant="soft" onPress={() => resolve(inc.id, 'CANCEL')} />;
            if (!canConfirm && !canCancel) secondary = <Hint>Chờ kho nhận xác nhận</Hint>;
          }
        } else if (inc.status === 'RECEIVED_DAMAGED') {
          const canRepair = canManageWarehouse(user, inc.targetWarehouseId);
          if (canRepair) actions = <Button title="Sửa xong" size="sm" tone="success" icon="tool" onPress={() => resolve(inc.id, 'REPAIR_DONE')} />;
          if (admin) secondary = <Button title="Thanh lý" size="sm" tone="danger" variant="soft" icon="trash-2" onPress={() => resolve(inc.id, 'LIQUIDATE')} />;
          if (!canRepair && !admin) secondary = <Hint>Đang chờ xử lý sửa chữa</Hint>;
        }
        return (
          <OrderCard
            key={inc.id} id={inc.id} timestamp={inc.timestamp} status={INCIDENT_STATUS[inc.status]}
            from={whShort(db, inc.warehouseId)} to={inc.targetWarehouseId ? whShort(db, inc.targetWarehouseId) : 'Không thu hồi'}
            db={db} items={inc.items} note={inc.note}
            meta={<Badge text={INCIDENT_TYPE[inc.type].text} tone={INCIDENT_TYPE[inc.type].tone} />}
            actions={actions} secondaryActions={secondary}
          />
        );
      })}

      <SectionHeader title="Kho hàng hỏng chờ xử lý" count={damagedList.length} />
      <Card>
        <Hint>Hàng hỏng đã thu hồi nằm riêng ở đây, không tính vào tồn kho khả dụng cho đến khi sửa xong hoặc thanh lý.</Hint>
        {damagedList.length === 0 ? <Text style={[st.note, { paddingTop: 4 }]}>Hiện không có hàng hỏng nào.</Text> : null}
        {damagedList.map((d) => {
          const prod = db.products.find((p) => p.sku === d.sku);
          return (
            <View key={`${d.warehouseId}-${d.sku}`} style={st.dmgRow}>
              <View style={{ flex: 1 }}>
                <Text style={st.dmgName}>{prod?.name || d.sku} ({d.sku})</Text>
                <Text style={st.dmgWh}>{whName(db, d.warehouseId)}</Text>
              </View>
              <Text style={st.dmgQty}>{formatQty(d.qty)} {prod?.unit || ''}</Text>
            </View>
          );
        })}
      </Card>

    </Screen>
  );
}

const st = StyleSheet.create({
  note: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  dmgRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.warningSoft, borderRadius: 10, padding: 12 },
  dmgName: { fontSize: 13, fontWeight: '600', color: colors.text },
  dmgWh: { fontSize: 11, color: colors.textMuted },
  dmgQty: { fontSize: 14, fontWeight: '700', color: colors.warning },
});
