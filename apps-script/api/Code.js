/**
 * API thiệp cưới (Web app, Execute as: Me, Who has access: Anyone).
 * Script Properties: SHEET_ID (ID file Google Sheet), TOKEN (chuỗi bí mật, trùng SHEET_TOKEN trên Cloudflare).
 *
 * GET  ?action=guests&token=…              → build đọc danh sách khách (không trả sdt, nhom) + tab Config
 * POST {action:"rsvp", guestID, attending, soNguoi, ghiChu}   (text/plain)
 * POST {action:"view", guestID}                               (sendBeacon)
 */

var ID_RE = /^[a-z0-9-]{4,40}$/;
var PUBLIC_COLS = ['guestID', 'ten', 'xungHo', 'diCung', 'handle', 'showGift'];
var RATE = 10; // request / giờ / guestID / action
var CONFIG_KEYS = ['sdtHoTro']; // chỉ các ô này của tab Config được đưa vào build

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action !== 'guests') return json_({ ok: false, error: 'bad_action' });
  var token = prop_('TOKEN');
  if (!token || p.token !== token) return json_({ ok: false, error: 'unauthorized' });
  return json_({ ok: true, guests: readGuests_(), config: readConfig_() });
}

function doPost(e) {
  var b;
  try { b = JSON.parse(e.postData.contents); } catch (_) { return json_({ ok: false, error: 'bad_json' }); }
  var id = String(b.guestID || '');
  if (!ID_RE.test(id)) return json_({ ok: false, error: 'bad_id' });
  if (b.action !== 'rsvp' && b.action !== 'view') return json_({ ok: false, error: 'bad_action' });
  if (!allow_(b.action, id)) return json_({ ok: false, error: 'rate_limited' });

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var g = guestsSheet_();
    var row = findRow_(g.sheet, g.head, id);
    if (!row) return json_({ ok: false, error: 'unknown_id' });
    var now = new Date();
    if (b.action === 'view') {
      log_('Views', ['ts', 'guestID'], [now, id]);
      var vc = g.head.indexOf('views');
      if (vc >= 0) { var cell = g.sheet.getRange(row, vc + 1); cell.setValue((Number(cell.getValue()) || 0) + 1); }
      setIf_(g, row, 'lastSeen', now);
    } else {
      var attending = b.attending === true;
      var n = attending ? Math.min(6, Math.max(1, Math.floor(Number(b.soNguoi)) || 1)) : 0;
      var note = safe_(String(b.ghiChu || '').slice(0, 300));
      log_('RSVP', ['ts', 'guestID', 'attending', 'soNguoi', 'ghiChu'], [now, id, attending ? 'co' : 'khong', n, note]);
      setIf_(g, row, 'rsvp', attending ? 'co' : 'khong');
      setIf_(g, row, 'soNguoi', n);
      setIf_(g, row, 'ghiChu', note);
    }
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function readGuests_() {
  var g = guestsSheet_();
  var ix = {};
  PUBLIC_COLS.forEach(function (c) { ix[c] = g.head.indexOf(c); });
  if (ix.guestID < 0 || ix.ten < 0) throw new Error('Tab Guests thiếu cột guestID hoặc ten');
  var rows = g.sheet.getDataRange().getValues().slice(1);
  return rows
    .filter(function (r) { return String(r[ix.guestID]).trim(); })
    .map(function (r) {
      var o = {};
      PUBLIC_COLS.forEach(function (c) { o[c] = ix[c] < 0 ? '' : r[ix[c]]; });
      o.guestID = String(o.guestID).trim();
      o.showGift = o.showGift === true;
      return o;
    });
}

// Tab log chỉ append; tự tạo nếu chưa có
function log_(name, head, row) {
  var b = book_();
  var sh = b.getSheetByName(name) || b.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(head);
  sh.appendRow(row);
}

// Tab Config: cột A = key, cột B = giá trị. Đọc dạng chữ để số điện thoại giữ số 0 đầu.
function readConfig_() {
  var sh = book_().getSheetByName('Config');
  var out = {};
  if (!sh || sh.getLastRow() < 1) return out;
  sh.getRange(1, 1, sh.getLastRow(), 2).getDisplayValues().forEach(function (r) {
    var k = String(r[0]).trim();
    if (CONFIG_KEYS.indexOf(k) >= 0) out[k] = String(r[1]).trim();
  });
  return out;
}

function book_() { return SpreadsheetApp.openById(prop_('SHEET_ID')); }
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }

function guestsSheet_() {
  var sheet = book_().getSheetByName('Guests');
  var head = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  return { sheet: sheet, head: head };
}

function findRow_(sheet, head, id) {
  var c = head.indexOf('guestID');
  var last = sheet.getLastRow();
  if (c < 0 || last < 2) return 0;
  var ids = sheet.getRange(2, c + 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]).trim() === id) return i + 2;
  return 0;
}

function setIf_(g, row, col, v) {
  var c = g.head.indexOf(col);
  if (c >= 0) g.sheet.getRange(row, c + 1).setValue(v);
}

// Chặn chèn công thức: ô bắt đầu bằng = + - @ sẽ bị Sheet hiểu là công thức
function safe_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }

function allow_(action, id) {
  var cache = CacheService.getScriptCache();
  var key = action + ':' + id;
  var n = Number(cache.get(key)) || 0;
  if (n >= RATE) return false;
  cache.put(key, String(n + 1), 3600);
  return true;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
