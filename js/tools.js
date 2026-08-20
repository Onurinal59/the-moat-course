/* ============================================================
   tools.js — Hendek Analiz Aracı: kontrol listesi + hesap makinesi
   ============================================================ */
(function () {
  'use strict';
  var M = window.Moat;
  var el = M.el,
    els = M.els,
    esc = M.esc,
    inline = M.inline,
    num = M.num,
    fmt = M.fmt,
    pct = M.pct;

  var state = { tab: 'liste' };

  function checkState() {
    var v = M.Store.get(M.KEYS.check, {});
    return v && typeof v === 'object' ? v : {};
  }
  function noteState() {
    var v = M.Store.get(M.KEYS.notes, {});
    return v && typeof v === 'object' ? v : {};
  }

  function itemKey(gi, mi, si) {
    return 'g' + gi + '-m' + mi + (si == null ? '' : '-s' + si);
  }

  /* ---------------- kontrol listesi ---------------- */
  function checklistHTML() {
    var kl = M.data.kontrolListesi;
    var checks = checkState();
    var notes = noteState();
    var totalItems = 0;

    var groups = kl.gruplar
      .map(function (g, gi) {
        var count = 0;
        var done = 0;
        var items = g.maddeler
          .map(function (mad, mi) {
            var rows = '';
            var k = itemKey(gi, mi);
            count++;
            totalItems++;
            if (checks[k]) done++;
            rows +=
              '<div class="check-item"><label class="check-line' +
              (checks[k] ? ' done' : '') +
              '"><input type="checkbox" data-check="' +
              k +
              '"' +
              (checks[k] ? ' checked' : '') +
              '><span>' +
              inline(mad.metin) +
              '</span></label>' +
              '<textarea data-note="' +
              k +
              '" placeholder="Notun / bulgun…" rows="1">' +
              esc(notes[k] || '') +
              '</textarea></div>';
            (mad.altMaddeler || []).forEach(function (alt, si) {
              var ks = itemKey(gi, mi, si);
              count++;
              totalItems++;
              if (checks[ks]) done++;
              rows +=
                '<div class="check-item sub"><label class="check-line' +
                (checks[ks] ? ' done' : '') +
                '"><input type="checkbox" data-check="' +
                ks +
                '"' +
                (checks[ks] ? ' checked' : '') +
                '><span>' +
                inline(alt) +
                '</span></label>' +
                '<textarea data-note="' +
                ks +
                '" placeholder="Notun…" rows="1">' +
                esc(notes[ks] || '') +
                '</textarea></div>';
            });
            return rows;
          })
          .join('');
        return (
          '<section class="check-group" data-group="' +
          gi +
          '"><h3>' +
          esc(g.baslik) +
          '<em data-gcount="' +
          gi +
          '">' +
          done +
          '/' +
          count +
          '</em></h3>' +
          items +
          '</section>'
        );
      })
      .join('');

    var doneAll = Object.keys(checks).filter(function (k) {
      return checks[k];
    }).length;

    return (
      '<p class="lede" style="margin-bottom:var(--space-6)">' +
      inline(M.data.kontrolListesi.not) +
      '</p>' +
      '<div class="toolbar"><label for="companyName">Şirket</label>' +
      '<input type="text" id="companyName" placeholder="Analiz ettiğin şirket" style="min-width:220px" value="' +
      esc(M.Store.get('moat.sirket', '')) +
      '">' +
      '<span id="checkSummary" style="font-size:var(--text-sm);color:var(--color-text-muted);margin-left:auto">' +
      doneAll +
      ' / ' +
      totalItems +
      ' madde işaretli</span></div>' +
      groups +
      '<div class="sticky-actions">' +
      '<button class="btn btn-primary btn-sm" id="dlChecklist">Analizi Markdown olarak indir</button>' +
      '<button class="btn btn-outline btn-sm" id="clearChecklist">Listeyi temizle</button>' +
      '<span style="font-size:var(--text-xs);color:var(--color-text-faint)">İşaretler ve notlar tarayıcında saklanır.</span>' +
      '</div>'
    );
  }

  function totalItemCount() {
    var n = 0;
    M.data.kontrolListesi.gruplar.forEach(function (g) {
      g.maddeler.forEach(function (m) {
        n += 1 + (m.altMaddeler || []).length;
      });
    });
    return n;
  }

  function refreshCounts() {
    var checks = checkState();
    M.data.kontrolListesi.gruplar.forEach(function (g, gi) {
      var count = 0,
        done = 0;
      g.maddeler.forEach(function (m, mi) {
        count++;
        if (checks[itemKey(gi, mi)]) done++;
        (m.altMaddeler || []).forEach(function (a, si) {
          count++;
          if (checks[itemKey(gi, mi, si)]) done++;
        });
      });
      var badge = el('[data-gcount="' + gi + '"]');
      if (badge) badge.textContent = done + '/' + count;
    });
    var sum = el('#checkSummary');
    if (sum) {
      var d = Object.keys(checks).filter(function (k) {
        return checks[k];
      }).length;
      sum.textContent = d + ' / ' + totalItemCount() + ' madde işaretli';
    }
  }

  function buildMarkdown() {
    var checks = checkState();
    var notes = noteState();
    var company = (el('#companyName') && el('#companyName').value.trim()) || 'İsimsiz şirket';
    var now = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
    var lines = [];
    lines.push('# Hendek Analizi — ' + company);
    lines.push('');
    lines.push('- **Tarih:** ' + now);
    lines.push('- **Çerçeve:** Measuring the Moat kontrol listesi (Mauboussin & Callahan, Morgan Stanley Counterpoint Global, 15 Ekim 2024)');
    var d = Object.keys(checks).filter(function (k) {
      return checks[k];
    }).length;
    lines.push('- **Tamamlanan madde:** ' + d + ' / ' + totalItemCount());
    lines.push('');

    M.data.kontrolListesi.gruplar.forEach(function (g, gi) {
      lines.push('## ' + g.baslik);
      lines.push('');
      g.maddeler.forEach(function (m, mi) {
        var k = itemKey(gi, mi);
        lines.push('- [' + (checks[k] ? 'x' : ' ') + '] ' + m.metin);
        if (notes[k]) lines.push('    - _Not:_ ' + notes[k].replace(/\n+/g, ' '));
        (m.altMaddeler || []).forEach(function (alt, si) {
          var ks = itemKey(gi, mi, si);
          lines.push('    - [' + (checks[ks] ? 'x' : ' ') + '] ' + alt);
          if (notes[ks]) lines.push('        - _Not:_ ' + notes[ks].replace(/\n+/g, ' '));
        });
      });
      lines.push('');
    });

    var c = M.Store.get('moat.hesap', null);
    if (c) {
      lines.push('## Hesaplamalar');
      lines.push('');
      lines.push('| Gösterge | Değer |');
      lines.push('| --- | --- |');
      c.forEach(function (r) {
        lines.push('| ' + r[0] + ' | ' + r[1] + ' |');
      });
      lines.push('');
    }
    lines.push('---');
    lines.push('');
    lines.push('_Hendeği Ölçmek kursu ile oluşturuldu. Yatırım tavsiyesi değildir._');
    return lines.join('\n');
  }

  function bindChecklist() {
    var body = el('#toolBody');
    if (!body) return;
    body.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('input[type=checkbox][data-check]')) {
        var checks = checkState();
        var k = t.getAttribute('data-check');
        if (t.checked) checks[k] = 1;
        else delete checks[k];
        M.Store.set(M.KEYS.check, checks);
        t.closest('.check-line').classList.toggle('done', t.checked);
        refreshCounts();
      }
    });
    body.addEventListener('input', function (e) {
      var t = e.target;
      if (t.matches('textarea[data-note]')) {
        var notes = noteState();
        var k = t.getAttribute('data-note');
        if (t.value.trim()) notes[k] = t.value;
        else delete notes[k];
        M.Store.set(M.KEYS.notes, notes);
      }
      if (t.id === 'companyName') M.Store.set('moat.sirket', t.value);
    });
    var dl = el('#dlChecklist');
    if (dl)
      dl.addEventListener('click', function () {
        var md = buildMarkdown();
        var company = (el('#companyName') && el('#companyName').value.trim()) || 'hendek-analizi';
        var slug = M.norm(company).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'hendek-analizi';
        try {
          var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = slug + '-hendek-analizi.md';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () {
            URL.revokeObjectURL(url);
          }, 2000);
          dl.textContent = '✓ İndirildi';
          setTimeout(function () {
            dl.textContent = 'Analizi Markdown olarak indir';
          }, 2200);
        } catch (err) {
          dl.textContent = 'İndirme başarısız';
        }
      });
    var cl = el('#clearChecklist');
    if (cl)
      cl.addEventListener('click', function () {
        M.Store.set(M.KEYS.check, {});
        M.Store.set(M.KEYS.notes, {});
        el('#toolBody').innerHTML = checklistHTML();
        bindChecklist();
      });
  }

  /* ---------------- hesap makinesi ---------------- */
  var CALC_FIELDS = [
    { grp: 'ROIC ve ekonomik kâr', f: [
      { id: 'ebit', l: 'FVÖK (EBIT)', h: 'Faiz ve vergi öncesi kâr, para birimi', v: 1200 },
      { id: 'tax', l: 'Efektif vergi oranı', h: 'yüzde', v: 25 },
      { id: 'capital', l: 'Yatırılmış sermaye', h: 'Net işletme sermayesi + net duran varlıklar', v: 6000 },
      { id: 'satis', l: 'Satışlar (gelir)', h: 'ROIC ayrıştırması için', v: 9000 }
    ] },
    { grp: 'WACC girdileri', f: [
      { id: 'ke', l: 'Özkaynak maliyeti', h: 'yüzde', v: 12 },
      { id: 'kd', l: 'Borç maliyeti (vergi öncesi)', h: 'yüzde', v: 8 },
      { id: 'eq', l: 'Özkaynak piyasa değeri', h: 'E', v: 8000 },
      { id: 'debt', l: 'Net finansal borç', h: 'D', v: 2000 }
    ] },
    { grp: 'Nakit dönüşüm döngüsü', f: [
      { id: 'stokG', l: 'Stok devir günü (DIO)', h: 'gün', v: 60 },
      { id: 'alacakG', l: 'Alacak tahsil günü (DSO)', h: 'gün', v: 45 },
      { id: 'borcG', l: 'Borç ödeme günü (DPO)', h: 'gün', v: 50 }
    ] }
  ];

  function calcHTML() {
    var saved = M.Store.get('moat.hesapGirdi', {});
    var fieldsets = CALC_FIELDS.map(function (g) {
      return (
        '<fieldset class="field-set"><legend>' +
        esc(g.grp) +
        '</legend>' +
        g.f
          .map(function (f) {
            var v = saved[f.id] != null ? saved[f.id] : f.v;
            return (
              '<label class="field"><span>' +
              esc(f.l) +
              '<span class="hint">' +
              esc(f.h) +
              '</span></span>' +
              '<input type="number" step="any" id="c_' +
              f.id +
              '" data-calc="' +
              f.id +
              '" value="' +
              esc(v) +
              '"></label>'
            );
          })
          .join('') +
        '</fieldset>'
      );
    }).join('');

    return (
      '<p class="lede" style="margin-bottom:var(--space-6)">Girdileri değiştir; ROIC, WACC, ekonomik kâr, ROIC ayrıştırması ve nakit dönüşüm döngüsü anında güncellenir. Para birimi fark etmez, tutarlı olması yeterli.</p>' +
      '<div class="calc-grid"><form id="calcForm" autocomplete="off">' +
      fieldsets +
      '<button type="button" class="btn btn-outline btn-sm" id="calcReset">Varsayılan değerlere dön</button>' +
      '</form>' +
      '<aside class="result-card" id="calcOut"></aside></div>'
    );
  }

  function calcRun() {
    var g = function (id) {
      var n = el('#c_' + id);
      return n ? num(n.value) : 0;
    };
    var ebit = g('ebit'),
      tax = g('tax'),
      cap = g('capital'),
      satis = g('satis'),
      ke = g('ke'),
      kd = g('kd'),
      eq = g('eq'),
      debt = g('debt'),
      dio = g('stokG'),
      dso = g('alacakG'),
      dpo = g('borcG');

    var nopat = ebit * (1 - tax / 100);
    var roic = cap ? (nopat / cap) * 100 : NaN;
    var V = eq + debt;
    var wacc = V ? (ke * (eq / V) + kd * (1 - tax / 100) * (debt / V)) : NaN;
    var spread = roic - wacc;
    var ep = isFinite(spread) ? (spread / 100) * cap : NaN;
    var marj = satis ? (nopat / satis) * 100 : NaN;
    var devir = cap ? satis / cap : NaN;
    var ccc = dio + dso - dpo;

    var rows = [
      ['NOPAT (vergi sonrası faaliyet kârı)', fmt(nopat, 1)],
      ['Yatırılmış sermaye', fmt(cap, 1)],
      ['ROIC', pct(roic, 2)],
      ['WACC', pct(wacc, 2)],
      ['ROIC − WACC farkı', pct(spread, 2)],
      ['Ekonomik kâr', fmt(ep, 1)],
      ['NOPAT marjı', pct(marj, 2)],
      ['Sermaye devir hızı', fmt(devir, 2) + '×'],
      ['Nakit dönüşüm döngüsü', fmt(ccc, 0) + ' gün']
    ];

    var verdictCls = 'verdict',
      verdict = '';
    if (!isFinite(spread)) {
      verdict = 'Yatırılmış sermaye ve sermaye yapısı girdilerini doldur; fark hesaplanamıyor.';
    } else if (spread > 2) {
      verdictCls += ' good';
      verdict =
        '<strong>Fark pozitif: değer yaratılıyor.</strong> ROIC, WACC’ı ' +
        pct(spread, 2) +
        ' aşıyor; her birim yatırılmış sermaye ekonomik kâr üretiyor (' +
        fmt(ep, 1) +
        '). Sıradaki soru bu farkın <em>ne kadar süre</em> korunabileceğidir: giriş engelleri, sektör yapısı ve fiyatın zaten neyi içerdiği.';
    } else if (spread > 0) {
      verdictCls += ' good';
      verdict =
        '<strong>Fark ince ama pozitif.</strong> ' +
        pct(spread, 2) +
        ' fark, ölçüm hatası ve sermaye maliyeti tahmininin belirsizliğiyle kolayca silinebilir. Hendek varsayımını maddi olmayan varlıkların aktifleştirilmesi ve kiralamalar gibi düzeltmelerle test et.';
    } else if (spread === 0) {
      verdict = '<strong>Fark sıfır.</strong> Şirket tam olarak sermaye maliyetini kazanıyor; büyüme değer yaratmaz, yalnızca büyüklüğü artırır.';
    } else {
      verdictCls += ' bad';
      verdict =
        '<strong>Fark negatif: değer yok ediliyor.</strong> ROIC, WACC’ın ' +
        pct(Math.abs(spread), 2) +
        ' altında; ekonomik kâr ' +
        fmt(ep, 1) +
        '. Bu durumda büyüme değeri <em>azaltır</em>; muhasebe kârı pozitif olsa bile hendek iddiası desteklenmez.';
    }

    var cccNote =
      ccc < 0
        ? 'Nakit dönüşüm döngüsü negatif (' + fmt(ccc, 0) + ' gün): tedarikçiler işletme sermayesini finanse ediyor, bu pazarlık gücünün göstergesidir.'
        : 'Nakit dönüşüm döngüsü ' + fmt(ccc, 0) + ' gün: her satış büyümesi bu kadar günlük işletme sermayesi bağlar.';

    var out = el('#calcOut');
    if (!out) return;
    out.innerHTML =
      '<h2 style="font-size:var(--text-lg);margin-bottom:var(--space-4)">Sonuçlar</h2>' +
      rows
        .map(function (r, i) {
          var hi = r[0] === 'ROIC − WACC farkı' || r[0] === 'ROIC' ? ' hi' : '';
          return '<div class="result-row' + hi + '"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
        })
        .join('') +
      '<div class="' +
      verdictCls +
      '">' +
      verdict +
      '</div>' +
      '<div class="verdict" style="margin-top:var(--space-3)">' +
      esc(cccNote) +
      '</div>' +
      '<p style="margin-top:var(--space-4);font-size:var(--text-xs);color:var(--color-text-faint)">Kimlik: ROIC = NOPAT marjı × sermaye devir hızı = ' +
      pct(marj, 2) +
      ' × ' +
      fmt(devir, 2) +
      '× = ' +
      pct(marj * devir, 2) +
      '</p>';

    M.Store.set('moat.hesap', rows);
    var girdi = {};
    els('[data-calc]').forEach(function (n) {
      girdi[n.getAttribute('data-calc')] = n.value;
    });
    M.Store.set('moat.hesapGirdi', girdi);
  }

  function bindCalc() {
    var form = el('#calcForm');
    if (!form) return;
    form.addEventListener('input', calcRun);
    var r = el('#calcReset');
    if (r)
      r.addEventListener('click', function () {
        M.Store.set('moat.hesapGirdi', {});
        el('#toolBody').innerHTML = calcHTML();
        bindCalc();
        calcRun();
      });
    calcRun();
  }

  /* ---------------- sayfa ---------------- */
  M.Pages.tool = function () {
    return (
      '<div class="page page-wide">' +
      '<p class="eyebrow">Uygulama</p><h1 style="font-size:var(--text-xl)">Hendek analiz aracı</h1>' +
      '<div class="tabs" role="tablist">' +
      '<button class="tab" role="tab" data-tab="liste" aria-selected="' +
      (state.tab === 'liste') +
      '">Kontrol listesi</button>' +
      '<button class="tab" role="tab" data-tab="hesap" aria-selected="' +
      (state.tab === 'hesap') +
      '">Hesap makinesi</button>' +
      '</div><div id="toolBody"></div></div>'
    );
  };

  M.Pages.toolAfter = function () {
    function render() {
      el('#toolBody').innerHTML = state.tab === 'liste' ? checklistHTML() : calcHTML();
      if (state.tab === 'liste') {
        bindChecklist();
        refreshCounts();
      } else {
        bindCalc();
      }
      els('.tab').forEach(function (t) {
        t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === state.tab));
      });
    }
    els('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        state.tab = t.getAttribute('data-tab');
        render();
      });
    });
    render();
  };
})();
