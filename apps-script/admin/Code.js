/**
 * Admin gắn vào file Sheet (Extensions → Apps Script). Menu "Thiệp cưới".
 * Script Properties: DEPLOY_HOOK (Cloudflare Pages → Settings → Builds → Deploy hooks), SITE (vd. https://tienvahuyen.com)
 * Trang gửi thiệp (M3) sẽ thêm sau.
 */

var ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // bỏ i, l, o, 0, 1 cho dễ đọc

var CONFIG_ROWS = [
  ['sdtHoTro', '', 'Số của Mai (bạn cô dâu), hiện ở màn cuối: "Lạc đường? Gọi Mai". Trống = ẩn dòng này. Sửa xong bấm Build lại thiệp.'],
];

function onOpen() {
  ensureConfig_();
  SpreadsheetApp.getUi()
    .createMenu('Thiệp cưới')
    .addItem('Sinh guestID cho dòng trống', 'generateIds')
    .addItem('Build lại thiệp', 'rebuild')
    .addToUi();
}

/** Tạo tab Config và các ô cấu hình nếu chưa có. Không ghi đè giá trị đã điền. */
function ensureConfig_() {
  var book = SpreadsheetApp.getActive();
  var sh = book.getSheetByName('Config');
  if (!sh) {
    sh = book.insertSheet('Config');
    sh.getRange(1, 1, 1, 3).setValues([['key', 'giá trị', 'ghi chú']]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  var keys = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]).trim(); }) : [];
  CONFIG_ROWS.forEach(function (row) {
    if (keys.indexOf(row[0]) >= 0) return;
    var r = sh.getLastRow() + 1;
    sh.getRange(r, 2).setNumberFormat('@'); // dạng chữ: giữ số 0 đầu của số điện thoại
    sh.getRange(r, 1, 1, 3).setValues([row]);
  });
}

/** Chỉ điền ô guestID đang trống. Không bao giờ sửa ID đã có (link đã gửi sẽ chết). */
function generateIds() {
  var sheet = SpreadsheetApp.getActive().getSheetByName('Guests');
  var head = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var cId = head.indexOf('guestID'), cTen = head.indexOf('ten'), cKenh = head.indexOf('kenh');
  if (cId < 0 || cTen < 0) throw new Error('Tab Guests thiếu cột guestID hoặc ten');
  var last = sheet.getLastRow();
  if (last < 2) return;
  var data = sheet.getRange(2, 1, last - 1, head.length).getValues();
  var used = {};
  data.forEach(function (r) { var v = String(r[cId]).trim(); if (v) used[v] = true; });

  var ids = data.map(function (r) { return [r[cId]]; });
  var made = 0;
  data.forEach(function (r, i) {
    if (String(r[cId]).trim() || !String(r[cTen]).trim()) return;
    if (cKenh >= 0 && String(r[cKenh]).trim().toLowerCase() !== 'online') return; // thiệp giấy không cần link
    var id;
    do { id = slug_(r[cTen]) + '-' + rand_(4); } while (used[id]);
    used[id] = true;
    ids[i][0] = id;
    made++;
  });
  sheet.getRange(2, cId + 1, ids.length, 1).setValues(ids);
  SpreadsheetApp.getActive().toast('Đã sinh ' + made + ' guestID mới', 'Thiệp cưới');
}

function rebuild() {
  var hook = PropertiesService.getScriptProperties().getProperty('DEPLOY_HOOK');
  if (!hook) throw new Error('Chưa đặt DEPLOY_HOOK trong Script Properties');
  var res = UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true });
  var ok = res.getResponseCode() < 300;
  SpreadsheetApp.getActive().toast(ok ? 'Đã gửi lệnh build. 1–2 phút nữa thiệp cập nhật.' : 'Build lỗi: HTTP ' + res.getResponseCode(), 'Thiệp cưới');
}

function slug_(s) {
  return String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 24).replace(/-+$/, '') || 'khach';
}

function rand_(n) {
  var s = '';
  for (var i = 0; i < n; i++) s += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  return s;
}
