// Thông tin cố định của tiệc. Câu chữ ở đây hiển thị nguyên văn, không tự viết lại.
// Ô có TODO phải điền trước content freeze 20/12 (`npm run budget` sẽ nhắc).

export const WEDDING = {
  groom: 'Tiên',
  bride: 'Huyền',
  handle: 'tienvahuyen',
  dateShort: '23.01.27',
  dateLong: 'Thứ Bảy, 23.01.2027',
  dateOg: 'Thứ Bảy 23/01/2027',
  lunar: 'nhằm 16 tháng Chạp năm Bính Ngọ', // soát lại lịch vạn niên ở M4
  // Đếm ngược tới giờ khai tiệc 18:00 (UTC+7)
  partyStart: '2027-01-23T18:00:00+07:00',
  // Sự kiện lịch: 17:00–21:00 giờ VN
  calendar: { start: '20270123T100000Z', end: '20270123T140000Z' },
  venue: {
    name: 'Hidden Haven',
    address: '393/12 Bình Quới, TP.HCM',
    // TODO: thay bằng link "Chia sẻ" từ Google Maps của đúng địa điểm
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Hidden Haven, 393/12 Bình Quới, TP.HCM'),
  },
  schedule: ['17:00 đón khách & teabreak', '18:00 khai tiệc'],
  rsvpDeadline: '15/01',
  parents: { groom: 'Bà Phạm Thị Hoa', bride: 'Bà Dương Thị Mỹ Dung' },
  // Số điện thoại KHÔNG nằm ở đây: điền ô `sdtHoTro` trong tab Config của Sheet (đọc lúc build).
  helper: { name: 'Mai', role: 'bạn cô dâu' },
  youtubeId: '', // TODO: ID video phim cưới (youtu.be/<id>)
  gift: { bank: 'Vietcombank', account: 'xxxx xxxx 1234', holder: 'Tiên (chú rể)' }, // TODO: STK thật + thay src/assets/gift-qr.png
} as const;
