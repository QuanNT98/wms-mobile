import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDb } from '@/store/DbContext';
import { isAdmin } from '@/engine/permissions';
import { addOrUpdateProduct } from '@/engine/engine';
import { NoAccess } from '@/components/domain/NoAccess';
import { Button, Field, Row } from '@/components/ui';
import { FormScreen, FormSection } from '@/components/layout/FormScreen';

export default function ProductFormScreen() {
  const router = useRouter();
  const { sku } = useLocalSearchParams<{ sku?: string }>();
  const { db, user, mutate } = useDb();
  const existing = sku ? db.products.find((p) => p.sku === sku) : undefined;
  const [f, setF] = useState({ sku: existing?.sku || '', name: existing?.name || '', unit: existing?.unit || '', buyPrice: existing ? String(existing.buyPrice || 0) : '', sellPrice: existing ? String(existing.sellPrice || 0) : '' });
  if (!isAdmin(user)) return <NoAccess />;

  const save = () => {
    const ok = mutate((d, u) => addOrUpdateProduct(d, u, existing?.sku || '', f.sku, f.name, f.unit, f.buyPrice, f.sellPrice), existing ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
    if (ok) router.back();
  };

  return (
    <FormScreen footer={<Button title={existing ? 'Lưu thay đổi' : 'Thêm sản phẩm'} icon="check" onPress={save} />}>
      <FormSection title="Sản phẩm">
        <Field label="Mã SKU" required placeholder="VD: SKU-100" value={f.sku} onChangeText={(t) => setF({ ...f, sku: t })} autoCapitalize="characters" />
        <Field label="Tên sản phẩm" required placeholder="VD: Thùng Carton X" value={f.name} onChangeText={(t) => setF({ ...f, name: t })} autoCapitalize="sentences" />
        <Field label="Đơn vị tính" required placeholder="VD: Thùng, Cái, Bộ" value={f.unit} onChangeText={(t) => setF({ ...f, unit: t })} autoCapitalize="sentences" />
      </FormSection>
      <FormSection title="Giá tham khảo" hint="Tự điền khi tạo đơn nhập/xuất, vẫn sửa được theo từng đơn.">
        <Row>
          <Field label="Giá nhập (đ)" placeholder="0" keyboardType="number-pad" value={f.buyPrice} onChangeText={(t) => setF({ ...f, buyPrice: t.replace(/[^0-9]/g, '') })} style={{ flex: 1 }} />
          <Field label="Giá bán (đ)" placeholder="0" keyboardType="number-pad" value={f.sellPrice} onChangeText={(t) => setF({ ...f, sellPrice: t.replace(/[^0-9]/g, '') })} style={{ flex: 1 }} />
        </Row>
      </FormSection>
    </FormScreen>
  );
}
