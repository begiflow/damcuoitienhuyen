/**
 * Admin gắn vào file Sheet (Extensions → Apps Script). Menu "Thiệp cưới".
 * Script Properties: DEPLOY_HOOK (Cloudflare Pages → Settings → Builds → Deploy hooks), SITE (vd. https://tienvahuyen.com)
 * Trang gửi thiệp (M3) sẽ thêm sau.
 */

var ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // bỏ i, l, o, 0, 1 cho dễ đọc

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Thiệp cưới')
    .addItem('Sinh guestID cho dòng trống', 'generateIds')
    .addItem('Build lại thiệp', 'rebuild')
    .addToUi();
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
