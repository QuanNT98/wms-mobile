// ==========================================================
// DESIGN TOKENS
// 1 màu chủ đạo (indigo) + navy cho hero. Màu semantic chỉ dùng cho trạng thái & icon.
// ==========================================================
export const colors = {
  // Brand
  primary: '#3B5BDB',
  primaryDark: '#2F4AC0',
  primarySoft: '#E8EDFF',
  navy: '#1B2559',
  navyDeep: '#111A3F',

  // Surfaces
  bg: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F8FC',
  hairline: '#E9EDF5',
  hairlineStrong: '#DCE2EE',

  // Text
  text: '#1B2559',
  textSecondary: '#5B6685',
  textMuted: '#8C96AD',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.72)',

  // Semantic (chỉ cho trạng thái / icon)
  success: '#16A75C', successSoft: '#E6F6EC',
  warning: '#EA8A1F', warningSoft: '#FFF1DE',
  danger: '#E5484D', dangerSoft: '#FDE8E9',
  info: '#2E7CF6', infoSoft: '#E5F0FF',
  violet: '#7C5CE6', violetSoft: '#EFE9FF',
  teal: '#0F9D8F', tealSoft: '#DDF6F2',
  orange: '#F0742A', orangeSoft: '#FFEBDF',
  neutral: '#6B7590', neutralSoft: '#EEF1F6',

  white: '#FFFFFF',
  black: '#000000',
};

export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'teal' | 'orange' | 'neutral' | 'navy'
  // Tên cũ giữ tương thích
  | 'slate' | 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'purple';

const alias: Record<string, Tone> = { slate: 'neutral', blue: 'info', emerald: 'success', amber: 'warning', indigo: 'primary', rose: 'danger', purple: 'violet' };
export const normTone = (t: Tone): Exclude<Tone, 'slate' | 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'purple'> => (alias[t] as any) || t;

// Cặp màu cho badge / nền mềm / icon theo tone
const base: Record<string, { solid: string; soft: string; text: string }> = {
  primary: { solid: colors.primary, soft: colors.primarySoft, text: colors.primaryDark },
  success: { solid: colors.success, soft: colors.successSoft, text: '#0E7A43' },
  warning: { solid: colors.warning, soft: colors.warningSoft, text: '#9A5B00' },
  danger: { solid: colors.danger, soft: colors.dangerSoft, text: '#B92C31' },
  info: { solid: colors.info, soft: colors.infoSoft, text: '#1A5FCC' },
  violet: { solid: colors.violet, soft: colors.violetSoft, text: '#5B3FC4' },
  teal: { solid: colors.teal, soft: colors.tealSoft, text: '#0B7A70' },
  orange: { solid: colors.orange, soft: colors.orangeSoft, text: '#B9521A' },
  neutral: { solid: colors.navy, soft: colors.neutralSoft, text: colors.textSecondary },
  navy: { solid: colors.navy, soft: colors.neutralSoft, text: colors.navy },
};
export const tone = (t: Tone) => base[normTone(t)];

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const radius = { sm: 8, md: 12, lg: 16, xl: 22, full: 999 };

// Thang chữ
export const type = {
  display: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5, color: colors.text },
  title: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 15, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '500' as const, color: colors.text },
  bodySm: { fontSize: 13, fontWeight: '500' as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  overline: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.4, color: colors.textMuted },
  mono: { fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary, fontVariant: ['tabular-nums'] as any },
};

// Bóng mềm cho card / nút nổi
export const shadow = {
  card: { shadowColor: colors.navy, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  float: { shadowColor: colors.navy, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  bar: { shadowColor: colors.navy, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: -2 }, elevation: 8 },
};
