import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDb } from '@/store/DbContext';
import { isAdmin } from '@/engine/permissions';
import { addOrUpdateWarehouse } from '@/engine/engine';
import { NoAccess } from '@/components/domain/NoAccess';
import { Button, Field } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { FormScreen, FormSection } from '@/components/layout/FormScreen';
import { FixedWarehouseType } from '@/types';
import { WH_TYPE_LABEL } from '@/utils/labels';

export default function WarehouseFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db, user, mutate } = useDb();
  const existing = id ? db.warehouses.find((w) => w.id === id) : undefined;
  const [f, setF] = useState({ id: existing?.id || '', name: existing?.name || '', type: (existing?.type || 'CENTRAL') as FixedWarehouseType, location: existing?.location || '' });
  if (!isAdmin(user)) return <NoAccess />;

  const save = () => {
    const ok = mutate((d, u) => addOrUpdateWarehouse(d, u, existing?.id || '', f.id, f.name, f.type, f.location), existing ? 'Đã cập nhật kho' : 'Đã thêm kho');
    if (ok) router.back();
  };

  return (
    <FormScreen footer={<Button title={existing ? 'Lưu thay đổi' : 'Thêm kho'} icon="check" onPress={save} />}>
      <FormSection title="Kho / bãi cố định" hint="Kho di động (xe / nhân viên) được tạo tự động từ mục Nhân viên & xe.">
        <Field label="Mã kho" required placeholder="VD: KH004" value={f.id} onChangeText={(t) => setF({ ...f, id: t })} autoCapitalize="characters" />
        <Field label="Tên kho / bãi" required placeholder="VD: Kho Chi Nhánh Hải Phòng" value={f.name} onChangeText={(t) => setF({ ...f, name: t })} autoCapitalize="words" />
        <Select
          label="Loại kho" required value={f.type}
          options={[
            { value: 'CENTRAL', label: WH_TYPE_LABEL.CENTRAL },
            { value: 'SUB', label: WH_TYPE_LABEL.SUB },
            { value: 'YARD', label: WH_TYPE_LABEL.YARD },
          ]}
          onChange={(v) => setF({ ...f, type: v as FixedWarehouseType })}
        />
        <Field label="Địa chỉ / vị trí" required placeholder="VD: Ngô Quyền, Hải Phòng" value={f.location} onChangeText={(t) => setF({ ...f, location: t })} autoCapitalize="sentences" />
      </FormSection>
    </FormScreen>
  );
}
