import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useDb } from '@/store/DbContext';
import { useManageableWarehouses } from '@/hooks/useManageableWarehouses';
import { useToast } from '@/components/layout/Toast';
import { isMobileWarehouse } from '@/engine/permissions';
import { createOutputOrder } from '@/engine/engine';
import { Button } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { FooterSummary, FormScreen, FormSection } from '@/components/layout/FormScreen';
import { DraftItem, ItemsEditor, buildProductOptions, draftSummary, draftToItems, makeDraftItem } from '@/components/domain/ItemsEditor';
import { formatQty, formatVND } from '@/utils/format';
import { whOptions } from '@/utils/labels';

export default function NewOrderOutScreen() {
  const router = useRouter();
  const toast = useToast();
  const { db, user, mutate } = useDb();
  const customers = useMemo(() => db.partners.filter((p) => p.type === 'CUSTOMER'), [db.partners]);
  const manageable = useManageableWarehouses();
  const mobileWarehouses = useMemo(() => db.warehouses.filter(isMobileWarehouse), [db.warehouses]);

  const [warehouseId, setWarehouseId] = useState(manageable[0]?.id || '');
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [vehicleId, setVehicleId] = useState('');
  const [rows, setRows] = useState<DraftItem[]>(() => [makeDraftItem(db, 'out', buildProductOptions(db, 'out', manageable[0]?.id || ''))]);

  useEffect(() => { if (!customers.some((c) => c.id === customerId)) setCustomerId(customers[0]?.id || ''); }, [customers, customerId]);
  useEffect(() => { if (!manageable.some((w) => w.id === warehouseId)) setWarehouseId(manageable[0]?.id || ''); }, [manageable, warehouseId]);

  // Đổi kho nguồn -> danh sách sản phẩm khả dụng đổi theo
  const changeWarehouse = (id: string) => {
    setWarehouseId(id);
    setRows([makeDraftItem(db, 'out', buildProductOptions(db, 'out', id))]);
  };

  const sum = draftSummary(rows);

  const submit = () => {
    if (!warehouseId) return toast.error('Không có vị trí kho/xe nào bạn được phép xuất hàng');
    const items = draftToItems(rows, true);
    if (items.length === 0) return toast.error('Vui lòng thêm ít nhất 1 sản phẩm');
    const ok = mutate(
      (d, u) => createOutputOrder(d, u, warehouseId, customerId, items, vehicleId || null),
      vehicleId ? 'Đã tạo đơn xuất, hàng sẽ giao qua xe đã chọn' : 'Đã tạo đơn xuất, khách tự đến kho nhận',
    );
    if (ok) router.back();
  };

  return (
    <FormScreen
      footer={
        <FooterSummary label={`${sum.count} mặt hàng · ${formatQty(sum.qty)} SP`} value={formatVND(sum.total)}>
          <Button title="Tạo đơn xuất" icon="check" onPress={submit} disabled={sum.count === 0} />
        </FooterSummary>
      }
    >
      <FormSection title="Thông tin đơn" hint="Bạn chỉ có thể xuất hàng từ kho/xe mà bạn được chỉ định quản lý.">
        <Select label="Kho / xe xuất hàng" required value={warehouseId} options={whOptions(manageable)} onChange={changeWarehouse} placeholder="Không có vị trí được phép" />
        <Select label="Khách hàng nhận" required value={customerId} options={customers.map((c) => ({ value: c.id, label: c.name, sub: c.id }))} onChange={setCustomerId} placeholder="Chưa có khách hàng" />
      </FormSection>
      <FormSection title="Hình thức giao" hint="Chọn xe/nhân viên: hàng lên xe, giao xong cho khách mới hoàn tất đơn. Để trống: khách tự đến kho nhận, đơn hoàn tất ngay khi xuất kho.">
        <Select
          label="Xe / nhân viên giao hàng"
          value={vehicleId}
          options={[{ value: '', label: 'Khách tự đến kho nhận hàng' }, ...whOptions(mobileWarehouses)]}
          onChange={setVehicleId}
        />
      </FormSection>
      <FormSection title="Sản phẩm xuất kho">
        <ItemsEditor db={db} mode="out" sourceWarehouseId={warehouseId} rows={rows} onChange={setRows} />
      </FormSection>
    </FormScreen>
  );
}
