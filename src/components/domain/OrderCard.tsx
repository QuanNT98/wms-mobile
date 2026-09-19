import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Badge } from '@/components/ui';
import { colors, shadow, spacing, Tone, type } from '@/theme';
import { DB, OrderItem } from '@/types';
import { formatQty, formatVND, orderTotal } from '@/utils/format';

interface OrderCardProps {
  id: string;
  timestamp: string;
  status: { text: string; tone: Tone };
  from: string;           // điểm đi (đối tác / kho nguồn)
  to: string;             // điểm đến (kho nhận / khách hàng)
  db: DB;
  items: OrderItem[];
  withPrice?: boolean;    // hiện đơn giá & tổng tiền
  meta?: React.ReactNode; // badge phụ (vd: xe giao, loại sự cố)
  note?: string;
  actions?: React.ReactNode;        // nút chính (bên phải)
  secondaryActions?: React.ReactNode; // nút phụ: hủy / trả lại (bên trái)
}

// Card thu gọn: chỉ hiện điều cần để ra quyết định; chạm vào card để xem chi tiết từng mặt hàng
export function OrderCard({ id, timestamp, status, from, to, db, items, withPrice, meta, note, actions, secondaryActions }: OrderCardProps) {
  const [open, setOpen] = useState(false);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const time = shortTime(timestamp);

  return (
    <View style={s.card}>
      <View style={{ flex: 1 }}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen((v) => !v)} style={s.inner}>
        {/* Dòng 1: mã · giờ — trạng thái */}
        <View style={s.head}>
          <View style={s.idRow}>
            <Text style={s.id}>{id}</Text>
            <Text style={s.time}>·  {time}</Text>
          </View>
          <Badge text={status.text} tone={status.tone} dot />
        </View>

        {/* Dòng 2: tuyến đi */}
        <View style={s.route}>
          <Text style={s.routeText} numberOfLines={1}>{from}</Text>
          <Feather name="arrow-right" size={14} color={colors.textMuted} />
          <Text style={[s.routeText, { color: colors.primaryDark }]} numberOfLines={1}>{to}</Text>
        </View>
        {meta ? <View style={{ marginTop: 2 }}>{meta}</View> : null}

        {/* Dòng 3: tóm tắt hàng — tổng tiền — nút mở */}
        <View style={s.summary}>
          <View style={s.countPill}><Text style={s.countText}>{items.length} mặt hàng</Text></View>
          <Text style={type.caption}>·  {formatQty(totalQty)} SP</Text>
          <View style={{ flex: 1 }} />
          {withPrice ? <Text style={s.total}>{formatVND(orderTotal(items))}</Text> : null}
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </View>

        {/* Chi tiết (ẩn mặc định) */}
        {open ? (
          <View style={s.details}>
            {items.map((it, i) => {
              const p = db.products.find((prod) => prod.sku === it.sku);
              return (
                <View key={`${it.sku}-${i}`} style={s.itemRow}>
                  <Text style={s.itemQty}>{formatQty(it.qty)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={type.bodySm} numberOfLines={1}>{p?.name || it.sku}</Text>
                    <Text style={type.caption}>{p?.unit || ''}{withPrice ? ` · ${formatVND(it.price || 0)}` : ''}</Text>
                  </View>
                  {withPrice ? <Text style={s.itemTotal}>{formatVND(it.qty * (it.price || 0))}</Text> : null}
                </View>
              );
            })}
            {note ? <Text style={[type.caption, { fontStyle: 'italic', marginTop: 4 }]}>Ghi chú: {note}</Text> : null}
          </View>
        ) : null}
      </TouchableOpacity>
      {actions || secondaryActions ? (
        <View style={s.actions}>
          {secondaryActions}
          {actions}
        </View>
      ) : null}
      </View>
    </View>
  );
}

// "08:15 · 19/09" ngắn hơn định dạng đầy đủ
function shortTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, flexDirection: 'row', overflow: 'hidden', ...shadow.card },
  inner: { flex: 1, padding: spacing.lg, paddingBottom: spacing.md, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  id: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', letterSpacing: -0.3 },
  time: { fontSize: 12, fontWeight: '500', color: colors.textMuted },
  route: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  routeText: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 1, lineHeight: 20 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  total: { fontSize: 15, fontWeight: '800', color: colors.text },
  details: { backgroundColor: colors.surfaceMuted, borderRadius: 10, padding: 10, gap: 8, marginTop: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemQty: { minWidth: 36, textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.text, backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 6, overflow: 'hidden' },
  itemTotal: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: 4 },
  countPill: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.hairline, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  countText: { fontSize: 11.5, fontWeight: '600', color: colors.textSecondary },
});
