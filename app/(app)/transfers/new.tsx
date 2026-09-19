import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useDb } from '@/store/DbContext';
import { useManageableWarehouses } from '@/hooks/useManageableWarehouses';
import { useToast } from '@/components/layout/Toast';
import { createTransfer } from '@/engine/engine';
import { Button } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { FooterSummary, FormScreen, FormSection } from '@/components/layout/FormScreen';
import { DraftItem, ItemsEditor, buildProductOptions, draftSummary, draftToItems, makeDraftItem } from '@/components/domain/ItemsEditor';
import { formatQty } from '@/utils/format';
import { whOptions } from '@/utils/labels';

export default function NewTransferScreen() {
  const router = useRouter();
  const toast = useToast();
  const { db, user, mutate } = useDb();
  const manageable = useManageableWarehouses();

  const [fromId, setFromId] = useState(manageable[0]?.id || '');
  const [toId, setToId] = useState(db.warehouses.find((w) => w.id !== manageable[0]?.id)?.id || '');
  const [rows, setRows] = useState<DraftItem[]>(() => [makeDraftItem(db, 'transfer', buildProductOptions(db, 'transfer', manageable[0]?.id || ''))]);

  useEffect(() => { if (!manageable.some((w) => w.id === fromId)) setFromId(manageable[0]?.id || ''); }, [manageable, fromId]);

  const changeFrom = (id: string) => {
    setFromId(id);
    setRows([makeDraftItem(db, 'transfer', buildProductOptions(db, 'transfer', id))]);
  };

  const sum = draftSummary(rows);
  const destOptions = whOptions(db.warehouses.filter((w) => w.id !== fromId));

  const submit = () => {
    if (!fromId) return toast.error('Không có vị trí kho/xe nào bạn được phép xuất hàng');
    const items = draftToItems(rows, false);
    if (items.length === 0) return toast.error('Vui lòng chọn sản phẩm luân chuyển');
    const ok = mutate((d, u) => createTransfer(d, u, fromId, toId, items), 'Đã tạo phiếu, chờ vị trí đích xác nhận nhận hàng');
    if (ok) router.back();
  };

  return (
    <FormScreen
      footer={
        <FooterSummary label="Luân chuyển" value={`${sum.count} mặt hàng · ${formatQty(sum.qty)} SP`}>
          <Button title="Tạo phiếu" icon="check" onPress={submit} disabled={sum.count === 0} />
        </FooterSummary>
      }
    >
      <FormSection title="Tuyến luân chuyển" hint="Hàng xuất khỏi nguồn ngay khi tạo phiếu (đang vận chuyển). Đích phải xác nhận đã nhận thì mới cộng vào tồn kho.">
        <Select label="Từ kho / xe (nguồn)" required value={fromId} options={whOptions(manageable)} onChange={changeFrom} placeholder="Không có vị trí được phép" />
        <Select label="Đến kho / xe (đích)" required value={toId} options={destOptions} onChange={setToId} />
      </FormSection>
      <FormSection title="Sản phẩm luân chuyển">
        <ItemsEditor db={db} mode="transfer" sourceWarehouseId={fromId} rows={rows} onChange={setRows} />
      </FormSection>
    </FormScreen>
  );
}
