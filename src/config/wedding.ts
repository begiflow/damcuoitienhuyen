// Thông tin cố định của tiệc. Câu chữ ở đây hiển thị nguyên văn, không tự viết lại.
// Ô có TODO phải điền trước content freeze 20/12 (`npm run budget` sẽ nhắc).

export const WEDDING = {
  groom: 'Tiên',
  bride: 'Huyền',
  handle: 'tienvahuyen',
  dateShort: '23.01.27',
  dateDots: '23.01.2027',
  dateDow: 'Thứ Bảy',
  dateLong: 'Thứ Bảy, 23.01.2027',
  dateOg: 'Thứ Bảy 23/01/2027',
  lunar: 'nhằm 16 tháng Chạp năm Bính Ngọ', // soát lại lịch vạn niên ở M4
  // Đếm ngược tới giờ làm lễ & khai tiệc 18:00 (UTC+7); mục timeline trùng giờ này được khoanh bút
  partyStart: '2027-01-23T18:00:00+07:00',
  // Sự kiện lịch: 16:00–21:00 giờ VN
  calendar: { start: '20270123T090000Z', end: '20270123T140000Z' },
  venue: {
    name: 'Hidden Haven',
    address: '393/12 Bình Quới, TP.HCM',
    // TODO: thay bằng link "Chia sẻ" từ Google Maps của đúng địa điểm
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Hidden Haven, 393/12 Bình Quới, TP.HCM'),
  },
  // Giờ hiển thị cho khách. Không đại từ ở đây (câu chữ dùng chung cho mọi xưng hô).
  // art: tên hình trong components/story/doodles.ts, vẽ thành cụm phía trên mỗi mục
  schedule: [
    { t: '16:00', what: 'Teabreak & chụp hình', note: 'Giao lưu, chụp hình cùng cô dâu chú rể', art: ['teabreak'] },
    { t: '17:00', what: 'Đón khách & vào bàn', note: 'Chuẩn bị bắt đầu chương trình', art: ['greet'] },
    { t: '18:00', what: 'Lễ thành hôn & khai tiệc', note: 'Nghi thức, chúc phúc và cùng nâng ly', art: ['party'] },
  ],
  rsvpDeadline: '15/01',
  parents: { groom: 'Bà Phạm Thị Hoa', bride: 'Bà Dương Thị Mỹ Dung' },
  // Số điện thoại KHÔNG nằm ở đây: điền ô `sdtHoTro` trong tab Config của Sheet (đọc lúc build).
  helper: { name: 'Mai', role: 'bạn cô dâu' },
  youtubeId: '', // TODO: ID video phim cưới (youtu.be/<id>)
  gift: { bank: 'Vietcombank', account: 'xxxx xxxx 1234', holder: 'Tiên (chú rể)' }, // TODO: STK thật + thay src/assets/gift-qr.png
} as const;
