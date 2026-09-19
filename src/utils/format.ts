export function formatVND(num: number | string | undefined | null): string {
  const n = Math.round(Number(num) || 0);
  return n.toLocaleString('vi-VN') + 'đ';
}

export function formatQty(n: number): string {
  return (Number(n) || 0).toLocaleString('vi-VN');
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function toISODate(d: Date): string {
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Chuỗi YYYY-MM-DD -> Date (đầu ngày / cuối ngày), trả null nếu không hợp lệ
export function parseISODate(s: string, endOfDay = false): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s || '').trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return isNaN(d.getTime()) ? null : d;
}

export function orderTotal(items: { qty: number; price?: number }[] | undefined): number {
  return (items || []).reduce((s, it) => s + it.qty * (it.price || 0), 0);
}

export function initials(name: string): string {
  return (name.trim().split(' ').pop() || 'U').charAt(0).toUpperCase();
}
