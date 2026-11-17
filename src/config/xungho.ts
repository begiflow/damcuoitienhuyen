// Bộ xưng hô theo cột `xungHo` trong Sheet. Mọi đại từ hướng tới khách đi qua đây.
// le = true: câu lịch sự có "ạ", bỏ câu đùa.

export const XUNG_HO = ['ban', 'anh', 'chi', 'anhchi', 'em', 'co', 'chu'] as const;
export type XungHo = (typeof XUNG_HO)[number];

export type Preset = { goi: string; minh: string; le: boolean };

export const PRESETS: Record<XungHo, Preset> = {
  ban: { goi: 'bạn', minh: 'tụi mình', le: false },
  anh: { goi: 'anh', minh: 'tụi em', le: false },
  chi: { goi: 'chị', minh: 'tụi em', le: false },
  anhchi: { goi: 'anh chị', minh: 'tụi em', le: false },
  em: { goi: 'em', minh: 'anh chị', le: false },
  co: { goi: 'cô', minh: 'tụi con', le: true },
  chu: { goi: 'chú', minh: 'tụi con', le: true },
};

export const isXungHo = (v: unknown): v is XungHo => (XUNG_HO as readonly unknown[]).includes(v);
