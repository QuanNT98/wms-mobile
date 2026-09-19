import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useDb } from '@/store/DbContext';
import { useManageableWarehouses } from '@/hooks/useManageableWarehouses';
import { useToast } from '@/components/layout/Toast';
import { createIncident } from '@/engine/engine';
import { Button, Field } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { FooterSummary, FormScreen, FormSection } from '@/components/layout/FormScreen';
import { DraftItem, ItemsEditor, buildProductOptions, draftSummary, draftToItems, makeDraftItem } from '@/components/domain/ItemsEditor';
import { IncidentType } from '@/types';
import { formatQty } from '@/utils/format';
import { whOptions } from '@/utils/labels';

export default function NewIncidentScreen() {
  const router = useRouter();
  const toast = useToast();
  const { db, user, mutate } = useDb();
  const manageable = useManageableWarehouses();

  const [warehouseId, setWarehouseId] = useState(manageable[0]?.id || '');
  const [type, setType] = useState<IncidentType>('LOST');
  const [targetId, setTargetId] = useState(db.warehouses.find((w) => w.id !== manageable[0]?.id)?.id || '');
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<DraftItem[]>(() => [makeDraftItem(db, 'incident', buildProductOptions(db, 'incident', manageable[0]?.id || ''))]);
  const needsTarget = type === 'DAMAGED' || type === 'RETURN';

  useEffect(() => { if (!manageable.some((w) => w.id === warehouseId)) setWarehouseId(manageable[0]?.id || ''); }, [manageable, warehouseId]);

  const changeWarehouse = (id: string) => {
    setWarehouseId(id);
    setRows([makeDraftItem(db, 'incident', buildProductOptions(db, 'incident', id))]);
  };

  const sum = draftSummary(rows);
  const targetOptions = whOptions(db.warehouses.filter((w) => w.id !== warehouseId));

  const submit = () => {
    if (!warehouseId) return toast.error('Không có vị trí nào bạn được phép báo cáo');
    const items = draftToItems(rows, false);
    if (items.length === 0) return toast.error('Vui lòng chọn ít nhất 1 sản phẩm');
    const ok = mutate(
      (d, u) => createIncident(d, u, warehouseId, type, needsTarget ? targetId : null, items, note.trim()),
      type === 'LOST' ? 'Đã gửi báo mất, chờ Quản trị viên xác nhận' : 'Đã gửi báo cáo, chờ kho nhận xác nhận',
    );
    if (ok) router.back();
  };

  return (
    <FormScreen
      footer={
        <FooterSummary label="Báo cáo" value={`${sum.count} mặt hàng · ${formatQty(sum.qty)} SP`}>
          <Button title="Gửi báo cáo" icon="send" onPress={submit} disabled={sum.count === 0} />
        </FooterSummary>
      }
    >
      <FormSection title="Thông tin báo cáo" hint="Hàng sẽ được trừ khỏi tồn kho vị trí báo cáo ngay khi gửi và chờ xử lý.">
        <Select label="Vị trí báo cáo" required value={warehouseId} options={whOptions(manageable)} onChange={changeWarehouse} placeholder="Không có vị trí được phép" />
        <Select
          label="Loại báo cáo" required value={type}
          options={[
            { value: 'LOST', label: 'Báo mất', sub: 'Không thu hồi được, chờ Quản trị viên xác nhận' },
            { value: 'DAMAGED', label: 'Báo hỏng', sub: 'Thu hồi về kho để sửa hoặc thanh lý' },
            { value: 'RETURN', label: 'Hoàn trả', sub: 'Hàng còn dùng được, trả về kho' },
          ]}
          onChange={(v) => setType(v as IncidentType)}
        />
        {needsTarget ? (
          <Select label="Kho nhận thu hồi" required value={targetId} options={targetOptions} onChange={setTargetId} hint="Hàng ở trạng thái chờ thu hồi cho đến khi kho nhận xác nhận." />
        ) : null}
      </FormSection>
      <FormSection title="Sản phẩm liên quan">
        <ItemsEditor db={db} mode="incident" sourceWarehouseId={warehouseId} rows={rows} onChange={setRows} />
      </FormSection>
      <FormSection title="Ghi chú">
        <Field placeholder="Mô tả chi tiết sự việc (không bắt buộc)" multiline value={note} onChangeText={setNote} autoCapitalize="sentences" />
      </FormSection>
    </FormScreen>
  );
}
