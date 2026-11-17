/**
 * Admin gắn vào file Sheet (Tiện ích mở rộng → Apps Script). Menu "Thiệp cưới".
 * Script Properties:
 *   DEPLOY_HOOK     Cloudflare Pages → Settings → Builds → Deploy hooks
 *   NGUON_SHEET_ID  (tuỳ chọn) ID file chứa các tab "Khách …" nếu khác file này
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
    .addItem('Cập nhật khách từ danh sách cũ', 'syncGuests')
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
  return made;
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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 24).replace(/-+$/, '') || 'khach';
}

function rand_(n) {
  var s = '';
  for (var i = 0; i < n; i++) s += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  return s;
}

/* ===================== Đồng bộ từ các tab "Khách …" =====================
 * Tab "Khách …" (mỗi người tự nhập) là nơi thêm/sửa khách. Nút này đưa thay đổi sang tab Guests:
 *  - khách mới   → thêm dòng (đoán tên gọi, xưng hô, đi cùng, kênh), rồi sinh guestID cho dòng online
 *  - khách cũ    → chỉ cập nhật nhom, duKien, soDiCung. KHÔNG đụng ten, xungHo, diCung, kenh, guestID, showGift…
 *  - khách bị xoá ở tab gốc → không xoá dòng (link có thể đã gửi), chỉ ghi vào canXem
 * Khớp dòng theo (người mời, ghi chú, tên); đổi ghi chú vẫn khớp nếu tên là duy nhất.
 */
var NGUON = {
  'Khách Cô Dâu': ['Cô Dâu', 'online'],
  'Khách Chú Rể': ['Chú Rể', 'online'],
  'Khách Mẹ Hoa': ['Mẹ Hoa', 'giay'],
  'Khách Mẹ Dung': ['Mẹ Dung', 'giay'],
  'Khách Anh Hiếu Bác Cúc': ['Anh Hiếu - Bác Cúc', 'giay'],
}; // tab mới tên "Khách X" → người mời X, thiệp giấy
var CO_LAI = 'không còn trong danh sách cũ';
var CAN_COT = ['guestID', 'ten', 'xungHo', 'diCung', 'kenh', 'nguoiMoi', 'nhom', 'tenGoc', 'duKien', 'soDiCung', 'canXem'];

function syncGuests() {
  var book = SpreadsheetApp.getActive();
  var id = PropertiesService.getScriptProperties().getProperty('NGUON_SHEET_ID');
  var src = id ? SpreadsheetApp.openById(id) : book;
  var g = book.getSheetByName('Guests');
  var head = g.getRange(1, 1, 1, g.getLastColumn()).getValues()[0].map(String);
  var c = {};
  head.forEach(function (h, i) { c[h] = i; });
  var thieu = CAN_COT.filter(function (k) { return !(k in c); });
  if (thieu.length) throw new Error('Tab Guests thiếu cột: ' + thieu.join(', '));

  var n = g.getLastRow() - 1;
  var data = n > 0 ? g.getRange(2, 1, n, head.length).getValues() : [];
  var exact = {}, byName = {}, matched = [];
  data.forEach(function (r, i) {
    var who = nfc_(r[c.nguoiMoi]), ten = nfc_(r[c.tenGoc]);
    push_(exact, who + '|' + nfc_(r[c.nhom]) + '|' + ten, i);
    push_(byName, who + '|' + ten, i);
  });

  var lists = {}, added = [], changed = 0;
  src.getSheets().forEach(function (sh) {
    var name = sh.getName().trim();
    var map = NGUON[name] || (/^Khách\s/.test(name) ? [name.replace(/^Khách\s+/, ''), 'giay'] : null);
    if (!map) return;
    lists[map[0]] = true;
    docTab_(sh).forEach(function (s) {
      var i = take_(exact[map[0] + '|' + s.nhom + '|' + s.ten], matched);
      if (i < 0) {
        var cands = (byName[map[0] + '|' + s.ten] || []).filter(function (k) { return !matched[k]; });
        if (cands.length === 1) i = cands[0];
      }
      if (i < 0) { added.push(dongMoi_(s, map[0], map[1])); return; }
      matched[i] = true;
      var r = data[i], flags = flags_(r[c.canXem]), before = r.join('\u0001');
      var oldDi = Number(r[c.soDiCung]) || 0;
      r[c.nhom] = s.nhom;
      r[c.duKien] = s.duKien;
      r[c.soDiCung] = s.soDiCung;
      if (oldDi !== s.soDiCung) addFlag_(flags, 'đi cùng đổi ' + oldDi + '→' + s.soDiCung + ', kiểm diCung');
      delFlag_(flags, CO_LAI);
      r[c.canXem] = flags.join('; ');
      if (r.join('\u0001') !== before) changed++;
    });
  });

  var gone = [];
  data.forEach(function (r, i) {
    if (matched[i] || !lists[nfc_(r[c.nguoiMoi])]) return;
    var flags = flags_(r[c.canXem]);
    if (flags.indexOf(CO_LAI) < 0) { addFlag_(flags, CO_LAI); r[c.canXem] = flags.join('; '); gone.push(nfc_(r[c.tenGoc])); }
  });

  // Ghi lại đúng các cột đồng bộ phụ trách (API đang ghi views/rsvp… ở cột khác, không bị đè)
  if (n > 0) ['nhom', 'duKien', 'soDiCung', 'canXem'].forEach(function (k) {
    g.getRange(2, c[k] + 1, n, 1).setValues(data.map(function (r) { return [r[c[k]]]; }));
  });

  // Đánh dấu trùng cho dòng mới (so với cả bảng)
  var seen = {};
  data.concat([]).forEach(function (r) { seen[nfc_(r[c.nguoiMoi]) + '|' + nfc_(r[c.ten]).toLowerCase() + '|' + r[c.xungHo]] = true; });
  if (added.length) {
    var rows = added.map(function (a) {
      var k = a.nguoiMoi + '|' + a.ten.toLowerCase() + '|' + a.xungHo;
      if (seen[k]) a.flags.push('có thể trùng người');
      seen[k] = true;
      a.canXem = a.flags.join('; ');
      return head.map(function (h) { return h in a ? a[h] : (h === 'showGift' || h === 'daGui' ? false : ''); });
    });
    // Dòng cuối có dữ liệu thật (cột hộp kiểm làm getLastRow() tính cả dòng trống chỉ có FALSE)
    var last = 0;
    data.forEach(function (r, i) { if (nfc_(r[c.guestID]) || nfc_(r[c.ten]) || nfc_(r[c.tenGoc])) last = i + 1; });
    var at = last + 2;
    var need = at + rows.length - 1 - g.getMaxRows();
    if (need > 0) g.insertRowsAfter(g.getMaxRows(), need);
    var dest = g.getRange(at, 1, rows.length, head.length);
    if (at > 2) {
      g.getRange(2, 1, 1, head.length).copyTo(dest, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
      g.getRange(2, 1, 1, head.length).copyTo(dest, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    }
    dest.setValues(rows);
  }
  var ids = added.length ? generateIds() : 0;

  var msg = 'Thêm ' + added.length + ' khách mới (' + ids + ' guestID mới) · cập nhật ' + changed + ' dòng · ' + gone.length + ' dòng không còn ở danh sách cũ.';
  if (added.length) msg += '\n\nKhách mới:\n' + added.map(function (a) { return '• ' + a.tenGoc + ' (' + a.nguoiMoi + ')'; }).join('\n');
  if (gone.length) msg += '\n\nKhông còn ở danh sách cũ (dòng vẫn giữ, xem cột canXem):\n' + gone.map(function (t) { return '• ' + t; }).join('\n');
  msg += '\n\nXem các dòng có canXem rồi bấm Build lại thiệp.';
  try { SpreadsheetApp.getUi().alert('Cập nhật khách', msg, SpreadsheetApp.getUi().ButtonSet.OK); } catch (_) { Logger.log(msg); }
  return { added: added.length, changed: changed, gone: gone.length, ids: ids };
}

// Đọc 1 tab "Khách …": tìm dòng tiêu đề có ô "Tên khách", lấy các dòng có tên bên dưới
function docTab_(sh) {
  var v = sh.getDataRange().getValues(), out = [];
  for (var h = 0; h < Math.min(v.length, 15); h++) {
    var row = v[h].map(nfc_), cTen = row.indexOf('Tên khách');
    if (cTen < 0) continue;
    var cDi = row.indexOf('Số người đi cùng'), cSt = row.indexOf('Trạng thái'), cNote = row.indexOf('Ghi chú');
    for (var r = h + 1; r < v.length; r++) {
      var ten = nfc_(v[r][cTen]);
      if (!ten || ten === '-') continue;
      out.push({
        ten: ten,
        soDiCung: cDi < 0 ? 0 : Math.max(0, Math.floor(Number(v[r][cDi]) || 0)),
        duKien: cSt < 0 ? '' : nfc_(v[r][cSt]),
        nhom: cNote < 0 ? '' : nfc_(v[r][cNote]),
      });
    }
    break;
  }
  return out;
}

// Khách mới: đoán tên gọi + xưng hô từ cách ghi trong danh sách (giống lần import đầu)
var F_NAMES = 'loan dung diệp oanh liên tuyền như yến nhị vi hoa hân nhung nhi vy trinh quyên trân trang trâm thảo nhài ly ngân hương thuý thủy thúy lan mai hằng thoa vân chi nga huyền duyên kiều ánh toan kim anh'.split(' ');
var M_NAMES = 'tiễn tài cường công kha hùng tiến thành dũng huy thạnh nam vinh thạch thọ thân hiếu quang khoa thắng tuấn khôi tân phát lập thịnh'.split(' ');
var M_MID = ['văn', 'quốc', 'mạnh', 'tuấn', 'vinh', 'phong', 'đức', 'hữu', 'công'];
var PREFIX = [
  [/^[Bb]ạn thân\s+/, 'ban'], [/^[Bb]ạn\s+/, 'ban'],
  [/^(?:Anh|anh|A|a)\.?\s+/, 'anh'], [/^[Aa]\.(?=\S)/, 'anh'], [/^a(?=[A-ZĐ])/, 'anh'],
  [/^(?:Chị|chị|C|c)\.?\s+/, 'chi'], [/^[Cc]\.(?=\S)/, 'chi'], [/^c(?=[A-ZĐ])/, 'chi'],
  [/^(?:Em|em)\s+/, 'em'], [/^(?:Bé|bé)\s+/, 'em'], [/^(?:Cô|cô)\s+/, 'co'], [/^(?:Chú|chú)\s+/, 'chu'],
  [/^(?:Thầy|thầy)\s+/, 'thay'],
];
var NICK = ['Cô Bé'];
var ELDER = /^(cậu|dì|gì|bác|bà|ông|mợ|cháu|chú thím|gđ|gd|vc|ac)(\s|$)/i;
var HOSP = ['T1', 'T2', 'T3', 'T4', 'T5', 'KHTH', 'PHCN', 'CS1', 'PK'];

function dongMoi_(s, who, kenh) {
  var raw = s.ten, low = raw.toLowerCase(), flags = [], x = '', ten = raw;
  if (/^khách \d+$/.test(low)) { kenh = ''; flags.push('tên tạm'); }
  else if (ELDER.test(low) || who === 'Mẹ Hoa' || who === 'Mẹ Dung') {
    if (!ELDER.test(low)) { var p0 = prefix_(raw); x = p0[0]; ten = clean_(p0[1])[0]; }
    if (kenh === 'online' && !x) flags.push('danh xưng chưa có preset');
  } else if (/\+| - /.test(raw)) {
    var names = raw.replace(/^[Bb]ạn( thân)?\s+/, '').split(/\s*(?:\+| - |,)\s*/).filter(String).map(function (p) {
      var gname = clean_(prefix_(p.replace(/^(?:BS|Bs)\.?\s*/, ''))[1])[0], w = gname.split(' ');
      return w.length >= 3 ? w[w.length - 1] : gname;
    });
    ten = names.join(' & ');
    x = /^bạn/.test(low) ? 'ban' : 'anhchi';
    flags.push('2 người 1 dòng');
    if (!s.soDiCung) flags.push('ghi 2 tên nhưng đi cùng = 0');
  } else {
    var bs = raw.match(/^(?:BS\.?|Bs\.?|Ths\.?)\s*/);
    if (bs) {
      var cg = clean_(raw.slice(bs[0].length)), w0 = cg[0].split(' ');
      ten = cg[0]; x = gioi_(w0[w0.length - 1]);
      if (cg[1]) flags.push('tên viết tắt');
      flags.push(x ? 'đoán xưng hô theo tên' : 'chưa rõ anh/chị');
    } else {
      var p = prefix_(raw), cl = clean_(p[1]), words = cl[0].split(' ');
      x = p[0]; ten = cl[0];
      if (!x && words.length >= 3 && who === 'Cô Dâu') {
        x = gioi_(words[words.length - 1], words[1]);
        flags.push(x ? 'đoán xưng hô theo tên' : 'chưa rõ anh/chị');
        ten = words[words.length - 1];
      } else if (!x) {
        x = 'ban';
        if (who === 'Cô Dâu' && HOSP.indexOf(s.nhom) >= 0) flags.push('đồng nghiệp, đang để "bạn"');
        if (/^[A-ZĐ]{2,4}$/.test(ten) || /^[A-Z]{2,}[a-z]+$/.test(ten)) flags.push('tên viết tắt');
      }
      if (cl[1]) flags.push('tên viết tắt');
      if (NICK.indexOf(raw) >= 0) flags.push('biệt danh');
      if (s.nhom === 'Bên Nội') flags.push('họ hàng, kiểm xưng hô');
    }
  }
  var diCung = ten.indexOf(' & ') >= 0 ? '' : s.soDiCung === 1 ? 'người thương' : s.soDiCung >= 2 ? 'gia đình' : '';
  if (/^(gđ|gd)(\s|$)/.test(low)) diCung = 'gia đình';
  return { ten: ten, xungHo: x, diCung: diCung, kenh: kenh, nguoiMoi: who, nhom: s.nhom, tenGoc: raw,
    duKien: s.duKien, soDiCung: s.soDiCung, flags: flags };
}

function prefix_(raw) {
  if (NICK.indexOf(raw) >= 0) return ['', raw];
  for (var i = 0; i < PREFIX.length; i++) {
    var m = raw.match(PREFIX[i][0]);
    if (m) return [PREFIX[i][1], raw.slice(m[0].length).trim()];
  }
  return ['', raw];
}

// Bỏ ghi chú trong ngoặc, chức danh, chữ cái viết tắt đầu tên ("TPhương" → "Phương")
function clean_(n) {
  n = n.replace(/\s*\([^)]*\)/g, '').replace(/\b(PO|BOSS|Admon)\b/g, '').trim();
  var m = n.match(/^[A-ZĐ]\.?(?=[A-ZĐ][a-zà-ỹ])/);
  if (m) n = n.slice(m[0].length);
  return [n.replace(/\s+/g, ' ').trim(), !!m];
}

function gioi_(given, mid) {
  var g = String(given || '').toLowerCase(), md = String(mid || '').toLowerCase();
  if (md === 'thị') return 'chi';
  if (M_MID.indexOf(md) >= 0) return 'anh';
  if (F_NAMES.indexOf(g) >= 0) return 'chi';
  if (M_NAMES.indexOf(g) >= 0) return 'anh';
  return '';
}

function nfc_(v) { return (v == null ? '' : String(v)).normalize('NFC').trim(); }
function push_(o, k, i) { (o[k] = o[k] || []).push(i); }
function take_(list, used) { if (!list) return -1; for (var i = 0; i < list.length; i++) if (!used[list[i]]) return list[i]; return -1; }
function flags_(v) { return nfc_(v).split(/\s*;\s*/).filter(String); }
function addFlag_(f, x) { if (f.indexOf(x) < 0) f.push(x); }
function delFlag_(f, x) { var i = f.indexOf(x); if (i >= 0) f.splice(i, 1); }
