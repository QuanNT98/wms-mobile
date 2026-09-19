import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useDb } from '@/store/DbContext';
import { useManageableWarehouses } from '@/hooks/useManageableWarehouses';
import { canManageWarehouse } from '@/engine/permissions';
import { cancelTransfer, confirmTransfer } from '@/engine/engine';
import { Button, EmptyText, Hint } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { Chips } from '@/components/ui/Chips';
import { Fab } from '@/components/layout/Fab';
import { OrderCard } from '@/components/domain/OrderCard';
import { TRANSFER_STATUS, whShort } from '@/utils/labels';

type Filter = 'MINE' | 'ALL';

export default function InternalScreen() {
  const router = useRouter();
  const { db, user, mutate } = useDb();
  const manageable = useManageableWarehouses();

  const [filter, setFilter] = useState<Filter>('MINE');
  const cancel = (id: string) => {
    Alert.alert('Hủy phiếu', 'Xác nhận hủy phiếu và hoàn trả hàng về kho/xe nguồn?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Hủy phiếu', style: 'destructive', onPress: () => mutate((d, u) => cancelTransfer(d, u, id)) },
    ]);
  };

  const mine = db.transfers.filter((t) => t.status === 'PENDING' && (canManageWarehouse(user, t.toId) || canManageWarehouse(user, t.fromId)));
  const list = filter === 'MINE' ? mine : db.transfers;

  return (
    <Screen fab={manageable.length ? <Fab label="Tạo phiếu" onPress={() => router.push('/(app)/transfers/new' as never)} /> : undefined}>
      <Chips value={filter} onChange={setFilter} options={[{ value: 'MINE', label: 'Cần xử lý', count: mine.length }, { value: 'ALL', label: 'Tất cả', count: db.transfers.length }]} />
      {list.length === 0 ? <EmptyText>{filter === 'MINE' ? 'Không có phiếu nào chờ bạn xử lý' : 'Chưa có phiếu luân chuyển nào'}</EmptyText> : null}
      {list.map((t) => {
        let actions: React.ReactNode = null;
        let secondary: React.ReactNode = null;
        if (t.status === 'PENDING') {
          const canConfirm = canManageWarehouse(user, t.toId);
          const canCancel = canManageWarehouse(user, t.fromId);
          if (canConfirm) actions = <Button title="Đã nhận hàng" size="sm" tone="success" icon="check" onPress={() => mutate((d, u) => confirmTransfer(d, u, t.id))} />;
          if (canCancel) secondary = <Button title="Hủy" size="sm" tone="danger" variant="soft" onPress={() => cancel(t.id)} />;
          if (!canConfirm && !canCancel) secondary = <Hint>Chờ kho đích xác nhận</Hint>;
        }
        return (
          <OrderCard key={t.id} id={t.id} timestamp={t.timestamp} status={TRANSFER_STATUS[t.status]} from={whShort(db, t.fromId)} to={whShort(db, t.toId)} db={db} items={t.items} actions={actions} secondaryActions={secondary} />
        );
      })}

    </Screen>
  );
}
