import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useDb } from '../../../src/store/DbContext';
import { canManageWarehouse, getManageableWarehouses } from '../../../src/engine/permissions';
import { processInputOrder } from '../../../src/engine/engine';
import { Button, EmptyText, Hint, Screen } from '../../../src/components/ui';
import { Chips } from '../../../src/components/Chips';
import { Fab } from '../../../src/components/Fab';
import { OrderCard } from '../../../src/components/OrderCard';
import { ORDER_IN_STATUS, partnerName, whName, whShort } from '../../../src/utils/labels';

type Filter = 'MINE' | 'ALL';

export default function OrdersInScreen() {
  const router = useRouter();
  const { db, user, mutate } = useDb();
  const manageable = useMemo(() => getManageableWarehouses(db, user), [db, user]);

  const [filter, setFilter] = useState<Filter>('MINE');
  const process = (id: string, action: 'RECEIVE' | 'CANCEL') => {
    if (action === 'CANCEL') {
      Alert.alert('Hủy đơn', 'Xác nhận hủy đơn nhập này?', [
        { text: 'Không', style: 'cancel' },
        { text: 'Hủy đơn', style: 'destructive', onPress: () => mutate((d, u) => processInputOrder(d, u, id, action)) },
      ]);
      return;
    }
    mutate((d, u) => processInputOrder(d, u, id, action));
  };

  const mine = db.ordersIn.filter((o) => o.status === 'PENDING' && canManageWarehouse(user, o.warehouseId));
  const list = filter === 'MINE' ? mine : db.ordersIn;

  return (
    <Screen fab={manageable.length ? <Fab label="Tạo đơn nhập" onPress={() => router.push('/(app)/new-order-in' as never)} /> : undefined}>
      <Chips value={filter} onChange={setFilter} options={[{ value: 'MINE', label: 'Cần xử lý', count: mine.length }, { value: 'ALL', label: 'Tất cả', count: db.ordersIn.length }]} />
      {list.length === 0 ? <EmptyText>{filter === 'MINE' ? 'Không có đơn nhập nào chờ bạn xử lý' : 'Chưa có đơn nhập nào'}</EmptyText> : null}
      {list.map((o) => {
        const can = canManageWarehouse(user, o.warehouseId);
        return (
          <OrderCard
            key={o.id} id={o.id} timestamp={o.timestamp} status={ORDER_IN_STATUS[o.status]}
            from={partnerName(db, o.supplierId)} to={whShort(db, o.warehouseId)} db={db} items={o.items} withPrice
            secondaryActions={o.status === 'PENDING' ? (can ? <Button title="Hủy" size="sm" tone="danger" variant="soft" onPress={() => process(o.id, 'CANCEL')} /> : <Hint>Chờ kho đích xác nhận</Hint>) : null}
            actions={o.status === 'PENDING' && can ? <Button title="Nhập kho" size="sm" tone="success" icon="check" onPress={() => process(o.id, 'RECEIVE')} /> : null}
          />
        );
      })}

    </Screen>
  );
}
