import { WEDDING } from '../config/wedding';

export function googleCalendarUrl(): string {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Tiệc cưới ${WEDDING.groom} & ${WEDDING.bride}`,
    dates: `${WEDDING.calendar.start}/${WEDDING.calendar.end}`,
    details: `${WEDDING.schedule.map((s) => `${s.t} ${s.what}`).join(' · ')}\n${WEDDING.lunar}`,
    location: `${WEDDING.venue.name}, ${WEDDING.venue.address}`,
    ctz: 'Asia/Ho_Chi_Minh',
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
