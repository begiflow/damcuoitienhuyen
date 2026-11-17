// Inline cuối <body>. Vanilla, không phụ thuộc gì. Ngân sách ≤ 5KB.
(function () {
  var d = document, main = d.querySelector('main'), ds = main.dataset;
  var api = ds.api, gid = ds.g;

  // 1. Hiệu ứng nét vẽ: màn nào lộ ≥ 45% thì gắn .in (một lần)
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.45 });
    d.querySelectorAll('.scr').forEach(function (s) { io.observe(s); });
  }

  // 2. Chạm cạnh trái/phải → màn trước/sau
  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]');
    if (!b) return;
    var s = b.closest('section'), t = b.dataset.go > 0 ? s.nextElementSibling : s.previousElementSibling;
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // 3. Đếm ngược
  var cd = d.querySelector('[data-t]');
  if (cd) {
    var end = +cd.dataset.t, u = {};
    cd.querySelectorAll('[data-u]').forEach(function (el) { u[el.dataset.u] = el; });
    var two = function (n) { return (n < 10 ? '0' : '') + n; };
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
      btn.classList.toggle('sent', state === 'sent');
      btn.disabled = !a || state === 'sent' || state === 'busy';
      lb.textContent = state === 'sent' ? fd.ok : state === 'busy' ? 'Đang gửi…' : state === 'err' ? fd.err : a ? 'Gửi' : fd.pick;
      if (state === 'sent' || state === 'err') st.textContent = lb.textContent;
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
      var n = a.value === 'yes' ? +f.querySelector('[name=n]:checked').value : 0;
      var m = f.m.value.trim().slice(0, 300);
      ui('busy');
      post({ action: 'rsvp', guestID: gid, attending: a.value === 'yes', soNguoi: n, ghiChu: m })
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
