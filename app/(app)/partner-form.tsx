import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDb } from '../../src/store/DbContext';
import { isAdmin } from '../../src/engine/permissions';
import { addOrUpdatePartner } from '../../src/engine/engine';
import { NoAccess } from '../../src/components/NoAccess';
import { Button, Field } from '../../src/components/ui';
import { Select } from '../../src/components/Select';
import { FormScreen, FormSection } from '../../src/components/FormScreen';
import { PartnerType } from '../../src/types';

export default function PartnerFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db, user, mutate } = useDb();
  const existing = id ? db.partners.find((p) => p.id === id) : undefined;
  const [f, setF] = useState({ id: existing?.id || '', name: existing?.name || '', type: (existing?.type || 'SUPPLIER') as PartnerType, phone: existing?.phone || '', address: existing?.address || '' });
  if (!isAdmin(user)) return <NoAccess />;

  const save = () => {
    const ok = mutate((d, u) => addOrUpdatePartner(d, u, existing?.id || '', f.id, f.name, f.type, f.phone, f.address), existing ? 'Đã cập nhật đối tác' : 'Đã thêm đối tác');
    if (ok) router.back();
  };

  return (
    <FormScreen footer={<Button title={existing ? 'Lưu thay đổi' : 'Thêm đối tác'} icon="check" onPress={save} />}>
      <FormSection title="Thông tin đơn vị">
        <Field label="Mã đối tác" required placeholder="VD: DT001 hoặc KH001" value={f.id} onChangeText={(t) => setF({ ...f, id: t })} autoCapitalize="characters" />
        <Field label="Tên đơn vị / công ty" required placeholder="VD: Công ty SamSung VN" value={f.name} onChangeText={(t) => setF({ ...f, name: t })} autoCapitalize="words" />
        <Select
          label="Phân loại" required value={f.type}
          options={[
            { value: 'SUPPLIER', label: 'Đối tác đầu vào', sub: 'Nhà cung cấp' },
            { value: 'CUSTOMER', label: 'Khách hàng đầu ra', sub: 'Đại lý / người mua' },
          ]}
          onChange={(v) => setF({ ...f, type: v as PartnerType })}
        />
      </FormSection>
      <FormSection title="Liên hệ">
        <Field label="Số điện thoại" required placeholder="VD: 0988777666" keyboardType="phone-pad" value={f.phone} onChangeText={(t) => setF({ ...f, phone: t })} />
        <Field label="Địa chỉ" placeholder="VD: KCN Visip 1, Bình Dương" value={f.address} onChangeText={(t) => setF({ ...f, address: t })} autoCapitalize="sentences" />
      </FormSection>
    </FormScreen>
  );
}
