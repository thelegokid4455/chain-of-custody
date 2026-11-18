/* Digital Chain of Custody — Bukti Medikolegal Tracking System
   Static single-page app. Data is stored in the browser (localStorage). */
(function () {
  'use strict';

  // ---------------------------------------------------------------- constants
  var ROLES = ['Admin', 'Dokter Forensik (Rumah Sakit)', 'Penyidik Polisi', 'Petugas Laboratorium', 'Kejaksaan', 'Pengadilan'];
  var LOCATIONS = ['TKP', 'Rumah Sakit Umum', 'Rumah Sakit Forensik', 'Penyidik Polisi', 'Laboratorium Forensik', 'Kejaksaan', 'Pengadilan', 'Penyimpanan Sementara'];
  var TYPES = ['Darah', 'Pakaian Korban', 'Proyektil', 'Senjata', 'Sampel DNA', 'Dokumen', 'Lainnya'];
  var TYPE_COLOR = {
    'Darah': 'c-blue', 'Pakaian Korban': 'c-amber', 'Proyektil': 'c-purple', 'Senjata': 'c-red',
    'Sampel DNA': 'c-green', 'Dokumen': 'c-slate', 'Lainnya': 'c-slate'
  };
  var KEY = 'coc_data_v1', SESSION = 'coc_session_v1';

  // ---------------------------------------------------------------- icons
  var ICONS = {
    shield: '<path d="M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 19.3 5 15.4 5 11V6z"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
    swap: '<path d="M7 7h13l-4-4"/><path d="M17 17H4l4 4"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    flask: '<path d="M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4A1.5 1.5 0 0 0 20 19L14 9V3"/>',
    gavel: '<path d="M14 13l-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10"/><path d="M16 16l6-6M8 8l6-6M9 7l8 8M21 11l-8-8"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    pin: '<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'
  };
  function icon(n, cls) { return '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24">' + ICONS[n] + '</svg>'; }

  // ---------------------------------------------------------------- helpers
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function nowTime() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function fmtDate(iso) {
    if (!iso) return '-';
    var p = iso.split('-');
    var m = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return parseInt(p[2], 10) + ' ' + m[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function ago(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'Baru saja';
    if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    return Math.floor(s / 86400) + ' hari lalu';
  }
  function typeBadge(t) { return '<span class="badge ' + (TYPE_COLOR[t] || 'c-slate') + '">' + esc(t) + '</span>'; }
  function opts(list, sel, placeholder) {
    return (placeholder ? '<option value="">' + esc(placeholder) + '</option>' : '') +
      list.map(function (v) { return '<option' + (v === sel ? ' selected' : '') + '>' + esc(v) + '</option>'; }).join('');
  }

  // Placeholder photo (generated SVG) for evidence without an uploaded photo
  function placeholder(type) {
    var pal = { 'Darah': ['#7f1d1d', '#dc2626'], 'Pakaian Korban': ['#78350f', '#d97706'], 'Proyektil': ['#1e1b4b', '#6d28d9'],
      'Senjata': ['#450a0a', '#b91c1c'], 'Sampel DNA': ['#14532d', '#16a34a'] }[type] || ['#1e293b', '#475569'];
    var glyph = { 'Darah': ICONS.flask, 'Pakaian Korban': '<path d="M8 3l-5 4 3 3 2-1v12h8V9l2 1 3-3-5-4c-1 2-2.5 3-4 3S9 5 8 3z"/>',
      'Proyektil': '<path d="M12 2c3 3 4 6 4 10v8H8v-8c0-4 1-7 4-10z"/><path d="M8 16h8"/>', 'Senjata': ICONS.gavel,
      'Sampel DNA': '<path d="M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12s10 6 10 6"/><path d="M8 7h8M8 17h8"/>' }[type] || ICONS.box;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + pal[0] + '"/><stop offset="1" stop-color="' + pal[1] + '"/></linearGradient></defs>' +
      '<rect width="120" height="120" fill="url(#g)"/><g transform="translate(36 36) scale(2)" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + glyph + '</g></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function photoOf(item) { return item.photo || placeholder(item.type); }

  // ---------------------------------------------------------------- data
  function seed() {
    var t = Date.now();
    return {
      items: [
        { code: 'BB-001', type: 'Darah', desc: 'Sampel darah dari korban, diambil dari luka tembak', location: 'Laboratorium Forensik', date: '2024-01-15', officer: 'Dr. Ahmad', photo: null, createdAt: t - 9e6 },
        { code: 'BB-002', type: 'Pakaian Korban', desc: 'Kemeja korban dengan bercak darah dan robekan di bagian dada', location: 'Kejaksaan', date: '2024-01-16', officer: 'Inspektur Rudi', photo: null, createdAt: t - 8e6 },
        { code: 'BB-003', type: 'Proyektil', desc: 'Proyektil kaliber 9mm yang diambil dari tubuh korban', location: 'Pengadilan', date: '2024-01-17', officer: 'Forensik Dr. Maya', photo: null, createdAt: t - 7e6 }
      ],
      transfers: [
        { id: 1, code: 'BB-001', from: 'Rumah Sakit Umum', to: 'Penyidik Polisi', officer: 'Dr. Ahmad', date: '2024-01-15', time: '10:30', note: 'Pengambilan awal' },
        { id: 2, code: 'BB-002', from: 'TKP', to: 'Penyidik Polisi', officer: 'Inspektur Rudi', date: '2024-01-16', time: '09:00', note: 'Pengambilan dari TKP' },
        { id: 3, code: 'BB-001', from: 'Penyidik Polisi', to: 'Laboratorium Forensik', officer: 'Budi Santoso', date: '2024-01-16', time: '14:15', note: 'Untuk analisis DNA' },
        { id: 4, code: 'BB-002', from: 'Penyidik Polisi', to: 'Laboratorium Forensik', officer: 'Siti Aminah', date: '2024-01-17', time: '11:45', note: 'Analisis serat dan DNA' },
        { id: 5, code: 'BB-003', from: 'TKP', to: 'Penyidik Polisi', officer: 'Forensik Dr. Maya', date: '2024-01-17', time: '13:30', note: 'Pengambilan dari tubuh korban' },
        { id: 6, code: 'BB-003', from: 'Penyidik Polisi', to: 'Laboratorium Forensik', officer: 'Teknisi Lab', date: '2024-01-18', time: '10:15', note: 'Analisis balistik' },
        { id: 7, code: 'BB-002', from: 'Laboratorium Forensik', to: 'Kejaksaan', officer: 'Jaksa Agung', date: '2024-01-18', time: '16:20', note: 'Untuk keperluan persidangan' },
        { id: 8, code: 'BB-003', from: 'Laboratorium Forensik', to: 'Kejaksaan', officer: 'Jaksa', date: '2024-01-19', time: '09:45', note: 'Laporan balistik' },
        { id: 9, code: 'BB-003', from: 'Kejaksaan', to: 'Pengadilan', officer: 'Panitera', date: '2024-01-20', time: '14:00', note: 'Untuk sidang' }
      ],
      activity: [],
      notifications: [
        { id: 1, text: 'Barang bukti BB-001 telah dipindahkan ke Laboratorium Forensik', ts: t - 10 * 60e3, read: false },
        { id: 2, text: '3 barang bukti baru ditambahkan hari ini', ts: t - 3600e3, read: false },
        { id: 3, text: 'Sistem backup berjalan sukses', ts: t - 2 * 3600e3, read: true },
        { id: 4, text: 'Update sistem v1.2 telah tersedia', ts: t - 86400e3, read: true }
      ],
      nextId: 10
    };
  }
  var db;
  function load() {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db || !db.items) { db = seed(); save(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { toast('Penyimpanan browser penuh. Coba foto yang lebih kecil.', 'bad'); return false; }
  }
  function session() { try { return JSON.parse(localStorage.getItem(SESSION)); } catch (e) { return null; } }
  function item(code) { return db.items.filter(function (i) { return i.code === code; })[0]; }
  function sortedTransfers() {
    return db.transfers.slice().sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time) || b.id - a.id; });
  }
  function logActivity(text, kind) {
    db.activity.unshift({ text: text, kind: kind, ts: Date.now(), by: session() ? session().name : '' });
    db.activity = db.activity.slice(0, 30);
  }
  function notify(text) {
    db.notifications.unshift({ id: Date.now(), text: text, ts: Date.now(), read: false });
    db.notifications = db.notifications.slice(0, 30);
  }
  function nextCode() {
    var max = 0;
    db.items.forEach(function (i) { var m = /^BB-(\d+)$/.exec(i.code); if (m) max = Math.max(max, parseInt(m[1], 10)); });
    var n = String(max + 1); while (n.length < 3) n = '0' + n;
    return 'BB-' + n;
  }

  // ---------------------------------------------------------------- ui utils
  function toast(msg, kind) {
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    $('#toast-root').appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  }
  function openModal(html, onMount) {
    var root = $('#modal-root');
    root.innerHTML = '<div class="overlay">' + html + '</div>';
    var ov = $('.overlay', root);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-close]')) closeModal(); });
    if (onMount) onMount(ov);
  }
  function closeModal() { $('#modal-root').innerHTML = ''; }
  function confirmDialog(title, text, okLabel, onOk) {
    openModal('<div class="modal"><div class="modal-head"><h3>' + esc(title) + '</h3><button class="x" data-close>' + icon('x') + '</button></div>' +
      '<p style="color:var(--muted);margin-bottom:18px">' + esc(text) + '</p>' +
      '<div class="form-actions"><button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-red" id="cf-ok">' + esc(okLabel) + '</button></div></div>',
      function (ov) { $('#cf-ok', ov).onclick = function () { closeModal(); onOk(); }; });
  }

  // ---------------------------------------------------------------- QR
  function qrUrl(code) { return location.href.split('#')[0] + '#/bukti/' + encodeURIComponent(code); }
  function drawQR(canvas, text) {
    var q = window.makeQR(text), n = q.getModuleCount(), quiet = 4, scale = 8, size = (n + quiet * 2) * scale;
    canvas.width = size; canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
  }
  function showQR(code) {
    var it = item(code); if (!it) return;
    openModal('<div class="modal print-area"><div class="modal-head"><h3>QR Code Barang Bukti</h3><button class="x no-print" data-close>' + icon('x') + '</button></div>' +
      '<div class="qr-box"><canvas id="qr-canvas"></canvas><div class="lbl">' + esc(it.code) + '</div></div>' +
      '<p class="center" style="font-size:12.5px;color:var(--muted)">Scan QR code untuk mengakses detail barang bukti</p>' +
      '<p class="center" style="margin-bottom:14px"><a href="#/bukti/' + encodeURIComponent(it.code) + '" data-close>' + esc(it.code) + ' - ' + esc(it.type) + '</a></p>' +
      '<div class="row"><span>Lokasi</span><b>' + esc(it.location) + '</b></div>' +
      '<div class="row"><span>Tanggal</span><b>' + esc(fmtDate(it.date)) + '</b></div>' +
      '<div class="form-actions no-print" style="margin-top:16px"><button class="btn btn-ghost" id="qr-print">' + icon('print') + 'Print</button>' +
      '<button class="btn btn-primary" id="qr-dl">' + icon('download') + 'Download</button></div></div>',
      function (ov) {
        var cv = $('#qr-canvas', ov);
        drawQR(cv, qrUrl(it.code));
        $('#qr-print', ov).onclick = function () { window.print(); };
        $('#qr-dl', ov).onclick = function () {
          var a = document.createElement('a');
          a.download = 'QR-' + it.code + '.png'; a.href = cv.toDataURL('image/png'); a.click();
        };
      });
  }

  // ---------------------------------------------------------------- image upload (resized to keep storage small)
  function readImage(file, cb) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast('Format harus JPG atau PNG', 'bad'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Ukuran maksimal 5MB', 'bad'); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 800, w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
        var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        cb(cv.toDataURL('image/jpeg', 0.78));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  // ---------------------------------------------------------------- views
  function viewLogin() {
    $('#app').innerHTML =
      '<div class="login-wrap"><form class="login-card" id="login-form" novalidate>' +
      '<div class="login-logo">' + icon('shield') + '</div>' +
      '<h1>DIGITAL CHAIN OF<br>CUSTODY</h1><p class="sub">Bukti Medikolegal Tracking System</p>' +
      '<div class="field"><label>Username</label><input class="input" name="user" placeholder="Enter your username" autocomplete="username"></div>' +
      '<div class="field"><label>Password</label><input class="input" type="password" name="pass" placeholder="Enter your password" autocomplete="current-password"></div>' +
      '<div class="field"><label>User Role</label><select class="input" name="role">' + opts(ROLES, '', 'Select your role') + '</select></div>' +
      '<div class="err" id="login-err" style="margin-bottom:10px"></div>' +
      '<button class="btn btn-primary btn-block" type="submit">' + icon('login') + 'Login to System</button>' +
      '<p class="note">Prototype System for Medico-Legal Evidence Tracking<br>All activities are logged for security purposes</p>' +
      '</form></div>';
    $('#login-form').onsubmit = function (e) {
      e.preventDefault();
      var f = e.target, u = f.user.value.trim(), p = f.pass.value, r = f.role.value;
      var err = !u ? 'Username wajib diisi' : !p ? 'Password wajib diisi' : !r ? 'Pilih role terlebih dahulu' : '';
      if (err) { $('#login-err').textContent = err; return; }
      var s = { name: u, role: r, loginAt: Date.now() };
      localStorage.setItem(SESSION, JSON.stringify(s));
      logActivity(u + ' login sebagai ' + r, 'login'); save();
      var target = sessionStorage.getItem('coc_after_login');
      sessionStorage.removeItem('coc_after_login');
      location.hash = target || '#/dashboard';
      route();
    };
  }

  var NAV = [
    ['dashboard', 'home', 'Dashboard'],
    ['tambah', 'plus', 'Tambah Barang Bukti'],
    ['daftar', 'list', 'Daftar Barang Bukti'],
    ['perpindahan', 'swap', 'Perpindahan Barang Bukti'],
    ['log', 'history', 'Log Chain of Custody']
  ];
  function shell(active, title, body) {
    var s = session();
    var unread = db.notifications.filter(function (n) { return !n.read; }).length;
    var role = s.role.replace(' (Rumah Sakit)', '');
    $('#app').innerHTML =
      '<div class="shell"><aside class="sidebar" id="sidebar">' +
      '<div class="brand"><div class="logo">' + icon('shield') + '</div><div><b>CHAIN OF<br>CUSTODY</b><small>Medikolegal System</small></div></div>' +
      '<div class="user"><div class="avatar">' + esc(s.name.charAt(0).toUpperCase()) + '</div><div><b>' + esc(s.name) + '</b><small>' + esc(role) + '</small></div></div>' +
      '<nav class="nav">' + NAV.map(function (n) {
        return '<a href="#/' + n[0] + '" class="' + (n[0] === active ? 'active' : '') + '">' + icon(n[1]) + '<span>' + n[2] + '</span></a>';
      }).join('') + '</nav>' +
      '<div class="side-foot"><button class="btn btn-red btn-block" id="logout">' + icon('logout') + 'Logout</button></div></aside>' +
      '<div class="backdrop" id="backdrop"></div>' +
      '<div class="main"><header class="topbar"><button class="menu-btn" id="menu">' + icon('menu') + '</button>' +
      '<div><h2>' + esc(title) + '</h2><div class="sub">Digital Chain of Custody System</div></div>' +
      '<div class="right"><div class="last-login">Last login<br><b>' + ago(s.loginAt) + '</b></div>' +
      '<button class="bell" id="bell" title="Notifikasi">' + icon('bell') + (unread ? '<span class="dot"></span>' : '') + '</button></div></header>' +
      '<div id="notif-slot"></div><main class="content">' + body + '</main></div></div>';

    $('#logout').onclick = function () {
      confirmDialog('Logout', 'Apakah Anda yakin ingin logout?', 'Logout', function () {
        logActivity(s.name + ' logout', 'logout'); save();
        localStorage.removeItem(SESSION); location.hash = '#/login'; route();
      });
    };
    var sb = $('#sidebar'), bd = $('#backdrop');
    $('#menu').onclick = function () { sb.classList.add('open'); bd.classList.add('open'); };
    bd.onclick = function () { sb.classList.remove('open'); bd.classList.remove('open'); };
    $('#bell').onclick = function (e) { e.stopPropagation(); toggleNotif(); };
  }
  function toggleNotif() {
    var slot = $('#notif-slot');
    if (slot.innerHTML) { slot.innerHTML = ''; return; }
    slot.innerHTML = '<div class="notif" id="notif"><h4>System Notifications <button id="mark-read">Tandai semua dibaca</button></h4><ul>' +
      (db.notifications.length ? db.notifications.map(function (n) {
        return '<li class="' + (n.read ? '' : 'unread') + '">' + esc(n.text) + '<small>' + ago(n.ts) + '</small></li>';
      }).join('') : '<li>Tidak ada notifikasi</li>') + '</ul></div>';
    $('#mark-read').onclick = function () {
      db.notifications.forEach(function (n) { n.read = true; }); save();
      var d = $('#bell .dot'); if (d) d.remove();
      $$('#notif li.unread').forEach(function (li) { li.classList.remove('unread'); });
    };
    setTimeout(function () {
      document.addEventListener('click', function close(e) {
        if (!e.target.closest('#notif')) { slot.innerHTML = ''; document.removeEventListener('click', close); }
      });
    });
  }

  function itemsTable(list) {
    if (!list.length) return '<div class="empty">Belum ada barang bukti.</div>';
    return '<div class="table-wrap"><table><thead><tr><th>Kode Bukti</th><th>Jenis Bukti</th><th>Foto Bukti</th><th>Lokasi Terakhir</th><th>Tanggal Input</th><th>Aksi</th></tr></thead><tbody>' +
      list.map(function (i) {
        return '<tr><td><b>' + esc(i.code) + '</b></td><td>' + typeBadge(i.type) + '</td>' +
          '<td><img class="thumb" src="' + photoOf(i) + '" alt=""></td><td>' + esc(i.location) + '</td><td>' + esc(i.date) + '</td>' +
          '<td><div class="acts"><a href="#/bukti/' + encodeURIComponent(i.code) + '">' + icon('eye') + 'Lihat</a>' +
          '<a href="#" class="qr" data-qr="' + esc(i.code) + '">' + icon('qr') + 'QR</a></div></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function bindQR() {
    $$('[data-qr]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); showQR(a.getAttribute('data-qr')); }; });
  }

  function viewDashboard() {
    var inLab = db.items.filter(function (i) { return i.location === 'Laboratorium Forensik'; }).length;
    var legal = db.items.filter(function (i) { return i.location === 'Kejaksaan' || i.location === 'Pengadilan'; }).length;
    var recent = db.items.slice().sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, 5);
    var acts = db.activity.slice(0, 6);
    var kindIcon = { add: ['plus', 'c-blue'], transfer: ['swap', 'c-green'], login: ['login', 'c-purple'], logout: ['logout', 'c-slate'], del: ['trash', 'c-red'] };
    function stat(label, n, ic, c) { return '<div class="stat"><div><small>' + label + '</small><div class="n">' + n + '</div></div><div class="ic ' + c + '">' + icon(ic) + '</div></div>'; }
    shell('dashboard', 'Dashboard',
      '<div class="stats">' + stat('Total Barang Bukti', db.items.length, 'box', 'c-blue') +
      stat('Perpindahan Tercatat', db.transfers.length, 'swap', 'c-green') +
      stat('Dalam Laboratorium', inLab, 'flask', 'c-purple') + stat('Dalam Proses Hukum', legal, 'gavel', 'c-red') + '</div>' +
      '<div class="card"><div class="card-head"><h3>Barang Bukti Terbaru</h3><a href="#/daftar">Lihat semua →</a></div>' + itemsTable(recent) + '</div>' +
      '<div class="two-col"><div class="card"><h3>Aktivitas Terakhir</h3>' +
      (acts.length ? '<ul class="activity">' + acts.map(function (a) {
        var k = kindIcon[a.kind] || ['file', 'c-slate'];
        return '<li><div class="ic ' + k[1] + '">' + icon(k[0]) + '</div><div><b>' + esc(a.text) + '</b><small>' + ago(a.ts) + '</small></div></li>';
      }).join('') + '</ul>' : '<div class="empty">Belum ada aktivitas.</div>') + '</div>' +
      '<div class="card"><h3>Quick Actions</h3><div class="quick">' +
      '<a href="#/tambah" style="background:var(--blue)">' + icon('plus') + 'Tambah Bukti</a>' +
      '<a href="#/perpindahan" style="background:var(--green)">' + icon('swap') + 'Perpindahan</a>' +
      '<a href="#/daftar" style="background:var(--purple)">' + icon('list') + 'Daftar Bukti</a>' +
      '<a href="#/log" style="background:var(--navy-2)">' + icon('history') + 'Log Custody</a></div></div></div>');
    bindQR();
  }

  function viewTambah() {
    var s = session(), photo = null;
    shell('tambah', 'Tambah Barang Bukti',
      '<div class="card" style="max-width:820px"><h3>Tambah Barang Bukti Baru</h3><form id="f-add" novalidate>' +
      '<div class="grid-2"><div class="field"><label>Kode Barang Bukti <span class="req">*</span></label><input class="input" name="code" value="' + nextCode() + '" placeholder="BB-001"><div class="hint">Format: BB-XXX (contoh: BB-001)</div></div>' +
      '<div class="field"><label>Jenis Barang Bukti <span class="req">*</span></label><select class="input" name="type">' + opts(TYPES, '', 'Pilih Jenis') + '</select></div></div>' +
      '<div class="field"><label>Deskripsi Singkat <span class="req">*</span></label><textarea class="input" name="desc" placeholder="Deskripsi barang bukti..."></textarea></div>' +
      '<div class="grid-2"><div class="field"><label>Tanggal Pengambilan <span class="req">*</span></label><input class="input" type="date" name="date" value="' + today() + '"></div>' +
      '<div class="field"><label>Lokasi Awal <span class="req">*</span></label><select class="input" name="location">' + opts(LOCATIONS, '', 'Pilih Lokasi') + '</select></div></div>' +
      '<div class="field"><label>Petugas yang Mencatat <span class="req">*</span></label><input class="input" name="officer" value="' + esc(s.name) + '"></div>' +
      '<div class="field"><label>Upload Foto Barang Bukti</label><div class="drop" id="drop"><div id="drop-inner">' + icon('camera') +
      '<p style="margin-top:8px">Drag &amp; drop foto atau klik untuk upload</p><p class="hint">Format: JPG, PNG (Max 5MB)</p></div>' +
      '<button type="button" class="btn btn-ghost btn-sm" style="margin-top:10px">Pilih File</button></div><input type="file" id="file" accept="image/jpeg,image/png,image/webp" hidden></div>' +
      '<div class="err" id="add-err"></div>' +
      '<div class="form-actions"><a class="btn btn-ghost" href="#/dashboard">Batal</a><button class="btn btn-primary" type="submit">' + icon('check') + 'Simpan Barang Bukti</button></div>' +
      '</form></div>');
    var drop = $('#drop'), file = $('#file');
    function setPhoto(data) {
      photo = data;
      $('#drop-inner').innerHTML = '<img src="' + data + '" alt=""><p class="hint">Klik untuk mengganti foto</p>';
    }
    drop.onclick = function () { file.click(); };
    file.onchange = function () { if (file.files[0]) readImage(file.files[0], setPhoto); };
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = function () { drop.classList.remove('over'); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) readImage(e.dataTransfer.files[0], setPhoto); };
    $('#f-add').onsubmit = function (e) {
      e.preventDefault();
      var f = e.target, code = f.code.value.trim().toUpperCase(), err = '';
      if (!/^BB-\d{3,}$/.test(code)) err = 'Kode harus berformat BB-XXX (contoh: BB-004)';
      else if (item(code)) err = 'Kode ' + code + ' sudah digunakan';
      else if (!f.type.value) err = 'Pilih jenis barang bukti';
      else if (!f.desc.value.trim()) err = 'Deskripsi wajib diisi';
      else if (!f.date.value) err = 'Tanggal wajib diisi';
      else if (!f.location.value) err = 'Pilih lokasi awal';
      else if (!f.officer.value.trim()) err = 'Petugas wajib diisi';
      if (err) { $('#add-err').textContent = err; return; }
      db.items.push({ code: code, type: f.type.value, desc: f.desc.value.trim(), location: f.location.value, date: f.date.value,
        officer: f.officer.value.trim(), photo: photo, createdAt: Date.now() });
      logActivity(code + ' (' + f.type.value + ') ditambahkan', 'add');
      notify('Barang bukti ' + code + ' ditambahkan oleh ' + session().name);
      if (!save()) { db.items.pop(); return; }
      toast('Barang bukti ' + code + ' berhasil disimpan', 'ok');
      location.hash = '#/bukti/' + encodeURIComponent(code);
    };
  }

  function viewDaftar() {
    shell('daftar', 'Daftar Barang Bukti',
      '<div class="card"><div class="card-head"><h3>Semua Barang Bukti</h3><div class="toolbar">' +
      '<input class="input" id="q" placeholder="Cari kode / deskripsi...">' +
      '<select class="input" id="ft">' + opts(TYPES, '', 'Semua Jenis') + '</select>' +
      '<select class="input" id="fl">' + opts(LOCATIONS, '', 'Semua Lokasi') + '</select></div></div><div id="tbl"></div></div>');
    function render() {
      var q = $('#q').value.toLowerCase(), t = $('#ft').value, l = $('#fl').value;
      var list = db.items.filter(function (i) {
        return (!t || i.type === t) && (!l || i.location === l) &&
          (!q || (i.code + ' ' + i.desc + ' ' + i.officer).toLowerCase().indexOf(q) >= 0);
      }).sort(function (a, b) { return a.code.localeCompare(b.code); });
      $('#tbl').innerHTML = itemsTable(list); bindQR();
    }
    ['q', 'ft', 'fl'].forEach(function (id) { $('#' + id).oninput = render; });
    render();
  }

  function viewDetail(code) {
    var it = item(code);
    if (!it) {
      shell('daftar', 'Detail Barang Bukti', '<div class="card empty">Barang bukti <b>' + esc(code) + '</b> tidak ditemukan.<br><br><a href="#/daftar">← Kembali ke daftar</a></div>');
      return;
    }
    var hist = db.transfers.filter(function (t) { return t.code === code; })
      .sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time) || a.id - b.id; });
    var isAdmin = session().role === 'Admin';
    shell('daftar', 'Detail Barang Bukti',
      '<div class="card"><div class="card-head"><div><h3>Detail Barang Bukti</h3><small style="color:var(--muted)">Kode: ' + esc(it.code) + '</small></div>' +
      '<div class="toolbar"><a class="btn btn-ghost btn-sm" href="#/perpindahan?code=' + encodeURIComponent(it.code) + '">' + icon('swap') + 'Catat Perpindahan</a>' +
      (isAdmin ? '<button class="btn btn-ghost btn-sm" id="del" style="color:var(--red)">' + icon('trash') + 'Hapus</button>' : '') +
      '<button class="btn btn-green btn-sm" id="gen-qr">' + icon('qr') + 'Generate QR Code</button></div></div>' +
      '<div class="detail-grid"><div><h4 style="margin-bottom:12px;font-size:13.5px">Informasi Barang Bukti</h4>' +
      '<div class="kv"><small>Kode Bukti</small><div>' + esc(it.code) + '</div></div>' +
      '<div class="kv"><small>Jenis Bukti</small><div>' + typeBadge(it.type) + '</div></div>' +
      '<div class="kv"><small>Deskripsi</small><div>' + esc(it.desc) + '</div></div>' +
      '<div class="kv"><small>Lokasi Terakhir</small><div style="color:var(--blue-2)">' + esc(it.location) + '</div></div>' +
      '<div class="kv"><small>Tanggal Input</small><div>' + esc(it.date) + '</div></div>' +
      '<div class="kv"><small>Petugas Pencatat</small><div>' + esc(it.officer) + '</div></div></div>' +
      '<div><h4 style="margin-bottom:12px;font-size:13.5px">Foto Barang Bukti</h4><img class="photo-lg" src="' + photoOf(it) + '" alt="Foto ' + esc(it.code) + '">' +
      '<h4 style="margin:16px 0 4px;font-size:13.5px">Status Saat Ini</h4><div class="status-box">' + icon('pin') +
      '<div><b>' + esc(it.code) + '</b><br><small>Status: Saat ini berada di <b>' + esc(it.location) + '</b></small></div></div></div></div></div>' +
      '<div class="card"><h3>Riwayat Chain of Custody</h3>' + transfersTable(hist, false) + '</div>');
    $('#gen-qr').onclick = function () { showQR(it.code); };
    if (isAdmin) $('#del').onclick = function () {
      confirmDialog('Hapus Barang Bukti', 'Hapus ' + it.code + ' beserta seluruh riwayat perpindahannya? Tindakan ini tidak dapat dibatalkan.', 'Hapus', function () {
        db.items = db.items.filter(function (i) { return i.code !== it.code; });
        db.transfers = db.transfers.filter(function (t) { return t.code !== it.code; });
        logActivity(it.code + ' dihapus', 'del'); save();
        toast(it.code + ' dihapus', 'ok'); location.hash = '#/daftar';
      });
    };
  }

  function transfersTable(list, withCode) {
    if (!list.length) return '<div class="empty">Belum ada perpindahan tercatat.</div>';
    return '<div class="table-wrap"><table><thead><tr><th>Waktu</th>' + (withCode ? '<th>Kode Bukti</th><th>Jenis</th>' : '') +
      '<th>Lokasi Asal</th><th>Lokasi Tujuan</th><th>Petugas</th><th>Keterangan</th></tr></thead><tbody>' +
      list.map(function (t) {
        var it = item(t.code);
        return '<tr><td style="white-space:nowrap">' + esc(t.date) + ' ' + esc(t.time) + '</td>' +
          (withCode ? '<td><a class="code" href="#/bukti/' + encodeURIComponent(t.code) + '">' + esc(t.code) + '</a></td><td>' + (it ? typeBadge(it.type) : '-') + '</td>' : '') +
          '<td>' + esc(t.from) + '</td><td>' + esc(t.to) + '</td><td>' + esc(t.officer) + '</td><td>' + esc(t.note || '-') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function viewPerpindahan(params) {
    var s = session(), pre = params.code || '';
    shell('perpindahan', 'Perpindahan Barang Bukti',
      '<div class="card" style="max-width:820px"><h3>Catat Perpindahan Barang Bukti</h3><form id="f-tr" novalidate>' +
      '<div class="field"><label>Kode Bukti <span class="req">*</span></label><select class="input" name="code"><option value="">Pilih Kode Bukti</option>' +
      db.items.slice().sort(function (a, b) { return a.code.localeCompare(b.code); }).map(function (i) {
        return '<option value="' + esc(i.code) + '"' + (i.code === pre ? ' selected' : '') + '>' + esc(i.code + ' - ' + i.type + ' (' + i.location + ')') + '</option>';
      }).join('') + '</select></div>' +
      '<div class="grid-2"><div class="field"><label>Lokasi Asal <span class="req">*</span></label><select class="input" name="from">' + opts(LOCATIONS, '', 'Pilih Lokasi Asal') + '</select><div class="hint">Otomatis terisi dari lokasi terakhir</div></div>' +
      '<div class="field"><label>Lokasi Tujuan <span class="req">*</span></label><select class="input" name="to">' + opts(LOCATIONS, '', 'Pilih Lokasi Tujuan') + '</select></div></div>' +
      '<div class="field"><label>Petugas yang Memindahkan <span class="req">*</span></label><input class="input" name="officer" value="' + esc(s.name) + '"></div>' +
      '<div class="grid-2"><div class="field"><label>Tanggal <span class="req">*</span></label><input class="input" type="date" name="date" value="' + today() + '"></div>' +
      '<div class="field"><label>Waktu <span class="req">*</span></label><input class="input" type="time" name="time" value="' + nowTime() + '"></div></div>' +
      '<div class="field"><label>Keterangan</label><textarea class="input" name="note" placeholder="Alasan perpindahan atau informasi tambahan..."></textarea></div>' +
      '<div class="err" id="tr-err"></div>' +
      '<div class="form-actions"><a class="btn btn-ghost" href="#/dashboard">Batal</a><button class="btn btn-primary" type="submit">' + icon('swap') + 'Catat Perpindahan</button></div>' +
      '</form></div><div class="card"><h3>Barang Bukti yang Tersedia</h3>' + itemsTable(db.items.slice().sort(function (a, b) { return a.code.localeCompare(b.code); })) + '</div>');
    bindQR();
    var f = $('#f-tr');
    function syncFrom() { var it = item(f.code.value); if (it) f.from.value = it.location; }
    f.code.onchange = syncFrom; syncFrom();
    f.onsubmit = function (e) {
      e.preventDefault();
      var err = !f.code.value ? 'Pilih kode bukti' : !f.from.value ? 'Pilih lokasi asal' : !f.to.value ? 'Pilih lokasi tujuan' :
        f.from.value === f.to.value ? 'Lokasi asal dan tujuan tidak boleh sama' : !f.officer.value.trim() ? 'Petugas wajib diisi' :
        !f.date.value || !f.time.value ? 'Tanggal dan waktu wajib diisi' : '';
      if (err) { $('#tr-err').textContent = err; return; }
      var it = item(f.code.value);
      db.transfers.push({ id: db.nextId++, code: it.code, from: f.from.value, to: f.to.value, officer: f.officer.value.trim(),
        date: f.date.value, time: f.time.value, note: f.note.value.trim() });
      it.location = f.to.value;
      logActivity(it.code + ' dipindahkan ke ' + f.to.value, 'transfer');
      notify('Barang bukti ' + it.code + ' telah dipindahkan ke ' + f.to.value);
      save();
      toast('Perpindahan ' + it.code + ' berhasil dicatat', 'ok');
      location.hash = '#/log';
    };
  }

  function viewLog() {
    var list = sortedTransfers();
    shell('log', 'Log Chain of Custody',
      '<div class="card"><div class="card-head"><h3>Log Chain of Custody</h3><div class="toolbar">' +
      '<select class="input" id="fc"><option value="">Semua Barang Bukti</option>' + db.items.map(function (i) { return '<option>' + esc(i.code) + '</option>'; }).join('') + '</select>' +
      '<button class="btn btn-ghost btn-sm" id="csv">' + icon('download') + 'Export CSV</button></div></div>' +
      '<div class="legend"><span>Total Perpindahan: ' + list.length + '</span><span class="g">Barang Bukti: ' + db.items.length + '</span></div>' +
      '<div id="tbl"></div></div>');
    function render() {
      var c = $('#fc').value;
      $('#tbl').innerHTML = transfersTable(list.filter(function (t) { return !c || t.code === c; }), true);
    }
    $('#fc').onchange = render; render();
    $('#csv').onclick = function () {
      var rows = [['Tanggal', 'Waktu', 'Kode Bukti', 'Jenis', 'Lokasi Asal', 'Lokasi Tujuan', 'Petugas', 'Keterangan']].concat(list.map(function (t) {
        var it = item(t.code); return [t.date, t.time, t.code, it ? it.type : '', t.from, t.to, t.officer, t.note];
      }));
      var csv = rows.map(function (r) { return r.map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
      a.download = 'log-chain-of-custody-' + today() + '.csv'; a.click();
    };
  }

  // ---------------------------------------------------------------- router
  function route() {
    closeModal();
    var h = location.hash.replace(/^#\/?/, ''), q = {}, path = h, qi = h.indexOf('?');
    if (qi >= 0) {
      path = h.slice(0, qi);
      h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); q[p[0]] = decodeURIComponent(p[1] || ''); });
    }
    var parts = path.split('/');
    if (!session()) {
      if (parts[0] && parts[0] !== 'login') sessionStorage.setItem('coc_after_login', '#/' + h);
      if (location.hash !== '#/login') history.replaceState(null, '', '#/login');
      return viewLogin();
    }
    switch (parts[0]) {
      case 'tambah': return viewTambah();
      case 'daftar': return viewDaftar();
      case 'bukti': return viewDetail(decodeURIComponent(parts[1] || ''));
      case 'perpindahan': return viewPerpindahan(q);
      case 'log': return viewLog();
      case 'dashboard': return viewDashboard();
      default: history.replaceState(null, '', '#/dashboard'); return viewDashboard();
    }
  }
  window.addEventListener('hashchange', route);
  load();
  route();
})();
