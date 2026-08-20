/* ============================================================
   boot.js — veri yükleme, hash yönlendirme, global arama
   ============================================================ */
(function () {
  'use strict';
  var M = window.Moat;
  var el = M.el,
    els = M.els,
    esc = M.esc;

  var view = el('#view');
  var loading = el('#loading');

  /* ---------- arama indeksi ---------- */
  var index = [];
  function buildIndex() {
    M.data.modules.forEach(function (m) {
      var chunks = []
        .concat(m.ozet ? [m.ozet] : [])
        .concat(m.neden ? [m.neden] : [])
        .concat(m.aciklama || [])
        .concat(m.ornek ? [m.ornek] : [])
        .concat((m.formuller || []).map(function (b) { return b.metin; }))
        .concat((m.kanit || []).map(function (b) { return b.metin; }))
        .concat(m.hatalar || [])
        .concat(m.sorular || [])
        .concat(m.kontrolListesi || []);
      var text = chunks.join(' ');
      index.push({
        id: m.id,
        title: m.title,
        part: m.partNo,
        no: m.no,
        text: text,
        nTitle: M.norm(m.title),
        nText: M.norm(text)
      });
    });
  }

  function snippet(text, nText, q) {
    var i = nText.indexOf(q);
    if (i < 0) return text.slice(0, 140) + '…';
    var start = Math.max(0, i - 55);
    var raw = text.slice(start, start + 170);
    var out = esc(raw);
    // vurguyu ham metindeki konumdan üret
    var rel = i - start;
    var before = esc(raw.slice(0, rel));
    var hit = esc(raw.slice(rel, rel + q.length));
    var after = esc(raw.slice(rel + q.length));
    out = before + '<mark>' + hit + '</mark>' + after;
    return (start > 0 ? '…' : '') + out + '…';
  }

  function search(qRaw) {
    var q = M.norm(qRaw.trim());
    if (q.length < 2) return [];
    var res = [];
    index.forEach(function (it) {
      var score = 0;
      if (it.nTitle.indexOf(q) >= 0) score += 100;
      var ti = it.nText.indexOf(q);
      if (ti >= 0) score += 20;
      if (!score) return;
      res.push({
        href: '#/modul/' + it.id,
        title: it.title,
        meta: 'Bölüm ' + it.part + ' · Modül ' + it.no,
        snip: ti >= 0 ? snippet(it.text, it.nText, q) : esc(it.text.slice(0, 130)) + '…',
        score: score
      });
    });
    M.data.sozluk.forEach(function (t) {
      if (M.norm(t.en).indexOf(q) >= 0 || M.norm(t.tr).indexOf(q) >= 0) {
        res.push({
          href: '#/sozluk',
          title: t.tr + ' — ' + t.en,
          meta: 'Sözlük terimi',
          snip: 'Sözlükte ve ' + (t.modules || []).length + ' modülde geçiyor.',
          score: 60
        });
      }
    });
    if (M.Exhibits && M.Exhibits.list.length) {
      M.Exhibits.list.forEach(function (x) {
        if (M.norm(x.trTitle + ' ' + x.title + ' exhibit ' + x.num).indexOf(q) < 0) return;
        res.push({
          href: '#/grafikler',
          title: 'Exhibit ' + x.num + ' — ' + x.trTitle,
          meta: 'Grafik',
          snip: esc(x.cikarim.slice(0, 150)) + '…',
          score: 50
        });
      });
    }
    res.sort(function (a, b) {
      return b.score - a.score;
    });
    return res.slice(0, 25);
  }

  /* ---------- arama katmanı ---------- */
  var overlay = el('#searchOverlay');
  var input = el('#searchInput');
  var results = el('#searchResults');
  var active = -1;

  function openSearch() {
    overlay.hidden = false;
    input.value = '';
    results.innerHTML = '<p class="empty-note">En az iki harf yaz: modül başlıkları, metinler ve sözlük terimleri taranır.</p>';
    active = -1;
    setTimeout(function () {
      input.focus();
    }, 20);
  }
  function closeSearch() {
    overlay.hidden = true;
  }
  function renderResults() {
    var list = search(input.value);
    if (!input.value.trim() || input.value.trim().length < 2) {
      results.innerHTML = '<p class="empty-note">En az iki harf yaz.</p>';
      return;
    }
    if (!list.length) {
      results.innerHTML = '<p class="empty-note">“' + esc(input.value) + '” için sonuç yok.</p>';
      return;
    }
    results.innerHTML = list
      .map(function (r, i) {
        return (
          '<a href="' +
          r.href +
          '" data-i="' +
          i +
          '"><span class="r-meta">' +
          esc(r.meta) +
          '</span><div class="r-title">' +
          esc(r.title) +
          '</div><div class="r-snip">' +
          r.snip +
          '</div></a>'
        );
      })
      .join('');
    active = -1;
  }

  el('#searchOpen').addEventListener('click', openSearch);
  el('#searchClose').addEventListener('click', closeSearch);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSearch();
  });
  input.addEventListener('input', renderResults);
  results.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (a) closeSearch();
  });
  input.addEventListener('keydown', function (e) {
    var items = els('a', results);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      active = e.key === 'ArrowDown' ? Math.min(items.length - 1, active + 1) : Math.max(0, active - 1);
      items.forEach(function (x, i) {
        x.classList.toggle('active', i === active);
      });
      items[active].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (active >= 0 && items[active]) {
        location.hash = items[active].getAttribute('href').slice(1) ? items[active].getAttribute('href') : '#/';
        closeSearch();
      } else if (items.length) {
        location.hash = items[0].getAttribute('href');
        closeSearch();
      }
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) {
      closeSearch();
      return;
    }
    if (e.key === '/' && overlay.hidden) {
      var t = e.target;
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      e.preventDefault();
      openSearch();
      return;
    }
    if (!overlay.hidden) return;
    if (M._moduleKeys) M._moduleKeys(e);
    if (M._cardKeys) M._cardKeys(e);
  });

  /* ---------- mobil menü ---------- */
  var navToggle = el('#navToggle');
  var nav = el('.site-nav');
  navToggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- yönlendirme ---------- */
  function setNavActive(key) {
    els('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === key) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function route() {
    M._moduleKeys = null;
    M._cardKeys = null;
    var hash = location.hash.replace(/^#/, '') || '/';
    var seg = hash.split('/').filter(Boolean);
    var page = seg[0] || 'home';
    var html, after, navKey, pageTitle;

    if (page === 'modul') {
      var id = seg[1] || M.data.modules[0].id;
      html = M.Pages.module(id);
      after = function () {
        M.Pages.moduleAfter(id);
      };
      navKey = 'modul';
      var mo = M.helpers.moduleById(id);
      pageTitle = mo ? mo.title : 'Modüller';
    } else if (page === 'kartlar') {
      html = M.Pages.cards();
      after = M.Pages.cardsAfter;
      navKey = 'kartlar';
      pageTitle = 'Tekrar kartları';
    } else if (page === 'quiz') {
      html = M.Pages.quiz();
      after = M.Pages.quizAfter;
      navKey = 'quiz';
      pageTitle = 'Quiz';
    } else if (page === 'arac') {
      html = M.Pages.tool();
      after = M.Pages.toolAfter;
      navKey = 'arac';
      pageTitle = 'Hendek analiz aracı';
    } else if (page === 'grafikler') {
      html = M.Pages.exhibits();
      after = M.Pages.exhibitsAfter;
      navKey = 'grafikler';
      pageTitle = 'Grafikler';
    } else if (page === 'sozluk') {
      html = M.Pages.glossary();
      after = M.Pages.glossaryAfter;
      navKey = 'sozluk';
      pageTitle = 'Sözlük';
    } else {
      html = M.Pages.home();
      after = null;
      navKey = 'home';
    }

    view.innerHTML = html;
    setNavActive(navKey);
    if (after) after();
    document.title = pageTitle
      ? pageTitle + ' — Hendeği Ölçmek'
      : 'Hendeği Ölçmek — Measuring the Moat Kursu';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------- başlat ---------- */
  try {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  } catch (e) {}
  M.initTheme();

  function getJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error(path + ': HTTP ' + r.status);
      return r.json();
    });
  }

  Promise.all([getJSON('data/course.json'), getJSON('data/exhibits.json')])
    .then(function (res) {
      var d = res[0];
      M.data = d;
      if (M.Exhibits) M.Exhibits.setData(res[1]);
      buildIndex();
      loading.hidden = true;
      view.hidden = false;
      window.addEventListener('hashchange', route);
      route();
    })
    .catch(function (err) {
      loading.innerHTML =
        '<h1 style="font-size:var(--text-xl)">İçerik yüklenemedi</h1><p class="lede">Kurs verisi (<code>data/course.json</code>) okunamadı: ' +
        esc(err.message) +
        '. Sayfayı yenilemeyi dene.</p>';
    });
})();
