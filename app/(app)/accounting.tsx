import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useDb } from '../../src/store/DbContext';
import { isAdmin } from '../../src/engine/permissions';
import { NoAccess } from '../../src/components/NoAccess';
import { Button, Card, EmptyText, Field, Hint, Row, Screen, SectionHeader, StatCard } from '../../src/components/ui';
import { Select } from '../../src/components/Select';
import { colors, radius, spacing } from '../../src/theme';
import { formatQty, formatVND, parseISODate, toISODate } from '../../src/utils/format';
import { whOptions } from '../../src/utils/labels';

interface Agg { qty: number; value: number }

export default function AccountingScreen() {
  const { db, user } = useDb();
  const [fromStr, setFromStr] = useState('');
  const [toStr, setToStr] = useState('');
  const [whFilter, setWhFilter] = useState('ALL');
  const fromDate = parseISODate(fromStr);
  const toDate = parseISODate(toStr, true);
  const fromInvalid = !!fromStr && !fromDate;
  const toInvalid = !!toStr && !toDate;

  const report = useMemo(() => {
    const inRange = (iso: string) => {
      const t = new Date(iso);
      if (fromDate && t < fromDate) return false;
      if (toDate && t > toDate) return false;
      return true;
    };

    // Nhập trong kỳ: chỉ tính đơn "Đã nhập kho"
    const inBySku: Record<string, Agg> = {};
    db.ordersIn.forEach((o) => {
      if (o.status !== 'RECEIVED') return;
      if (whFilter !== 'ALL' && o.warehouseId !== whFilter) return;
      if (!inRange(o.timestamp)) return;
      o.items.forEach((it) => {
        inBySku[it.sku] = inBySku[it.sku] || { qty: 0, value: 0 };
        inBySku[it.sku].qty += it.qty;
        inBySku[it.sku].value += it.qty * (it.price || 0);
      });
    });

    // Xuất trong kỳ: chỉ tính đơn "Đã giao / hoàn tất"
    const outBySku: Record<string, Agg> = {};
    db.ordersOut.forEach((o) => {
      if (o.status !== 'DELIVERED') return;
      if (whFilter !== 'ALL' && o.warehouseId !== whFilter) return;
      if (!inRange(o.timestamp)) return;
      o.items.forEach((it) => {
        outBySku[it.sku] = outBySku[it.sku] || { qty: 0, value: 0 };
        outBySku[it.sku].qty += it.qty;
        outBySku[it.sku].value += it.qty * (it.price || 0);
      });
    });

    // Tồn hiện tại theo SKU = Tồn Cuối Kỳ (thời gian thực)
    const stockBySku: Record<string, number> = {};
    db.inventory.forEach((i) => {
      if (whFilter !== 'ALL' && i.warehouseId !== whFilter) return;
      stockBySku[i.sku] = (stockBySku[i.sku] || 0) + i.qty;
    });

    let totalStockValue = 0, totalInValue = 0, totalOutValue = 0, totalEstCOGS = 0;
    const rows = db.products.map((p) => {
      const avgCost = p.buyPrice || 0;
      const inQty = inBySku[p.sku]?.qty || 0;
      const inValue = inBySku[p.sku]?.value || 0;
      const outQty = outBySku[p.sku]?.qty || 0;
      const outValue = outBySku[p.sku]?.value || 0;
      const endQty = stockBySku[p.sku] || 0;
      const endValue = endQty * avgCost;
      // Đầu kỳ + Nhập - Xuất = Cuối kỳ  =>  Đầu kỳ = Cuối kỳ - Nhập + Xuất
      const startQty = Math.max(0, endQty - inQty + outQty);
      const startValue = startQty * avgCost;
      totalStockValue += endValue; totalInValue += inValue; totalOutValue += outValue; totalEstCOGS += outQty * avgCost;
      return { p, startQty, startValue, inQty, inValue, outQty, outValue, endQty, endValue };
    });
    return { rows, totalStockValue, totalInValue, totalOutValue, profit: totalOutValue - totalEstCOGS };
  }, [db, whFilter, fromStr, toStr]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAdmin(user)) return <NoAccess />;

  const today = new Date();
  const preset = (days: number) => {
    const from = new Date(today); from.setDate(today.getDate() - days + 1);
    setFromStr(toISODate(from)); setToStr(toISODate(today));
  };
  const thisMonth = () => { setFromStr(toISODate(new Date(today.getFullYear(), today.getMonth(), 1))); setToStr(toISODate(today)); };

  return (
    <Screen>
      <Card>
        <Hint>Nhập/Xuất tính theo đơn giá trên đơn đã hoàn tất trong kỳ. Tồn cuối kỳ = tồn hiện tại; tồn đầu kỳ suy ngược. Không gồm luân chuyển nội bộ và sự cố.</Hint>
        <Row>
          <Field label="Từ Ngày" placeholder="YYYY-MM-DD" value={fromStr} onChangeText={setFromStr} keyboardType="numbers-and-punctuation" style={{ flex: 1 }} hint={fromInvalid ? 'Sai định dạng' : undefined} />
          <Field label="Đến Ngày" placeholder="YYYY-MM-DD" value={toStr} onChangeText={setToStr} keyboardType="numbers-and-punctuation" style={{ flex: 1 }} hint={toInvalid ? 'Sai định dạng' : undefined} />
        </Row>
        <Row>
          <Button title="Hôm nay" size="sm" variant="soft" tone="slate" onPress={() => preset(1)} />
          <Button title="7 ngày" size="sm" variant="soft" tone="slate" onPress={() => preset(7)} />
          <Button title="Tháng này" size="sm" variant="soft" tone="slate" onPress={thisMonth} />
        </Row>
        <Select label="Vị Trí Kho / Xe" value={whFilter} options={[{ value: 'ALL', label: '-- Tất cả vị trí --' }, ...whOptions(db.warehouses)]} onChange={setWhFilter} />
        <Button title="Xóa bộ lọc" variant="ghost" tone="neutral" size="sm" onPress={() => { setFromStr(''); setToStr(''); setWhFilter('ALL'); }} />
      </Card>

      <View style={st.grid}>
        <StatCard label="Giá trị tồn kho" value={formatVND(report.totalStockValue)} tone="blue" />
        <StatCard label="Nhập trong kỳ" value={formatVND(report.totalInValue)} tone="emerald" />
        <StatCard label="Xuất (doanh thu)" value={formatVND(report.totalOutValue)} tone="amber" />
        <StatCard label="Lãi gộp ước tính" value={formatVND(report.profit)} tone={report.profit < 0 ? 'rose' : 'purple'} />
      </View>

      <SectionHeader title="Chi tiết theo sản phẩm" count={report.rows.length} />
      {report.rows.length === 0 ? <EmptyText>Chưa có sản phẩm nào trong hệ thống</EmptyText> : null}
      {report.rows.map((r) => (
        <Card key={r.p.sku}>
          <Text style={st.prodName}>{r.p.name}</Text>
          <Text style={st.prodSku}>{r.p.sku} • {r.p.unit}</Text>
          <View style={st.cells}>
            <Cell label="Tồn Đầu Kỳ" qty={r.startQty} value={r.startValue} bg={colors.surfaceMuted} fg={colors.textSecondary} />
            <Cell label="Nhập Trong Kỳ" qty={r.inQty} value={r.inValue} bg={colors.successSoft} fg={colors.success} />
            <Cell label="Xuất Trong Kỳ" qty={r.outQty} value={r.outValue} bg={colors.warningSoft} fg={colors.warning} />
            <Cell label="Tồn Cuối Kỳ" qty={r.endQty} value={r.endValue} bg={colors.infoSoft} fg={colors.primary} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

function Cell({ label, qty, value, bg, fg }: { label: string; qty: number; value: number; bg: string; fg: string }) {
  return (
    <View style={[st.cell, { backgroundColor: bg }]}>
      <Text style={st.cellLabel}>{label}</Text>
      <Text style={[st.cellQty, { color: fg }]}>{formatQty(qty)}</Text>
      <Text style={[st.cellValue, { color: fg }]}>{formatVND(value)}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  prodName: { fontWeight: '700', color: colors.text, fontSize: 14 },
  prodSku: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  cells: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: { flexBasis: '48%', flexGrow: 1, borderRadius: radius.md, padding: 8, gap: 2 },
  cellLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  cellQty: { fontSize: 16, fontWeight: '700' },
  cellValue: { fontSize: 12, fontWeight: '600' },
});
