import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DB, OrderItem } from '../types';
import { Select, SelectOption } from './Select';
import { styles as ui } from './ui';
import { colors, radius, spacing, type } from '../theme';
import { formatQty, formatVND } from '../utils/format';

export type ItemsMode = 'in' | 'out' | 'transfer' | 'incident';

export interface DraftItem { key: string; sku: string; qty: string; price: string }

export const newDraftKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// Đơn nhập: chọn trong toàn bộ SP. Còn lại: chỉ SP đang có tồn ở vị trí nguồn
export function buildProductOptions(db: DB, mode: ItemsMode, sourceWarehouseId: string): SelectOption[] {
  if (mode === 'in') {
    return db.products.map((p) => ({ value: p.sku, label: p.name, sub: `${p.sku} · ${p.unit} · giá nhập TK ${formatVND(p.buyPrice)}` }));
  }
  const available = db.inventory.filter((i) => i.warehouseId === sourceWarehouseId && i.qty > 0);
  return available.map((i) => {
    const p = db.products.find((prod) => prod.sku === i.sku);
    return { value: i.sku, label: p?.name || i.sku, sub: `${i.sku} · còn ${formatQty(i.qty)} ${p?.unit || ''}` };
  });
}

export function defaultPriceFor(db: DB, mode: ItemsMode, sku: string): string {
  const p = db.products.find((x) => x.sku === sku);
  if (!p) return '0';
  if (mode === 'in') return String(p.buyPrice || 0);
  if (mode === 'out') return String(p.sellPrice || 0);
  return '';
}

export function makeDraftItem(db: DB, mode: ItemsMode, options: SelectOption[], excludeSkus: string[] = []): DraftItem {
  const first = options.find((o) => !excludeSkus.includes(o.value)) || options[0];
  const sku = first?.value || '';
  return { key: newDraftKey(), sku, qty: '1', price: defaultPriceFor(db, mode, sku) };
}

export function draftToItems(rows: DraftItem[], hasPrice: boolean): OrderItem[] {
  const items: OrderItem[] = [];
  rows.forEach((r) => {
    const qty = parseInt(r.qty, 10);
    if (!r.sku || !(qty > 0)) return;
    const item: OrderItem = { sku: r.sku, qty };
    if (hasPrice) item.price = Math.max(0, parseFloat(r.price) || 0);
    items.push(item);
  });
  return items;
}

export function draftSummary(rows: DraftItem[]) {
  const count = rows.filter((r) => r.sku && (parseInt(r.qty, 10) || 0) > 0).length;
  const qty = rows.reduce((s, r) => s + (parseInt(r.qty, 10) || 0), 0);
  const total = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0), 0);
  return { count, qty, total };
}

interface ItemsEditorProps {
  db: DB;
  mode: ItemsMode;
  sourceWarehouseId: string;
  rows: DraftItem[];
  onChange: (rows: DraftItem[]) => void;
}

export function ItemsEditor({ db, mode, sourceWarehouseId, rows, onChange }: ItemsEditorProps) {
  const hasPrice = mode === 'in' || mode === 'out';
  const options = buildProductOptions(db, mode, sourceWarehouseId);

  const maxFor = (sku: string): number | null => {
    if (mode === 'in') return null;
    const st = db.inventory.find((i) => i.warehouseId === sourceWarehouseId && i.sku === sku);
    return st ? st.qty : 0;
  };

  const update = (key: string, patch: Partial<DraftItem>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) => onChange(rows.filter((r) => r.key !== key));
  const add = () => onChange([...rows, makeDraftItem(db, mode, options, rows.map((r) => r.sku))]);
  const step = (r: DraftItem, delta: number) => {
    const max = maxFor(r.sku);
    let next = (parseInt(r.qty, 10) || 0) + delta;
    if (next < 1) next = 1;
    if (max !== null && next > max) next = max;
    update(r.key, { qty: String(next) });
  };

  return (
    <View style={{ gap: spacing.md }}>
      {rows.length === 0 ? (
        <View style={s.emptyBox}>
          <Feather name="package" size={20} color={colors.textMuted} />
          <Text style={type.bodySm}>Chưa có sản phẩm nào</Text>
        </View>
      ) : null}

      {rows.map((r, idx) => {
        const max = maxFor(r.sku);
        const qtyNum = parseInt(r.qty, 10) || 0;
        const over = max !== null && qtyNum > max;
        const p = db.products.find((x) => x.sku === r.sku);
        const lineTotal = (parseFloat(r.qty) || 0) * (parseFloat(r.price) || 0);
        return (
          <View key={r.key} style={s.item}>
            <View style={s.itemHead}>
              <View style={s.itemIdx}><Text style={s.itemIdxText}>{idx + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Select
                  value={r.sku}
                  options={options}
                  placeholder={options.length === 0 ? 'Vị trí này không có hàng' : 'Chọn sản phẩm'}
                  onChange={(sku) => update(r.key, { sku, price: hasPrice ? defaultPriceFor(db, mode, sku) : '' })}
                />
              </View>
              <TouchableOpacity onPress={() => remove(r.key)} hitSlop={8} style={s.remove}>
                <Feather name="trash-2" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>

            <View style={s.controls}>
              <View style={{ gap: 6 }}>
                <Text style={ui.label}>Số lượng{p?.unit ? ` (${p.unit})` : ''}</Text>
                <View style={[s.stepper, over && { borderColor: colors.danger }]}>
                  <TouchableOpacity style={s.stepBtn} onPress={() => step(r, -1)} hitSlop={6}><Feather name="minus" size={16} color={colors.text} /></TouchableOpacity>
                  <TextInput
                    style={s.stepInput}
                    keyboardType="number-pad"
                    value={r.qty}
                    selectTextOnFocus
                    onChangeText={(t) => update(r.key, { qty: t.replace(/[^0-9]/g, '') })}
                  />
                  <TouchableOpacity style={s.stepBtn} onPress={() => step(r, 1)} hitSlop={6}><Feather name="plus" size={16} color={colors.text} /></TouchableOpacity>
                </View>
                {max !== null ? <Text style={[type.caption, over && { color: colors.danger }]}>Tối đa {formatQty(max)}</Text> : null}
              </View>

              {hasPrice ? (
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={ui.label}>Đơn giá (đ)</Text>
                  <TextInput
                    style={[ui.input, s.priceInput]}
                    keyboardType="number-pad"
                    value={r.price}
                    selectTextOnFocus
                    onChangeText={(t) => update(r.key, { price: t.replace(/[^0-9]/g, '') })}
                  />
                  <Text style={[type.caption, { textAlign: 'right' }]}>= {formatVND(lineTotal)}</Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={s.addBtn} onPress={add} activeOpacity={0.7} disabled={options.length === 0}>
        <Feather name="plus-circle" size={18} color={options.length === 0 ? colors.textMuted : colors.primary} />
        <Text style={[s.addText, options.length === 0 && { color: colors.textMuted }]}>Thêm sản phẩm</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  emptyBox: { alignItems: 'center', gap: 6, paddingVertical: 18 },
  item: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  itemHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemIdx: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  itemIdxText: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  remove: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.hairlineStrong, borderRadius: radius.md, backgroundColor: colors.surface, height: 46, overflow: 'hidden' },
  stepBtn: { width: 42, height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutralSoft },
  stepInput: { width: 64, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text, height: '100%' },
  priceInput: { textAlign: 'right', fontWeight: '700', height: 46, paddingVertical: 0 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: radius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.hairlineStrong },
  addText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
