import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useDb } from '@/store/DbContext';
import { useManageableWarehouses } from '@/hooks/useManageableWarehouses';
import { canManageWarehouse } from '@/engine/permissions';
import { processOutputOrder, OutputOrderAction } from '@/engine/engine';
import { Badge, Button, EmptyText, Hint } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { Chips } from '@/components/ui/Chips';
import { Fab } from '@/components/layout/Fab';
import { OrderCard } from '@/components/domain/OrderCard';
import { ORDER_OUT_STATUS, partnerName, whShort } from '@/utils/labels';

type Filter = 'MINE' | 'ALL';

export default function OrdersOutScreen() {
  const router = useRouter();
  const { db, user, mutate } = useDb();
  const manageable = useManageableWarehouses();

  const [filter, setFilter] = useState<Filter>('MINE');
  const process = (id: string, action: OutputOrderAction) => {
    const confirmMsg: Partial<Record<OutputOrderAction, string>> = {
      CANCEL: 'Xác nhận hủy đơn xuất này?',
      START_RETURN: 'Giao không thành công - trả toàn bộ hàng của đơn về kho nguồn? Hàng sẽ rời khỏi xe, kho nguồn cần xác nhận đã nhận.',
    };
    const msg = confirmMsg[action];
    if (msg) {
      Alert.alert('Xác nhận', msg, [
        { text: 'Không', style: 'cancel' },
        { text: 'Đồng ý', style: 'destructive', onPress: () => mutate((d, u) => processOutputOrder(d, u, id, action)) },
      ]);
      return;
    }
    mutate((d, u) => processOutputOrder(d, u, id, action));
  };

  const isMine = (o: typeof db.ordersOut[number]) =>
    (o.status === 'PENDING' && canManageWarehouse(user, o.warehouseId)) ||
    (o.status === 'LOADED' && canManageWarehouse(user, o.deliveryVehicleId)) ||
    (o.status === 'RETURNING' && canManageWarehouse(user, o.warehouseId));
  const mine = db.ordersOut.filter(isMine);
  const list = filter === 'MINE' ? mine : db.ordersOut;

  return (
    <Screen fab={manageable.length ? <Fab label="Tạo đơn xuất" onPress={() => router.push('/(app)/orders/new-out' as never)} /> : undefined}>
      <Chips value={filter} onChange={setFilter} options={[{ value: 'MINE', label: 'Cần xử lý', count: mine.length }, { value: 'ALL', label: 'Tất cả', count: db.ordersOut.length }]} />
      {list.length === 0 ? <EmptyText>{filter === 'MINE' ? 'Không có đơn xuất nào chờ bạn xử lý' : 'Chưa có đơn xuất nào'}</EmptyText> : null}
      {list.map((o) => {
        const vehicle = o.deliveryVehicleId ? db.warehouses.find((w) => w.id === o.deliveryVehicleId) : null;
        let actions: React.ReactNode = null;
        let secondary: React.ReactNode = null;
        if (o.status === 'PENDING') {
          if (canManageWarehouse(user, o.warehouseId)) {
            actions = <Button title={o.deliveryVehicleId ? 'Xuất kho, giao xe' : 'Xuất kho'} size="sm" tone="warning" icon="upload" onPress={() => process(o.id, 'DELIVER')} />;
            secondary = <Button title="Hủy" size="sm" tone="danger" variant="soft" onPress={() => process(o.id, 'CANCEL')} />;
          } else secondary = <Hint>Chờ kho nguồn xử lý</Hint>;
        } else if (o.status === 'LOADED') {
          // Hàng đang trên xe: chỉ xe được xác nhận giao / trả về, kho nguồn chỉ theo dõi
          if (canManageWarehouse(user, o.deliveryVehicleId)) {
            actions = <Button title="Đã giao khách" size="sm" tone="success" icon="check" onPress={() => process(o.id, 'COMPLETE_DELIVERY')} />;
            secondary = <Button title="Trả về kho" size="sm" tone="neutral" variant="soft" onPress={() => process(o.id, 'START_RETURN')} />;
          } else secondary = <Hint>Đang chờ xe giao hàng xác nhận</Hint>;
        } else if (o.status === 'RETURNING') {
          if (canManageWarehouse(user, o.warehouseId)) {
            actions = <Button title="Đã nhận lại hàng" size="sm" tone="success" icon="check" onPress={() => process(o.id, 'CONFIRM_RETURN')} />;
          } else secondary = <Hint>Hàng đang về kho, chờ kho nguồn xác nhận</Hint>;
        }
        return (
          <OrderCard
            key={o.id} id={o.id} timestamp={o.timestamp} status={ORDER_OUT_STATUS[o.status]}
            from={whShort(db, o.warehouseId)} to={partnerName(db, o.customerId)} db={db} items={o.items} withPrice
            meta={vehicle ? <Badge icon="truck" text={`Giao qua ${whShort(db, vehicle.id)}`} tone="primary" /> : <Badge icon="user" text="Khách tự lấy hàng" tone="neutral" />}
            actions={actions} secondaryActions={secondary}
          />
        );
      })}

    </Screen>
  );
}
