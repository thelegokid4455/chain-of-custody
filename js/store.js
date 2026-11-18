/* Data layer. Two backends with the same promise-based API:
   - Supabase (shared database) when js/config.js has a URL and key
   - Local demo (localStorage) otherwise */
(function () {
  'use strict';
  var CFG = window.COC_CONFIG || {};
  var configured = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);

  function fail(msg) { return Promise.reject(new Error(msg)); }
  function dataUrlToBlob(d) { return fetch(d).then(function (r) { return r.blob(); }); }
  function friendly(err) {
    var m = (err && (err.message || err.error_description)) || String(err);
    if (/Invalid login credentials/i.test(m)) return 'Email atau password salah';
    if (/Email not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek kotak masuk email Anda.';
    if (/already registered|already exists/i.test(m)) return 'Email sudah terdaftar';
    if (/Password should be at least/i.test(m)) return 'Password minimal 6 karakter';
    if (/duplicate key.*items_pkey/i.test(m)) return 'Kode barang bukti sudah digunakan';
    if (/row-level security/i.test(m)) return 'Anda tidak memiliki izin untuk tindakan ini';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Tidak dapat terhubung ke server. Periksa koneksi internet.';
    return m;
  }

  // =================================================================== Supabase
  function SupabaseStore() {
    var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
    var BUCKET = 'evidence-photos';
    var me = null;

    function check(res) { if (res.error) throw res.error; return res.data; }

    function loadProfile(user) {
      return sb.from('profiles').select('name, role').eq('id', user.id).single().then(function (res) {
        var p = check(res);
        me = { id: user.id, email: user.email, name: p.name, role: p.role,
          loginAt: user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : Date.now() };
        return me;
      });
    }

    return {
      mode: 'supabase',
      friendly: friendly,
      me: function () { return me; },
      init: function () {
        return sb.auth.getSession().then(function (res) {
          var s = res.data && res.data.session;
          if (!s) return null;
          return loadProfile(s.user).catch(function () { me = null; return null; });
        });
      },
      signIn: function (email, password) {
        return sb.auth.signInWithPassword({ email: email, password: password })
          .then(function (res) { var d = check(res); return loadProfile(d.user); })
          .then(function (u) {
            return sb.from('activity').insert({ message: u.name + ' login sebagai ' + u.role, kind: 'login', by_name: u.name })
              .then(function () { return u; });
          });
      },
      signUp: function (name, email, password, role) {
        return sb.auth.signUp({ email: email, password: password, options: { data: { name: name, role: role },
          emailRedirectTo: location.href.split('#')[0] } })
          .then(function (res) {
            var d = check(res);
            if (!d.session) return { needsConfirm: true };
            return loadProfile(d.user).then(function (u) { return { user: u }; });
          });
      },
      signOut: function () {
        var u = me;
        var log = u ? sb.from('activity').insert({ message: u.name + ' logout', kind: 'logout', by_name: u.name }) : Promise.resolve();
        return log.then(function () { return sb.auth.signOut(); }).then(function () { me = null; });
      },
      load: function () {
        return Promise.all([
          sb.from('items').select('*').order('created_at', { ascending: false }),
          sb.from('transfers').select('*').order('id', { ascending: true }),
          sb.from('activity').select('*').order('id', { ascending: false }).limit(30)
        ]).then(function (r) {
          var items = check(r[0]), transfers = check(r[1]), activity = check(r[2]);
          var paths = items.filter(function (i) { return i.photo_path; }).map(function (i) { return i.photo_path; });
          var signing = paths.length ? sb.storage.from(BUCKET).createSignedUrls(paths, 3600) : Promise.resolve({ data: [] });
          return signing.then(function (sres) {
            var urls = {};
            (sres.data || []).forEach(function (s) { if (s.signedUrl) urls[s.path] = s.signedUrl; });
            return {
              items: items.map(function (i) {
                return { code: i.code, type: i.type, desc: i.description, location: i.location, date: i.collected_date,
                  officer: i.officer, photo: urls[i.photo_path] || null, photoPath: i.photo_path, createdAt: Date.parse(i.created_at) };
              }),
              transfers: transfers.map(function (t) {
                return { id: t.id, code: t.code, from: t.from_loc, to: t.to_loc, officer: t.officer, date: t.moved_date,
                  time: t.moved_time, note: t.note };
              }),
              activity: activity.map(function (a) {
                return { id: a.id, text: a.message, kind: a.kind, by: a.by_name, ts: Date.parse(a.created_at) };
              })
            };
          });
        });
      },
      addItem: function (it, photoDataUrl) {
        var upload = Promise.resolve(null);
        if (photoDataUrl) {
          var path = it.code + '/' + Date.now() + '.jpg';
          upload = dataUrlToBlob(photoDataUrl).then(function (blob) {
            return sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
          }).then(function (res) { check(res); return path; });
        }
        return upload.then(function (path) {
          return sb.from('items').insert({ code: it.code, type: it.type, description: it.desc, location: it.location,
            collected_date: it.date, officer: it.officer, photo_path: path, created_by: me.id });
        }).then(check);
      },
      addTransfer: function (t) {
        return sb.from('transfers').insert({ code: t.code, from_loc: t.from, to_loc: t.to, officer: t.officer,
          moved_date: t.date, moved_time: t.time, note: t.note || null, created_by: me.id }).then(check);
      },
      deleteItem: function (code) {
        return sb.from('items').delete().eq('code', code).select().then(function (res) {
          var d = check(res);
          if (!d || !d.length) throw new Error('row-level security');
        });
      }
    };
  }

  // =================================================================== Local demo
  function LocalStore() {
    var KEY = 'coc_data_v1', SESSION = 'coc_session_v1';
    var db;
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
        nextId: 10
      };
    }
    function load() {
      try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
      if (!db || !db.items) { db = seed(); persist(); }
      db.activity = (db.activity || []).map(function (a) { return { text: a.text, kind: a.kind, ts: a.ts, by: a.by }; });
    }
    function persist() { localStorage.setItem(KEY, JSON.stringify(db)); }
    function me() { try { return JSON.parse(localStorage.getItem(SESSION)); } catch (e) { return null; } }
    function log(text, kind) {
      var u = me();
      db.activity.unshift({ text: text, kind: kind, ts: Date.now(), by: u ? u.name : '' });
      db.activity = db.activity.slice(0, 30);
    }
    function save() {
      try { persist(); return Promise.resolve(); }
      catch (e) { return fail('Penyimpanan browser penuh. Coba foto yang lebih kecil.'); }
    }
    function find(code) { return db.items.filter(function (i) { return i.code === code; })[0]; }
    load();
    return {
      mode: 'local',
      friendly: friendly,
      me: me,
      init: function () { return Promise.resolve(me()); },
      signIn: function (name, password, role) {
        var u = { id: 'local', name: name, role: role, loginAt: Date.now() };
        localStorage.setItem(SESSION, JSON.stringify(u));
        log(name + ' login sebagai ' + role, 'login'); persist();
        return Promise.resolve(u);
      },
      signUp: function () { return fail('Pendaftaran hanya tersedia saat database terhubung'); },
      signOut: function () {
        var u = me(); if (u) { log(u.name + ' logout', 'logout'); persist(); }
        localStorage.removeItem(SESSION); return Promise.resolve();
      },
      load: function () {
        load();
        return Promise.resolve({ items: db.items.slice(), transfers: db.transfers.slice(), activity: db.activity.slice() });
      },
      addItem: function (it, photo) {
        if (find(it.code)) return fail('Kode barang bukti sudah digunakan');
        db.items.push({ code: it.code, type: it.type, desc: it.desc, location: it.location, date: it.date,
          officer: it.officer, photo: photo || null, createdAt: Date.now() });
        log(it.code + ' (' + it.type + ') ditambahkan', 'add');
        return save().catch(function (e) { db.items.pop(); throw e; });
      },
      addTransfer: function (t) {
        var it = find(t.code); if (!it) return fail('Barang bukti tidak ditemukan');
        db.transfers.push({ id: db.nextId++, code: t.code, from: t.from, to: t.to, officer: t.officer, date: t.date, time: t.time, note: t.note });
        it.location = t.to;
        log(t.code + ' dipindahkan ke ' + t.to, 'transfer');
        return save();
      },
      deleteItem: function (code) {
        db.items = db.items.filter(function (i) { return i.code !== code; });
        db.transfers = db.transfers.filter(function (t) { return t.code !== code; });
        log(code + ' dihapus', 'del');
        return save();
      }
    };
  }

  if (configured && !window.supabase) {
    window.COCStore = null; // library failed to load; app shows an error
  } else {
    window.COCStore = configured ? SupabaseStore() : LocalStore();
  }
  window.COC_CONFIGURED = configured;
})();
