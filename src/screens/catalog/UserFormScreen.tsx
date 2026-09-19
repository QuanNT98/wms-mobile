import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDb } from '@/store/DbContext';
import { isAdmin } from '@/engine/permissions';
import { addOrUpdateUser } from '@/engine/engine';
import { NoAccess } from '@/components/domain/NoAccess';
import { Button, Field } from '@/components/ui';
import { Select } from '@/components/ui/Select';
import { FormScreen, FormSection } from '@/components/layout/FormScreen';
import { Role } from '@/types';
import { whOptions } from '@/utils/labels';

export default function UserFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { db, user, mutate } = useDb();
  const existing = id ? db.users.find((u) => u.id === id) : undefined;
  const [f, setF] = useState({ username: existing?.username || '', password: existing?.password || '', name: existing?.name || '', role: (existing?.role || 'MANAGER') as Role, warehouseId: existing?.warehouseId || '' });
  if (!isAdmin(user)) return <NoAccess />;

  const save = () => {
    const ok = mutate((d, u) => addOrUpdateUser(d, u, existing?.id || '', f.username, f.password, f.name, f.role, f.warehouseId), existing ? 'Đã cập nhật tài khoản' : 'Đã tạo tài khoản');
    if (ok) router.back();
  };

  return (
    <FormScreen footer={<Button title={existing ? 'Lưu thay đổi' : 'Tạo tài khoản'} icon="check" onPress={save} />}>
      <FormSection title="Đăng nhập">
        <Field label="Tên đăng nhập" required placeholder="VD: qlkho4" value={f.username} onChangeText={(t) => setF({ ...f, username: t })} autoCorrect={false} />
        <Field label="Mật khẩu" required placeholder="Mật khẩu đăng nhập" value={f.password} onChangeText={(t) => setF({ ...f, password: t })} autoCorrect={false} />
        <Field label="Họ tên" required placeholder="VD: Lê Thị C" value={f.name} onChangeText={(t) => setF({ ...f, name: t })} autoCapitalize="words" />
      </FormSection>
      <FormSection title="Phân quyền" hint="Quản trị viên có toàn quyền. Quản lý kho/xe chỉ được tạo đơn & xác nhận tại vị trí được chỉ định.">
        <Select
          label="Vai trò" required value={f.role}
          options={[
            { value: 'MANAGER', label: 'Quản lý kho / xe', sub: 'Gắn với 1 vị trí' },
            { value: 'ADMIN', label: 'Quản trị viên', sub: 'Toàn quyền hệ thống' },
          ]}
          onChange={(v) => setF({ ...f, role: v as Role })}
        />
        {f.role === 'MANAGER' ? (
          <Select label="Kho / xe được quản lý" required value={f.warehouseId} options={whOptions(db.warehouses)} onChange={(v) => setF({ ...f, warehouseId: v })} placeholder="Chọn vị trí" />
        ) : null}
      </FormSection>
    </FormScreen>
  );
}
