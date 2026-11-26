// Inline cuối <body>. Vanilla, không phụ thuộc gì. Ngân sách ≤ 5KB.
(function () {
  var d = document, main = d.querySelector('main'), ds = main.dataset;
  var api = ds.api, gid = ds.g;

  // Màn đang xem: đổi đoạn tiến trình (--i), màu (.ink), tải trước ảnh màn kế
  var hud = d.querySelector('.hud'), scr = d.querySelectorAll('.scr'), cur = -1;
  var pre = function (s) { if (s) s.querySelectorAll('img[loading=lazy]').forEach(function (m) { m.loading = 'eager'; }); };
  var at = function () {
    var i = Math.round(main.scrollLeft / main.clientWidth), s = scr[i];
    if (i == cur || !s) return;
    cur = i;
    hud.style.setProperty('--i', i);
    hud.classList.toggle('ink', !s.matches('.photo,.f6'));
    if (i) pre(scr[i + 1]); // màn 1: đợi ảnh bìa (fr)
  };
  main.addEventListener('scroll', at, { passive: true });
  at();

  // 0. Font viết tay + ảnh màn 2: sau ảnh bìa (tối đa 2.5s)
  var cover = d.querySelector('.bgp'), fr = function () { d.documentElement.classList.add('fr'); pre(scr[1]); };
  if (cover && !cover.complete) { cover.addEventListener('load', fr); cover.addEventListener('error', fr); setTimeout(fr, 2500); } else fr();

  // 1. Hiệu ứng nét vẽ: màn nào lộ ≥ 45% thì gắn .in (một lần)
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.45 });
    scr.forEach(function (s) { io.observe(s); });
  }

  // 2. Chạm cạnh trái/phải → màn trước/sau. Chạm nút nhạc → bật/tắt; chạm chỗ khác (vd. chạm cạnh)
  //    → mở khoá âm thanh nếu trình duyệt đã chặn tự phát (biến + hàm nhạc ở mục 6)
  d.addEventListener('click', function (e) {
    if (e.target.closest('[data-mu]')) return pl ? go(0) : play();
    if (on) go(1);
    var b = e.target.closest('[data-go]');
    if (!b) return;
    var s = b.closest('section'), t = b.dataset.go > 0 ? s.nextElementSibling : s.previousElementSibling;
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  });

  // 3. Đếm ngược
  var cd = d.querySelector('[data-t]');
  if (cd) {
    var end = +cd.dataset.t, u = {};
    cd.querySelectorAll('[data-u]').forEach(function (el) { u[el.dataset.u] = el; });
    var two = function (n) { return ('0' + n).slice(-2); };
    var tick = function () {
      var x = Math.max(0, end - Date.now());
      u.d.textContent = Math.floor(x / 864e5);
      u.h.textContent = two(Math.floor(x / 36e5) % 24);
      u.m.textContent = two(Math.floor(x / 6e4) % 60);
      u.s.textContent = two(Math.floor(x / 1e3) % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  // 6. Nhạc nền: 2s sau khi mở thì tải + thử phát. Đa số trình duyệt chặn tự phát
  // → nhạc bật ở lần chạm đầu tiên (mục 2). Nút [data-mu] (dòng nhạc trên cùng, nút loa góc dưới)
  // bật/tắt. Rời trang thì dừng, quay lại thì phát tiếp (nếu chưa tắt).
  // Tải cả file thành blob rồi phát bằng <audio>: host tĩnh không trả 206 cho Range nên iPhone không phát
  // thẳng từ URL (blob thì không cần Range); <audio> giải mã dần, không khựng máy như decodeAudioData.
  // Máy không phát được Opus (iOS cũ) lấy bản AAC.
  var mus = d.querySelectorAll('[data-mu]'), au = new Audio(), on, pl, got; // got: đã bắt đầu tải (đừng đặt tên f: trùng form RSVP)
  au.loop = true;
  var ui = function () {
    pl = !au.paused;
    hud.classList.toggle('on', pl);
    hud.classList.toggle('ld', on && !au.src);
    mus.forEach(function (b) { b.ariaPressed = pl; });
  };
  au.onplay = au.onpause = ui;
  var go = function (v) { on = v; if (au.src) v ? au.play().catch(ui) : au.pause(); ui(); };
  var play = function () {
    if (!got) {
      got = 1;
      var s = mus[0].dataset.s.split(' ');
      fetch(au.canPlayType('audio/webm; codecs=opus') ? s[0] : s[1]).then(function (r) { return r.blob(); })
        .then(function (b) { au.src = URL.createObjectURL(b); go(on); }, function () { got = 0; go(0); });
    }
    go(1);
  };
  if (mus.length) {
    setTimeout(function () { got || play(); }, 2000); // khách đã tự bật/tắt trong 2s đầu thì thôi
    d.addEventListener('visibilitychange', function () { d.hidden ? au.pause() : on && go(1); });
  }

  var post = function (body) {
    return fetch(api, { method: 'POST', body: JSON.stringify(body) }) // text/plain → không preflight
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw 0; });
  };

  // 4. Xác nhận tham dự
  var f = d.getElementById('rsvp');
  if (f && api && gid) {
    var btn = f.querySelector('.send'), lb = btn.querySelector('span'), st = f.querySelector('[role=status]');
    var key = 'rsvp:' + gid, fd = f.dataset;
    var picked = function () { return f.querySelector('[name=a]:checked'); };
    var ui = function (state) {
      var a = picked();
      btn.classList.toggle('sent', state == 'sent');
      btn.disabled = !a || state == 'sent' || state == 'busy';
      lb.textContent = state == 'sent' ? fd.ok : state == 'busy' ? 'Đang gửi…' : state == 'err' ? fd.err : a ? 'Gửi' : fd.pick;
      if (state == 'sent' || state == 'err') st.textContent = lb.textContent;
    };
    try {
      var saved = JSON.parse(localStorage.getItem(key));
      if (saved) {
        f.querySelector('[name=a][value=' + saved.a + ']').checked = true;
        if (saved.n) f.querySelector('[name=n][value="' + saved.n + '"]').checked = true;
        f.m.value = saved.m || '';
        ui('sent');
      }
    } catch (_) {}
    f.addEventListener('input', function () { ui(); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = picked();
      if (!a) return;
      var n = a.value == 'yes' ? +f.querySelector('[name=n]:checked').value : 0;
      var m = f.m.value.trim().slice(0, 300);
      ui('busy');
      post({ action: 'rsvp', guestID: gid, attending: a.value == 'yes', soNguoi: n, ghiChu: m })
        .then(function () {
          ui('sent');
          try { localStorage.setItem(key, JSON.stringify({ a: a.value, n: n, m: m })); } catch (_) {}
        }, function () { ui('err'); });
    });
  }

  // 5. Lượt xem: beacon sau 2s, bỏ qua khi ?preview=1 hoặc localStorage.noTrack
  if (api && gid && !/[?&]preview=1/.test(location.search)) {
    setTimeout(function () {
      try { if (localStorage.getItem('noTrack')) return; } catch (_) {}
      var body = JSON.stringify({ action: 'view', guestID: gid });
      if (!(navigator.sendBeacon && navigator.sendBeacon(api, body))) post({ action: 'view', guestID: gid }).catch(function () {});
    }, 2000);
  }
})();
