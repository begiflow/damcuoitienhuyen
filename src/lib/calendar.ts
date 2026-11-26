import { WEDDING } from '../config/wedding';

// File .ics "Nhắc mình": mở thẳng app Lịch của máy, không cần đăng nhập Google
// (link Google Calendar bắt đăng nhập trong trình duyệt của Zalo/Messenger).
// iPhone Safari: hiện "Thêm vào Lịch"; Android: tải về → mở bằng Lịch (Google Calendar nhập .ics từ 10/2025).
const esc = (s: string) => s.replace(/[\;,]/g, (c) => '\\' + c).replace(/\n/g, '\\n');

// dòng > 75 byte phải gập (CRLF + dấu cách), không cắt giữa ký tự UTF-8
const fold = (line: string) => {
  const out: string[] = [];
  let cur = '', n = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (n + b > 75) { out.push(cur); cur = ' '; n = 1; }
    cur += ch; n += b;
  }
  return [...out, cur].join('\r\n');
};

export function icsText(site: string): string {
  const title = `Tiệc cưới ${WEDDING.groom} & ${WEDDING.bride}`;
  const alarm = (t: string) => ['BEGIN:VALARM', `TRIGGER:${t}`, 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'END:VALARM'];
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//tienvahuyen//thiep-cuoi//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:tiec-cuoi-${WEDDING.calendar.start}@tienvahuyen`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`,
    `DTSTART:${WEDDING.calendar.start}`,
    `DTEND:${WEDDING.calendar.end}`,
    `SUMMARY:${esc(title)}`,
    `LOCATION:${esc(`${WEDDING.venue.name}, ${WEDDING.venue.address}`)}`,
    `DESCRIPTION:${esc(`${WEDDING.schedule.map((s) => `${s.t} ${s.what}`).join(' · ')}\n${WEDDING.lunar}\n${site}`)}`,
    `URL:${site}`,
    ...alarm('-P1D'), ...alarm('-PT3H'),
    'END:VEVENT', 'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n';
}
