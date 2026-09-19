import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDb } from '@/store/DbContext';
import { isAdmin } from '@/engine/permissions';
import { addOrUpdateDriver } from '@/engine/engine';
import { NoAccess } from '@/components/domain/NoAccess';
import { Button, Field } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { FormScreen, FormSection } from '@/components/layout/FormScreen';
import { HoldingType } from '@/types';

export default function DriverFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db, user, mutate } = useDb();
  const existing = id ? db.drivers.find((d) => d.id === id) : undefined;
  const [f, setF] = useState({ id: existing?.id || '', name: existing?.name || '', holdingType: (existing?.holdingType || 'VEHICLE') as HoldingType, plate: existing?.plate || '', phone: existing?.phone || '' });
  if (!isAdmin(user)) return <NoAccess />;
  const isVehicle = f.holdingType === 'VEHICLE';

  const save = () => {
    const ok = mutate((d, u) => addOrUpdateDriver(d, u, existing?.id || '', f.id, f.name, f.holdingType, f.plate, f.phone), existing ? 'Đã cập nhật nhân viên' : 'Đã thêm nhân viên và tạo kho di động');
    if (ok) router.back();
  };

  return (
    <FormScreen footer={<Button title={existing ? 'Lưu thay đổi' : 'Thêm nhân viên'} icon="check" onPress={save} />}>
      <FormSection title="Nhân viên" hint='Nhân viên được giao xe hoặc cầm giữ thiết bị/vật tư đều được xem là một "kho di động".'>
        <Field label="Mã kho xe / nhân viên" required placeholder="VD: XE-03 hoặc NV-NGUYENVANA" value={f.id} onChangeText={(t) => setF({ ...f, id: t })} autoCapitalize="characters" />
        <Field label="Tên nhân viên / tài xế" required placeholder="VD: Nguyễn Văn A" value={f.name} onChangeText={(t) => setF({ ...f, name: t })} autoCapitalize="words" />
        <Field label="Số điện thoại" required placeholder="VD: 0912345678" keyboardType="phone-pad" value={f.phone} onChangeText={(t) => setF({ ...f, phone: t })} />
      </FormSection>
      <FormSection title="Loại nắm giữ">
        <Select
          label="Loại" required value={f.holdingType}
          options={[
            { value: 'VEHICLE', label: 'Xe', sub: 'Phương tiện vận chuyển' },
            { value: 'EQUIPMENT', label: 'Thiết bị / vật tư', sub: 'Cấp phát cho nhân viên, không có xe' },
          ]}
          onChange={(v) => setF({ ...f, holdingType: v as HoldingType })}
        />
        <Field
          label={isVehicle ? 'Biển số xe' : 'Mã thiết bị / số quản lý'}
          required={isVehicle}
          placeholder={isVehicle ? 'VD: 51C-999.88' : 'VD: TB-0021 (có thể bỏ trống)'}
          value={f.plate} onChangeText={(t) => setF({ ...f, plate: t })} autoCapitalize="characters"
        />
      </FormSection>
    </FormScreen>
  );
}
