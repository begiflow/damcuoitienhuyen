// Ghép câu chữ từng màn theo preset xưng hô. Không viết đại từ ở chỗ khác.

import { WEDDING } from '../config/wedding';
import { PRESETS, type XungHo } from '../config/xungho';

export type CopyInput = { xungHo: XungHo; ten?: string; diCung?: string; handle?: string };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function buildCopy({ xungHo, ten = '', diCung = '', handle = 'ban.be' }: CopyInput) {
  const p = PRESETS[xungHo];
  const tail = p.le ? ' ạ' : ' nha';
  // Gọi trong câu: bạn bè gọi tên trống, còn lại "anh Tuấn", "cô Hạnh"
  const ai = ten ? (xungHo === 'ban' ? ten : `${p.goi} ${ten}`) : '';
  return {
    goi: p.goi,
    le: p.le,
    ogTitle: `${ai ? `Gửi ${ai} · ` : ''}${WEDDING.groom} & ${WEDDING.bride} cưới rồi!`,
    ogDescription: `${WEDDING.dateOg} · ${WEDDING.venue.name}`,
    mention: `@${handle}${diCung ? ` & ${diCung}` : ''}`,
    MINH: p.minh.toUpperCase(),
    s1note: `${p.goi} nhớ để dành tối 23.01${p.le ? ` giúp ${p.minh} ạ` : ' nha'}`,
    s2note: `bấm “nhắc mình” cho khỏi quên${tail}`,
    dumpNote: p.le ? `còn nhiều ảnh lắm, mời ${p.goi} tới tiệc xem ạ` : 'còn nhiều ảnh lắm, tới tiệc xem nha',
    s5title: p.le ? `Hồi âm giúp ${p.minh} ạ` : 'Chốt kèo nha!',
    ask: `${cap(p.goi)} tới được không${p.le ? ' ạ' : ''}?`,
    deadline: `Báo ${p.minh} trước ${WEDDING.rsvpDeadline}${tail}`,
    yesLabel: p.le ? 'Có, sẽ tới' : 'Tới chứ!',
    noLabel: p.le ? 'Rất tiếc, không tới được' : 'Tiếc quá, không tới được',
    noteLabel: `Nhắn gì cho ${p.minh}?`,
    pickFirst: p.le ? 'Chọn có tới hay không ạ' : 'Chọn tới hay không trước nha',
    thanks: `Đã gửi, cảm ơn ${p.goi}${p.le ? ' ạ!' : ' nha!'}`,
    retry: `Chưa gửi được, ${p.goi} bấm lại giúp${tail}`,
    bye: `HẸN GẶP ${p.goi.toUpperCase()} TỐI 23.01!`,
    s6note: p.le ? `rất mong ${p.goi} ghé chung vui ạ` : 'nhớ mang theo cái bụng đói',
    giftLabel: `QUÀ MỪNG (NẾU ${p.goi.toUpperCase()} MUỐN)`,
    boothNote: p.le ? `hẹn ${p.goi} chụp chung một tấm ạ` : 'hẹn chụp chung một tấm nha!',
  };
}

export type Copy = ReturnType<typeof buildCopy>;
