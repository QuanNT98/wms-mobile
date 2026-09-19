import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useDb } from '@/store/DbContext';
import { isAdmin } from '@/engine/permissions';
import { NoAccess } from '@/components/domain/NoAccess';
import { Card, EmptyText, IconChip, SectionHeader } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { Fab } from '@/components/layout/Fab';
import { colors, spacing, type } from '@/theme';
import { formatQty, formatVND } from '@/utils/format';

export default function ProductsScreen() {
  const router = useRouter();
  const { db, user } = useDb();
  if (!isAdmin(user)) return <NoAccess />;

  const totalValue = db.products.reduce((sum, p) => sum + db.inventory.filter((i) => i.sku === p.sku).reduce((q, i) => q + i.qty, 0) * (p.buyPrice || 0), 0);

  return (
    <Screen fab={<Fab label="Thêm" onPress={() => router.push('/(app)/catalog/products/new' as never)} />}>
      <SectionHeader title={`Giá trị tồn ${formatVND(totalValue)}`} count={db.products.length} />
      {db.products.length === 0 ? <EmptyText icon="package">Chưa có sản phẩm nào</EmptyText> : (
        <Card padded={false}>
          {db.products.map((p, i) => {
            const stock = db.inventory.filter((x) => x.sku === p.sku).reduce((sum, x) => sum + x.qty, 0);
            return (
              <TouchableOpacity key={p.sku} style={[s.row, i < db.products.length - 1 && s.rowBorder]} activeOpacity={0.7} onPress={() => router.push({ pathname: '/(app)/catalog/products/[sku]', params: { sku: p.sku } } as never)}>
                <IconChip icon="package" tone="neutral" size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={type.body} numberOfLines={1}>{p.name}</Text>
                  <Text style={type.caption} numberOfLines={1}>{p.sku} · nhập {formatVND(p.buyPrice)} · bán {formatVND(p.sellPrice)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.stock}>{formatQty(stock)}</Text>
                  <Text style={type.caption}>{p.unit}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  stock: { fontSize: 15, fontWeight: '800', color: colors.text },
});
