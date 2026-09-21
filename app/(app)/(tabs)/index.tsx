import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDb } from '@/store/DbContext';
import { isAdmin, isMobileWarehouse } from '@/engine/permissions';
import { Card, EmptyText, IconChip, SectionHeader, StatCard } from '@/components/ui';
import { Screen } from '@/components/layout/Screen';
import { colors, radius, shadow, spacing, Tone, tone, type } from '@/theme';
import { formatQty } from '@/utils/format';
import { DB } from '@/types';
import { PendingTask, usePendingTasks } from '@/hooks/usePendingTasks';

type IconName = keyof typeof Feather.glyphMap;
function TaskList({ tasks }: { tasks: PendingTask[] }) {
  const router = useRouter();
  if (tasks.length === 0) {
    return (
      <Card style={s.doneCard}>
        <View style={s.doneIcon}><Feather name="check" size={18} color={colors.success} /></View>
        <View style={{ flex: 1 }}>
          <Text style={type.heading}>Đã xử lý hết</Text>
          <Text style={type.caption}>Không có việc nào đang chờ bạn</Text>
        </View>
      </Card>
    );
  }
  const shown = tasks.slice(0, 6);
  const hidden = tasks.length - shown.length;
  return (
    <Card padded={false}>
      {shown.map((t, i) => (
        <TouchableOpacity key={t.key} style={[s.task, (i < shown.length - 1 || hidden > 0) && s.taskBorder]} activeOpacity={0.7} onPress={() => router.push(t.route as never)}>
          <IconChip icon={t.icon} tone={t.tone} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={type.body}>{t.title}</Text>
            <Text style={type.caption} numberOfLines={2}>{t.sub}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
      {hidden > 0 ? <Text style={[type.caption, { textAlign: 'center', padding: 12 }]}>+ {hidden} việc khác — xem trong từng tab</Text> : null}
    </Card>
  );
}

// Hiện cho admin khi dữ liệu còn trắng (sau "Danh sách trắng"): gợi ý thứ tự nhập dữ liệu để dùng thử
function SetupGuide({ db }: { db: DB }) {
  const router = useRouter();
  const steps: { done: boolean; title: string; sub: string; icon: IconName; route: string }[] = [
    { done: db.warehouses.length > 0, title: 'Thêm kho / bãi', sub: 'Điểm lưu hàng cố định của bạn', icon: 'map-pin', route: '/(app)/catalog/locations/new' },
    { done: db.products.length > 0, title: 'Thêm sản phẩm', sub: 'SKU, đơn vị tính, giá tham khảo', icon: 'package', route: '/(app)/catalog/products/new' },
    { done: db.partners.length > 0, title: 'Thêm đối tác / khách hàng', sub: 'Nhà cung cấp để nhập, khách hàng để xuất', icon: 'users', route: '/(app)/catalog/partners/new' },
    { done: db.drivers.length > 0, title: 'Thêm nhân viên / xe', sub: 'Kho di động để giao hàng (không bắt buộc)', icon: 'truck', route: '/(app)/catalog/fleet/new' },
    { done: db.users.length > 1, title: 'Tạo tài khoản quản lý kho', sub: 'Gán mỗi tài khoản cho 1 kho / xe', icon: 'shield', route: '/(app)/catalog/users/new' },
  ];
  const remaining = steps.filter((x) => !x.done).length;
  if (remaining === 0) return null;
  return (
    <>
      <SectionHeader title="Bắt đầu sử dụng" count={remaining} />
      <Card padded={false}>
        {steps.map((st, i) => (
          <TouchableOpacity key={st.route} style={[s.task, i < steps.length - 1 && s.taskBorder, st.done && { opacity: 0.5 }]} activeOpacity={0.7} onPress={() => router.push(st.route as never)} disabled={st.done}>
            <IconChip icon={st.done ? 'check' : st.icon} tone={st.done ? 'success' : 'primary'} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={[type.body, st.done && { textDecorationLine: 'line-through' }]}>{st.title}</Text>
              <Text style={type.caption} numberOfLines={2}>{st.sub}</Text>
            </View>
            {!st.done ? <Feather name="chevron-right" size={18} color={colors.textMuted} /> : null}
          </TouchableOpacity>
        ))}
      </Card>
    </>
  );
}

function QuickActions() {
  const router = useRouter();
  const actions: { title: string; icon: IconName; tone: Tone; route: string }[] = [
    { title: 'Tạo đơn xuất', icon: 'upload', tone: 'warning', route: '/(app)/(tabs)/orders-out' },
    { title: 'Luân chuyển', icon: 'repeat', tone: 'info', route: '/(app)/(tabs)/internal' },
    { title: 'Báo hỏng', icon: 'alert-triangle', tone: 'orange', route: '/(app)/incidents' },
    { title: 'Tồn kho', icon: 'layers', tone: 'violet', route: '/(app)/inventory' },
  ];
  return (
    <View style={s.quickRow}>
      {actions.map((a) => (
        <TouchableOpacity key={a.route} style={s.quick} activeOpacity={0.7} onPress={() => router.push(a.route as never)}>
          <View style={[s.quickIcon, { backgroundColor: tone(a.tone).soft }]}><Feather name={a.icon} size={22} color={tone(a.tone).solid} /></View>
          <Text style={s.quickText}>{a.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function StockList({ db, stock, accent }: { db: DB; stock: { sku: string; qty: number }[]; accent: string }) {
  return (
    <Card padded={false}>
      {stock.map((i, idx) => {
        const p = db.products.find((prod) => prod.sku === i.sku);
        return (
          <View key={i.sku} style={[s.itemRow, idx < stock.length - 1 && s.taskBorder]}>
            <View style={s.skuBox}><Feather name="package" size={16} color={colors.textSecondary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={type.body} numberOfLines={1}>{p?.name || i.sku}</Text>
              <Text style={type.caption}>{i.sku}</Text>
            </View>
            <Text style={[s.itemQty, { color: accent }]}>{formatQty(i.qty)} <Text style={s.itemUnit}>{p?.unit || ''}</Text></Text>
          </View>
        );
      })}
    </Card>
  );
}

export default function DashboardScreen() {
  const { db, user } = useDb();
  const admin = isAdmin(user);
  const tasks = usePendingTasks();
  const firstName = user?.name.split('(')[0].trim().split(' ').pop() || '';

  // ---------- MANAGER / TÀI XẾ ----------
  if (!admin) {
    const wh = db.warehouses.find((w) => w.id === user?.warehouseId);
    const stock = wh ? db.inventory.filter((i) => i.warehouseId === wh.id) : [];
    const total = stock.reduce((sum, i) => sum + i.qty, 0);
    const mobile = isMobileWarehouse(wh);
    return (
      <Screen>
        <LinearGradient colors={mobile ? ['#2B3F9E', '#3B5BDB'] : [colors.navy, '#2B3F9E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={s.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroGreeting}>Xin chào, {firstName}</Text>
              <Text style={s.heroTitle} numberOfLines={2}>{wh?.name || 'Chưa gán vị trí'}</Text>
              <Text style={s.heroSub}>{wh ? `${wh.id} · ${wh.location}` : ''}</Text>
            </View>
            <View style={s.heroIcon}><Feather name={mobile ? 'truck' : 'home'} size={24} color={colors.white} /></View>
          </View>
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={s.heroStatValue}>{formatQty(total)}</Text>
              <Text style={s.heroStatLabel}>Sản phẩm đang giữ</Text>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={[s.heroStatValue, tasks.length > 0 && { color: '#FFD166' }]}>{tasks.length}</Text>
              <Text style={s.heroStatLabel}>Việc cần làm</Text>
            </View>
          </View>
        </LinearGradient>

        <QuickActions />

        <SectionHeader title="Việc cần làm" count={tasks.length} />
        <TaskList tasks={tasks} />

        <SectionHeader title="Hàng đang giữ" count={stock.length} />
        {stock.length === 0 ? <EmptyText icon="package">{mobile ? 'Hiện tại xe trống' : 'Kho hiện không có hàng'}</EmptyText> : <StockList db={db} stock={stock} accent={colors.primary} />}
      </Screen>
    );
  }

  // ---------- ADMIN ----------
  const totalItems = db.inventory.reduce((sum, i) => sum + i.qty, 0);
  return (
    <Screen>
      <SetupGuide db={db} />
      <View style={s.grid}>
        <StatCard icon="users" label="Đối tác & khách hàng" value={`${db.partners.length}`} tone="violet" />
        <StatCard icon="truck" label="Xe / nhân viên" value={`${db.drivers.length}`} tone="primary" />
        <StatCard icon="file-text" label="Đơn nhập / xuất" value={`${db.ordersIn.length + db.ordersOut.length}`} tone="success" />
        <StatCard icon="layers" label="Tổng hàng tồn" value={formatQty(totalItems)} tone="info" />
      </View>

      <SectionHeader title="Việc cần xử lý" count={tasks.length} />
      <TaskList tasks={tasks} />

      <SectionHeader title="Tồn kho trên xe / nhân viên" count={db.drivers.length} />
      {db.drivers.length === 0 ? <EmptyText icon="truck">Chưa có nhân viên / xe nào</EmptyText> : null}
      {db.drivers.map((d) => {
        const stock = db.inventory.filter((i) => i.warehouseId === d.id);
        const total = stock.reduce((sum, i) => sum + i.qty, 0);
        return (
          <Card key={d.id} padded={false}>
            <View style={s.fleetHead}>
              <IconChip icon="truck" tone="primary" size={40} />
              <View style={{ flex: 1 }}>
                <Text style={type.body}>{d.name}</Text>
                <Text style={type.caption}>{d.plate || d.id}</Text>
              </View>
              <View style={s.totalPill}><Text style={s.totalPillText}>{formatQty(total)} SP</Text></View>
            </View>
            {stock.length === 0 ? (
              <Text style={[type.caption, { fontStyle: 'italic', padding: spacing.lg, paddingTop: 0 }]}>Hiện tại xe trống</Text>
            ) : stock.map((i, idx) => {
              const p = db.products.find((prod) => prod.sku === i.sku);
              return (
                <View key={i.sku} style={[s.fleetItem, idx < stock.length - 1 && s.taskBorder]}>
                  <Text style={[type.bodySm, { flex: 1 }]}>{p?.name || i.sku}</Text>
                  <Text style={[s.itemQty, { color: colors.primary, fontSize: 14 }]}>{formatQty(i.qty)} <Text style={s.itemUnit}>{p?.unit || ''}</Text></Text>
                </View>
              );
            })}
          </Card>
        );
      })}
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  hero: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.xl, ...shadow.float },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heroGreeting: { fontSize: 13, color: colors.textOnDarkMuted, fontWeight: '500', marginBottom: 4 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.white, letterSpacing: -0.3 },
  heroSub: { fontSize: 12, color: colors.textOnDarkMuted, marginTop: 4 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.lg, padding: spacing.lg },
  heroStat: { flex: 1, gap: 2 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: spacing.lg },
  heroStatValue: { fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  heroStatLabel: { fontSize: 12, color: colors.textOnDarkMuted, fontWeight: '500' },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quick: { alignItems: 'center', gap: 8, width: '23%' },
  quickIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  task: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg },
  taskBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doneIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, paddingVertical: 12 },
  skuBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.neutralSoft, alignItems: 'center', justifyContent: 'center' },
  itemQty: { fontSize: 16, fontWeight: '800' },
  itemUnit: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  fleetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  fleetItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, paddingVertical: 10 },
  totalPill: { backgroundColor: colors.primarySoft, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  totalPillText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
});
