import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useDb } from '../../../src/store/DbContext';
import { isAdmin } from '../../../src/engine/permissions';
import { countPendingTasks } from '../../../src/utils/tasks';
import { Card, IconChip, Screen, SectionHeader } from '../../../src/components/ui';
import { colors, radius, spacing, Tone, type } from '../../../src/theme';

type IconName = keyof typeof Feather.glyphMap;
interface Item { route: string; title: string; sub: string; icon: IconName; tone: Tone; badge?: number }

// Danh sách dạng hàng (list rows) thay cho lưới ô vuông: quét mắt nhanh hơn, có mô tả phụ
function MenuList({ items }: { items: Item[] }) {
  const router = useRouter();
  return (
    <Card padded={false}>
      {items.map((it, i) => (
        <TouchableOpacity key={it.route} style={[s.row, i < items.length - 1 && s.rowBorder]} activeOpacity={0.7} onPress={() => router.push(`/(app)/${it.route}` as never)}>
          <IconChip icon={it.icon} tone={it.tone} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={type.body}>{it.title}</Text>
            <Text style={type.caption}>{it.sub}</Text>
          </View>
          {it.badge ? <View style={s.badge}><Text style={s.badgeText}>{it.badge}</Text></View> : null}
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </Card>
  );
}

export default function MoreScreen() {
  const { db, user, logout, resetData } = useDb();
  const admin = isAdmin(user);
  const tasks = countPendingTasks(db, user);
  const managed = user?.warehouseId ? db.warehouses.find((w) => w.id === user.warehouseId) : null;

  const confirmLogout = () => Alert.alert('Đăng xuất', 'Bạn muốn đăng xuất khỏi ứng dụng?', [
    { text: 'Hủy', style: 'cancel' },
    { text: 'Đăng xuất', style: 'destructive', onPress: logout },
  ]);

  const daily: Item[] = [
    { route: 'incidents', title: 'Báo mất / hỏng / hoàn trả', sub: 'Ghi nhận sự cố hàng đang giữ', icon: 'alert-triangle', tone: 'orange', badge: tasks.incidents },
    { route: 'inventory', title: 'Tồn kho chi tiết', sub: 'Theo từng kho, xe, nhân viên', icon: 'layers', tone: 'info' },
    { route: 'locations', title: 'Kho & bãi', sub: 'Điểm lưu kho cố định và di động', icon: 'map-pin', tone: 'teal' },
  ];
  const adminItems: Item[] = [
    { route: 'partners', title: 'Đối tác & khách hàng', sub: 'Nhà cung cấp, đại lý', icon: 'users', tone: 'violet' },
    { route: 'fleet', title: 'Nhân viên & xe', sub: 'Kho di động gắn với nhân viên', icon: 'truck', tone: 'primary' },
    { route: 'products', title: 'Sản phẩm', sub: 'SKU, đơn vị, giá tham khảo', icon: 'package', tone: 'neutral' },
    { route: 'users', title: 'Người dùng & phân quyền', sub: 'Tài khoản đăng nhập', icon: 'shield', tone: 'danger' },
    { route: 'accounting', title: 'Cân đối kế toán', sub: 'Nhập – xuất – tồn theo kỳ', icon: 'bar-chart-2', tone: 'success' },
  ];

  return (
    <Screen>
      <Card style={s.userCard}>
        <View style={[s.avatar, { backgroundColor: admin ? colors.danger : colors.primary }]}>
          <Feather name={admin ? 'shield' : 'user'} size={22} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.title}>{user?.name}</Text>
          <Text style={type.caption}>{admin ? 'Quản trị viên · toàn quyền' : `Quản lý: ${managed?.name || 'Chưa gán vị trí'}`}</Text>
        </View>
      </Card>

      <SectionHeader title="Nghiệp vụ khác" />
      <MenuList items={daily} />

      {admin ? (<><SectionHeader title="Danh mục & quản trị" /><MenuList items={adminItems} /></>) : null}

      {admin ? (
        <Card padded={false}>
          <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={resetData}>
            <IconChip icon="rotate-ccw" tone="neutral" size={40} />
            <View style={{ flex: 1 }}>
              <Text style={type.body}>Đặt lại dữ liệu demo</Text>
              <Text style={type.caption}>Khôi phục toàn bộ về trạng thái ban đầu</Text>
            </View>
          </TouchableOpacity>
        </Card>
      ) : null}

      <TouchableOpacity style={s.logout} onPress={confirmLogout} activeOpacity={0.7}>
        <Feather name="log-out" size={16} color={colors.danger} />
        <Text style={s.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
      <Text style={[type.caption, { textAlign: 'center' }]}>Quản Lý Kho v1.0 · dữ liệu lưu trên máy</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.dangerSoft, height: 48, borderRadius: radius.md, marginTop: spacing.sm },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});
