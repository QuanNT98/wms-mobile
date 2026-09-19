import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useDb } from '../../src/store/DbContext';
import { useToast } from '../../src/components/Toast';
import { getManageableWarehouses } from '../../src/engine/permissions';
import { createInputOrder } from '../../src/engine/engine';
import { Button } from '../../src/components/ui';
import { Select } from '../../src/components/Select';
import { FooterSummary, FormScreen, FormSection } from '../../src/components/FormScreen';
import { DraftItem, ItemsEditor, buildProductOptions, draftSummary, draftToItems, makeDraftItem } from '../../src/components/ItemsEditor';
import { formatQty, formatVND } from '../../src/utils/format';
import { whOptions } from '../../src/utils/labels';

export default function NewOrderInScreen() {
  const router = useRouter();
  const toast = useToast();
  const { db, user, mutate } = useDb();
  const suppliers = useMemo(() => db.partners.filter((p) => p.type === 'SUPPLIER'), [db.partners]);
  const manageable = useMemo(() => getManageableWarehouses(db, user), [db, user]);

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [warehouseId, setWarehouseId] = useState(manageable[0]?.id || '');
  const [rows, setRows] = useState<DraftItem[]>(() => [makeDraftItem(db, 'in', buildProductOptions(db, 'in', ''))]);

  useEffect(() => { if (!suppliers.some((x) => x.id === supplierId)) setSupplierId(suppliers[0]?.id || ''); }, [suppliers, supplierId]);
  useEffect(() => { if (!manageable.some((w) => w.id === warehouseId)) setWarehouseId(manageable[0]?.id || ''); }, [manageable, warehouseId]);

  const sum = draftSummary(rows);

  const submit = () => {
    if (!warehouseId) return toast.error('Không có vị trí kho/xe nào bạn được phép tạo đơn nhập');
    const items = draftToItems(rows, true);
    if (items.length === 0) return toast.error('Vui lòng thêm ít nhất 1 sản phẩm');
    const ok = mutate((d, u) => createInputOrder(d, u, supplierId, warehouseId, items), 'Đã tạo đơn nhập hàng');
    if (ok) router.back();
  };

  return (
    <FormScreen
      footer={
        <FooterSummary label={`${sum.count} mặt hàng · ${formatQty(sum.qty)} SP`} value={formatVND(sum.total)}>
          <Button title="Tạo đơn nhập" icon="check" onPress={submit} disabled={sum.count === 0} />
        </FooterSummary>
      }
    >
      <FormSection title="Thông tin đơn" hint="Bạn chỉ có thể tạo đơn nhập cho kho/xe mà bạn được chỉ định quản lý.">
        <Select label="Đối tác cung cấp" required value={supplierId} options={suppliers.map((x) => ({ value: x.id, label: x.name, sub: x.id }))} onChange={setSupplierId} placeholder="Chưa có nhà cung cấp" />
        <Select label="Kho / xe nhận hàng" required value={warehouseId} options={whOptions(manageable)} onChange={setWarehouseId} placeholder="Không có vị trí được phép" />
      </FormSection>
      <FormSection title="Sản phẩm nhập kho" hint="Đơn giá tự điền theo giá nhập tham khảo, có thể sửa theo từng đơn.">
        <ItemsEditor db={db} mode="in" sourceWarehouseId="" rows={rows} onChange={setRows} />
      </FormSection>
    </FormScreen>
  );
}
