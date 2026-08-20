/* ============================================================
   exhibits.js — makaledeki 47 grafik/tablo: modül içi şekiller,
   galeri sayfası (#/grafikler) ve tam ekran lightbox
   ============================================================ */
(function () {
  'use strict';
  var M = window.Moat;
  var esc = M.esc,
    el = M.el,
    els = M.els;

  var Ex = {
    list: [],
    byModule: {},
    byNum: {}
  };

  var BOLUM_ETIKET = {
    p1: 'Bölüm 1',
    p2: 'Bölüm 2',
    p3: 'Bölüm 3',
    ek: 'Ek: Toplu veriler'
  };

  Ex.setData = function (list) {
    Ex.list = Array.isArray(list) ? list : [];
    Ex.byModule = {};
    Ex.byNum = {};
    Ex.list.forEach(function (e) {
      Ex.byNum[String(e.num)] = e;
      (e.moduller || []).forEach(function (mid) {
        if (!Ex.byModule[mid]) Ex.byModule[mid] = [];
        Ex.byModule[mid].push(e);
      });
    });
  };

  function thumb(e) {
    return String(e.file).replace(/exhibits\//, 'exhibits/thumbs/');
  }

  /* ---------------- modül içi şekil blokları ---------------- */
  function figureHTML(e) {
    var tall = e.w && e.h && e.h / e.w > 1.1;
    return (
      '<figure class="exhibit' +
      (tall ? ' exhibit-tall' : '') +
      '">' +
      '<p class="ex-label">Exhibit ' +
      esc(e.num) +
      ' — ' +
      esc(e.trTitle) +
      '</p>' +
      '<button class="ex-frame" type="button" data-ex="' +
      esc(e.num) +
      '" aria-label="' +
      esc('Exhibit ' + e.num + ' görüntüsünü büyüt') +
      '">' +
      '<img src="' +
      esc(e.file) +
      '" alt="' +
      esc(e.trTitle) +
      '" width="' +
      esc(e.w || '') +
      '" height="' +
      esc(e.h || '') +
      '" loading="lazy" decoding="async">' +
      '<span class="ex-zoom-hint" aria-hidden="true">Büyüt</span>' +
      '</button>' +
      '<figcaption>' +
      '<p class="ex-read"><b>Nasıl okunur:</b> ' +
      esc(e.nasilOkunur) +
      '</p>' +
      '<p class="ex-take"><b>Çıkarım:</b> ' +
      esc(e.cikarim) +
      '</p>' +
      '<p class="ex-src">Kaynak: ' +
      esc(e.kaynak) +
      ' · Makale s. ' +
      esc(e.page) +
      '</p>' +
      '</figcaption>' +
      '</figure>'
    );
  }

  Ex.figureHTML = figureHTML;

  /* Bir modülün tüm şekilleri (yoksa boş string) */
  Ex.forModule = function (moduleId) {
    var list = Ex.byModule[moduleId];
    if (!list || !list.length) return '';
    return (
      '<section class="block exhibit-block"><h2 class="block-title">Makaledeki grafikler (' +
      list.length +
      ')</h2>' +
      list
        .map(function (e) {
          return figureHTML(e);
        })
        .join('') +
      '</section>'
    );
  };

  /* ---------------- lightbox ---------------- */
  var lb = null,
    lbImg = null,
    lbCap = null,
    lbZoom = null,
    lastFocus = null,
    zoomed = false;

  function buildLightbox() {
    if (lb) return;
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.id = 'exLightbox';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Grafik büyütme');
    lb.innerHTML =
      '<div class="lb-bar">' +
      '<p class="lb-title" id="lbTitle"></p>' +
      '<div class="lb-btns">' +
      '<button class="lb-btn" id="lbZoom" type="button">%100</button>' +
      '<button class="lb-btn" id="lbClose" type="button" aria-label="Kapat (Esc)">Kapat ✕</button>' +
      '</div></div>' +
      '<div class="lb-stage" id="lbStage"><img id="lbImg" alt=""></div>' +
      '<div class="lb-cap" id="lbCap"></div>';
    document.body.appendChild(lb);
    lbImg = el('#lbImg', lb);
    lbCap = el('#lbCap', lb);
    lbZoom = el('#lbZoom', lb);

    el('#lbClose', lb).addEventListener('click', closeLB);
    lbZoom.addEventListener('click', function () {
      setZoom(!zoomed);
    });
    lbImg.addEventListener('click', function () {
      setZoom(!zoomed);
    });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.id === 'lbStage' || e.target === lbCap) closeLB();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb && !lb.hidden) {
        e.stopPropagation();
        closeLB();
      }
    });
  }

  function setZoom(on) {
    zoomed = !!on;
    lb.classList.toggle('zoomed', zoomed);
    lbZoom.textContent = zoomed ? 'Sığdır' : '%100';
    var stage = el('#lbStage', lb);
    if (!zoomed && stage) {
      stage.scrollTop = 0;
      stage.scrollLeft = 0;
    }
  }

  function openLB(num) {
    var e = Ex.byNum[String(num)];
    if (!e) return;
    buildLightbox();
    lastFocus = document.activeElement;
    lbImg.src = e.file;
    lbImg.alt = e.trTitle;
    el('#lbTitle', lb).textContent = 'Exhibit ' + e.num + ' — ' + e.trTitle;
    lbCap.innerHTML =
      '<p><b>Nasıl okunur:</b> ' +
      esc(e.nasilOkunur) +
      '</p><p class="lb-take"><b>Çıkarım:</b> ' +
      esc(e.cikarim) +
      '</p><p class="lb-src">Kaynak: ' +
      esc(e.kaynak) +
      ' · Makale s. ' +
      esc(e.page) +
      '</p>';
    setZoom(false);
    lb.hidden = false;
    document.body.classList.add('lb-open');
    el('#lbClose', lb).focus();
  }

  function closeLB() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    document.body.classList.remove('lb-open');
    lbImg.removeAttribute('src');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  Ex.open = openLB;

  /* Şekil tıklamaları için tek delegasyon (görünüm yenilenmesinden etkilenmez) */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-ex]') : null;
    if (!t) return;
    e.preventDefault();
    openLB(t.getAttribute('data-ex'));
  });

  /* ---------------- galeri sayfası ---------------- */
  var gal = { bolum: 'all', q: '' };

  Ex.page = function () {
    var counts = { all: Ex.list.length };
    Ex.list.forEach(function (e) {
      counts[e.bolum] = (counts[e.bolum] || 0) + 1;
    });
    var chips =
      '<div class="chip-row" id="exChips">' +
      ['all', 'p1', 'p2', 'p3', 'ek']
        .map(function (k) {
          if (k !== 'all' && !counts[k]) return '';
          return (
            '<button class="chip" type="button" data-exbolum="' +
            k +
            '" aria-pressed="' +
            (gal.bolum === k) +
            '">' +
            (k === 'all' ? 'Tümü' : esc(BOLUM_ETIKET[k])) +
            ' (' +
            counts[k] +
            ')</button>'
          );
        })
        .join('') +
      '</div>';

    return (
      '<div class="page">' +
      '<p class="eyebrow">Görsel kanıt</p><h1 style="font-size:var(--text-xl)">Grafikler ve tablolar</h1>' +
      '<p class="lede">Makalenin ' +
      Ex.list.length +
      ' grafiğinin tamamı: her biri Türkçe başlık, “nasıl okunur” kılavuzu ve çıkarımla birlikte. Karta tıkla, tam boyutta aç; ilgili modüle geçip bağlamı oku.</p>' +
      '<div class="toolbar"><label for="exSearch">Ara</label>' +
      '<input type="text" id="exSearch" placeholder="ör. ROIC, beş güç, brüt kâr" style="min-width:220px" value="' +
      esc(gal.q) +
      '">' +
      '<span id="exCount" style="font-size:var(--text-sm);color:var(--color-text-muted);margin-left:auto"></span></div>' +
      chips +
      '<div id="exGrid" class="ex-grid"></div>' +
      '</div>'
    );
  };

  function renderGrid() {
    var grid = el('#exGrid');
    if (!grid) return;
    var q = M.norm(gal.q.trim());
    var list = Ex.list.filter(function (e) {
      if (gal.bolum !== 'all' && e.bolum !== gal.bolum) return false;
      if (!q) return true;
      var hay = M.norm(
        [e.trTitle, e.title, e.nasilOkunur, e.cikarim, e.kaynak, 'exhibit ' + e.num].join(' ')
      );
      return hay.indexOf(q) >= 0;
    });
    var cnt = el('#exCount');
    if (cnt) cnt.textContent = list.length + ' grafik';
    if (!list.length) {
      grid.innerHTML = '<p class="empty-note">Bu aramaya uyan grafik yok. Farklı bir sözcük dene.</p>';
      return;
    }
    grid.innerHTML = list
      .map(function (e) {
        var mid = (e.moduller || [])[0];
        var mod = mid && M.helpers ? M.helpers.moduleById(mid) : null;
        return (
          '<article class="ex-card">' +
          '<button class="ex-card-shot" type="button" data-ex="' +
          esc(e.num) +
          '" aria-label="' +
          esc('Exhibit ' + e.num + ' — ' + e.trTitle + ' — büyüt') +
          '">' +
          '<img src="' +
          esc(thumb(e)) +
          '" alt="' +
          esc(e.trTitle) +
          '" loading="lazy" decoding="async">' +
          '</button>' +
          '<div class="ex-card-body">' +
          '<p class="ex-card-no">Exhibit ' +
          esc(e.num) +
          ' · ' +
          esc(BOLUM_ETIKET[e.bolum] || '') +
          '</p>' +
          '<h3>' +
          esc(e.trTitle) +
          '</h3>' +
          '<p class="ex-card-take">' +
          esc(e.cikarim) +
          '</p>' +
          (mod
            ? '<a class="ex-card-link" href="#/modul/' + esc(mid) + '">Modüle git: ' + esc(mod.title) + ' →</a>'
            : '') +
          '</div></article>'
        );
      })
      .join('');
  }

  Ex.pageAfter = function () {
    var input = el('#exSearch');
    if (input) {
      input.addEventListener('input', function () {
        gal.q = input.value;
        renderGrid();
      });
    }
    els('#exChips button').forEach(function (b) {
      b.addEventListener('click', function () {
        gal.bolum = b.getAttribute('data-exbolum');
        els('#exChips button').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        renderGrid();
      });
    });
    renderGrid();
  };

  M.Exhibits = Ex;
})();
