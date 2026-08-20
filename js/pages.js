/* ============================================================
   pages.js — ana sayfa, modül okuma, kartlar, quiz, sözlük
   ============================================================ */
(function () {
  'use strict';
  var M = window.Moat;
  var esc = M.esc,
    inline = M.inline,
    els = M.els,
    el = M.el;

  var Pages = {};

  function partOf(id) {
    return M.data.parts.filter(function (p) {
      return p.id === id;
    })[0];
  }
  function moduleById(id) {
    return M.data.modules.filter(function (m) {
      return m.id === id;
    })[0];
  }
  function moduleIndex(id) {
    for (var i = 0; i < M.data.modules.length; i++) if (M.data.modules[i].id === id) return i;
    return -1;
  }

  /* Bölüm girişinden temiz bir özet cümlesi çıkar */
  function partExcerpt(p) {
    var lines = String(p.giris)
      .split('\n')
      .map(function (l) {
        return l.trim();
      })
      .filter(Boolean)
      .filter(function (l) {
        return !/^\*\*Ana kaynak/.test(l) && !/^\*\*Ek kaynak/.test(l);
      });
    var t = M.plain(lines[0] || p.giris).replace(/^Öğrenme amacı:\s*/, '');
    var sentences = t.split(/(?<=[.!?])\s+/);
    var out = sentences.slice(0, 2).join(' ');
    if (out.length > 260) out = out.slice(0, 255).replace(/\s\S*$/, '') + '…';
    return out;
  }

  /* =================== ANA SAYFA =================== */
  Pages.home = function () {
    var d = M.data;
    var total = d.modules.length;
    var done = M.Progress.count();
    var yuzde = total ? Math.round((done / total) * 100) : 0;

    var partCards = d.parts
      .map(function (p) {
        var pDone = M.Progress.countIn(p.moduleIds);
        var firstId = p.moduleIds[0];
        return (
          '<a class="part-card" href="#/modul/' +
          esc(firstId) +
          '">' +
          '<div class="part-no">0' +
          p.no +
          '</div>' +
          '<h3>' +
          esc(p.baslik) +
          '</h3>' +
          '<p>' +
          esc(partExcerpt(p)) +
          '</p>' +
          '<footer><span>' +
          p.moduleIds.length +
          ' modül</span><span>' +
          pDone +
          '/' +
          p.moduleIds.length +
          ' okundu</span></footer>' +
          '</a>'
        );
      })
      .join('');

    var plan = [
      {
        tag: 'Hafta 1',
        h: 'Temel: değer yaratma ve ROIC',
        items: [
          'Bölüm 1’in 13 modülünü sırayla oku.',
          'ROIC, WACC ve ekonomik kâr formüllerini kâğıt üstünde tekrar et.',
          'Analiz aracındaki hesap makinesinde bildiğin bir şirketin ROIC’ini hesapla.',
          'Bölüm 1 kartlarını ve quizini çöz.'
        ]
      },
      {
        tag: 'Hafta 2',
        h: 'Yapı: Beş Güç ve giriş engelleri',
        items: [
          'Bölüm 2’nin 19 modülünü oku; her modülün kontrol listesini not al.',
          'Beş Güç analizini seçtiğin bir sektöre uygula.',
          'Giriş engelleri ve yıkıcı inovasyon modüllerini iki kez oku.',
          'Bölüm 2 quizini karışık modda çöz.'
        ]
      },
      {
        tag: 'Hafta 3',
        h: 'Uygulama: gerçek şirket analizi',
        items: [
          'Bölüm 3’ün 12 modülünü oku (firma özgü analiz, kaynaklar, marka).',
          'Tam kontrol listesini gerçek bir şirket için doldur.',
          'Doldurduğun analizi Markdown olarak indir ve tezini yaz.',
          'Tüm kartları karışık modda tekrar edip 26 soruluk quizi bitir.'
        ]
      }
    ]
      .map(function (w) {
        return (
          '<div class="plan-card"><span class="plan-tag">' +
          esc(w.tag) +
          '</span><h3>' +
          esc(w.h) +
          '</h3><ul>' +
          w.items
            .map(function (i) {
              return '<li>' + esc(i) + '</li>';
            })
            .join('') +
          '</ul></div>'
        );
      })
      .join('');

    return (
      '<div class="page">' +
      '<section class="hero">' +
      '<div>' +
      '<p class="eyebrow">Yatırımcı için rekabet avantajı analizi</p>' +
      '<h1>Hendeği Ölçmek<span>Measuring the Moat — 44 modüllük Türkçe kurs</span></h1>' +
      '<p class="lede">Bu kurs, Michael J. Mauboussin ve Dan Callahan’ın <em>Measuring the Moat</em> ' +
      '(Morgan Stanley Counterpoint Global, 15 Ekim 2024) çalışmasını üç bölümlük bir müfredata dönüştürür. ' +
      'Amaç şu soruyu sistemli yanıtlamak: bir şirket sermaye maliyetinin üzerinde getiri üretiyor mu, ' +
      'bunu ne kadar süre koruyabilir ve fiyat bunun ne kadarını zaten içeriyor?</p>' +
      '<div class="hero-actions">' +
      '<a class="btn btn-primary" href="#/modul/' +
      esc(d.modules[0].id) +
      '">Kursa başla</a>' +
      '<a class="btn btn-outline" href="#/arac">Hendek analiz aracı</a>' +
      '<a class="btn btn-outline" href="#/grafikler">47 grafik</a>' +
      '<a class="btn btn-outline" href="#/kartlar">Kartlarla tekrar</a>' +
      '</div>' +
      '</div>' +
      '<aside class="progress-card">' +
      '<h2>İlerlemen</h2>' +
      '<div class="pbar"><span style="width:' +
      yuzde +
      '%"></span></div>' +
      '<div class="pmeta"><span class="pnum">' +
      yuzde +
      '%</span><span>' +
      done +
      ' / ' +
      total +
      ' modül okundu</span></div>' +
      '<div class="stat-row">' +
      '<div><b>' +
      (M.Exhibits ? M.Exhibits.list.length : 47) +
      '</b>grafik</div>' +
      '<div><b>' +
      d.quiz.length +
      '</b>quiz sorusu</div>' +
      '<div><b>' +
      d.flashcards.length +
      '</b>tekrar kartı</div>' +
      '<div><b>' +
      d.sozluk.length +
      '</b>sözlük terimi</div>' +
      '</div>' +
      (M.Store.available
        ? ''
        : '<p style="margin-top:var(--space-4);font-size:var(--text-xs);color:var(--color-text-faint)">Not: bu ortamda tarayıcı deposu kapalı; ilerleme yalnızca bu oturumda saklanır.</p>') +
      '</aside>' +
      '</section>' +

      '<section class="section"><h2>Üç bölüm</h2><p class="lede">Her bölüm, kaynaktaki bir düşünce katmanını izler: değer yaratmanın ölçülmesi, sektör yapısının haritalanması, firmaya özgü avantajın kanıtlanması.</p>' +
      '<div class="card-grid">' +
      partCards +
      '</div></section>' +

      '<section class="section"><h2>Nereden başlamalı</h2>' +
      '<ol class="start-list">' +
      '<li><strong>Bölüm 1, Modül 1’den başla.</strong> Sürdürülebilir değer yaratmanın tanımı, sonraki 43 modülün ortak dilidir.</li>' +
      '<li><strong>Formülleri atlamadan çalış.</strong> ROIC, ekonomik kâr ve nakit dönüşüm döngüsünü hesap makinesinde bir kez elle hesapla.</li>' +
      '<li><strong>Her modülü “Okudum” olarak işaretle.</strong> İlerleme çubuğu, tekrar edilecek yerleri görmenin en hızlı yolu.</li>' +
      '<li><strong>Bölüm sonunda quiz ve kartlar.</strong> Yanlış yaptığın soruları hemen tekrar et; kartlarda “tekrar et” dediklerin kuyruğa döner.</li>' +
      '<li><strong>Kontrol listesiyle bitir.</strong> Gerçek bir şirketi 75 maddelik listeyle tarayıp notlarını Markdown olarak indir.</li>' +
      '</ol></section>' +

      '<section class="section"><h2>Üç haftalık plan</h2><p class="lede">Günde 45–60 dakika ayırarak kursu üç haftada tamamlayabilirsin.</p>' +
      '<div class="plan-grid">' +
      plan +
      '</div></section>' +
      '</div>'
    );
  };

  /* =================== MODÜL AĞACI =================== */
  function treeHTML(activeId) {
    var read = M.Progress.all();
    var body = M.data.parts
      .map(function (p) {
        var items = p.moduleIds
          .map(function (id) {
            var m = moduleById(id);
            var cls = (read[id] ? 'done' : '') + '';
            return (
              '<li><a class="' +
              cls +
              '" href="#/modul/' +
              esc(id) +
              '"' +
              (id === activeId ? ' aria-current="true"' : '') +
              '><span class="num">' +
              m.no +
              '.</span><span>' +
              esc(m.title) +
              '</span></a></li>'
            );
          })
          .join('');
        return (
          '<div class="tree-part"><h3>' +
          esc(p.kisa) +
          ' <span>' +
          esc(p.baslik) +
          '</span></h3><ol>' +
          items +
          '</ol></div>'
        );
      })
      .join('');

    return (
      '<nav class="tree tree-collapsible" data-open="false" aria-label="Modül ağacı">' +
      '<button class="tree-summary btn-ghost" type="button" id="treeToggle" aria-expanded="false">' +
      '<span>Modül listesi (44)</span><span aria-hidden="true">▾</span></button>' +
      '<div class="tree-body"><h2>Kurs içeriği</h2>' +
      body +
      '</div></nav>'
    );
  }

  /* =================== MODÜL OKUMA =================== */
  function mixedHTML(blocks) {
    var out = '';
    var openList = false;
    blocks.forEach(function (b) {
      if (b.tip === 'li') {
        if (!openList) {
          out += '<ul class="plain-list">';
          openList = true;
        }
        out += '<li>' + inline(b.metin) + '</li>';
      } else {
        if (openList) {
          out += '</ul>';
          openList = false;
        }
        out += '<p>' + inline(b.metin) + '</p>';
      }
    });
    if (openList) out += '</ul>';
    return out;
  }

  function formulaHTML(blocks) {
    var out = '';
    blocks.forEach(function (b) {
      var t = b.metin.trim();
      var only = /^`[^`]+`$/.test(t);
      if (only) {
        out += '<div class="formula-box">' + esc(t.replace(/^`|`$/g, '')) + '</div>';
      } else if (b.tip === 'li') {
        out += '<div class="formula-note">• ' + inline(t) + '</div>';
      } else {
        out += '<p class="formula-note">' + inline(t) + '</p>';
      }
    });
    return out;
  }

  function exampleHTML(text) {
    var parts = String(text)
      .split(/(?<=\.)\s+(?=[A-ZÇĞİÖŞÜ`])/)
      .filter(function (s) {
        return s.trim();
      });
    if (parts.length < 2) return '<p>' + inline(text) + '</p>';
    return (
      '<ol class="plain-list">' +
      parts
        .map(function (s) {
          return '<li>' + inline(s) + '</li>';
        })
        .join('') +
      '</ol>'
    );
  }

  Pages.module = function (id) {
    var m = moduleById(id);
    if (!m) return '<div class="page"><h1>Modül bulunamadı</h1><p class="lede">Bu adreste bir modül yok. <a href="#/modul">Modül listesine dön</a>.</p></div>';
    var p = partOf(m.part);
    var idx = moduleIndex(id);
    var prev = M.data.modules[idx - 1];
    var next = M.data.modules[idx + 1];
    var isRead = M.Progress.isRead(id);

    var body = '';
    var exHTML = M.Exhibits ? M.Exhibits.forModule(id) : '';
    var exPlaced = false;

    if (m.ozet) {
      body +=
        '<section class="block"><h2 class="block-title">Tek cümlede özü</h2><blockquote class="pull">' +
        inline(m.ozet) +
        '</blockquote></section>';
    }
    if (m.neden) {
      body +=
        '<section class="block"><h2 class="block-title">Neden önemli (yatırımcı için)</h2><div class="why">' +
        inline(m.neden) +
        '</div></section>';
    }
    if (m.aciklama && m.aciklama.length) {
      body +=
        '<section class="block"><h2 class="block-title">Kavramın açılımı</h2>' +
        m.aciklama
          .map(function (t) {
            return '<p>' + inline(t) + '</p>';
          })
          .join('') +
        '</section>';
    }
    if (m.formuller && m.formuller.length) {
      body += '<section class="block"><h2 class="block-title">Formüller</h2>' + formulaHTML(m.formuller) + '</section>';
    }
    if (m.ornek) {
      body +=
        '<section class="block"><h2 class="block-title">Sayısal örnek</h2><div class="example">' +
        exampleHTML(m.ornek) +
        '</div></section>';
    }
    if (m.kanit && m.kanit.length) {
      body +=
        '<section class="block evidence"><h2 class="block-title">Dokümandaki kanıt ve örnekler</h2>' +
        mixedHTML(m.kanit) +
        '</section>';
      body += exHTML;
      exPlaced = true;
    }
    if (exHTML && !exPlaced) {
      body += exHTML;
      exPlaced = true;
    }
    if (m.hatalar && m.hatalar.length) {
      body +=
        '<section class="block callout callout-warn"><h2 class="block-title">Sık yapılan hatalar</h2><ol>' +
        m.hatalar
          .map(function (h) {
            return '<li>' + inline(h) + '</li>';
          })
          .join('') +
        '</ol></section>';
    }
    if (m.sorular && m.sorular.length) {
      body +=
        '<section class="block callout callout-ask"><h2 class="block-title">Kendine sor</h2><ul>' +
        m.sorular
          .map(function (h) {
            return '<li>' + inline(h) + '</li>';
          })
          .join('') +
        '</ul></section>';
    }
    if (m.kontrolListesi && m.kontrolListesi.length) {
      body +=
        '<section class="block callout callout-check"><h2 class="block-title">Kontrol listesi</h2><ul>' +
        m.kontrolListesi
          .map(function (h) {
            return '<li>' + inline(h) + '</li>';
          })
          .join('') +
        '</ul></section>';
    }

    var pager =
      '<nav class="pager" aria-label="Modül gezinme">' +
      (prev
        ? '<a class="prev" href="#/modul/' + esc(prev.id) + '"><span>← Önceki</span>' + esc(prev.title) + '</a>'
        : '<a class="prev" href="#/"><span>← Başlangıç</span>Ana sayfa</a>') +
      (next
        ? '<a class="next" href="#/modul/' + esc(next.id) + '"><span>Sonraki →</span>' + esc(next.title) + '</a>'
        : '<a class="next" href="#/quiz"><span>Sonraki →</span>Quiz ile kendini sına</a>') +
      '</nav>';

    return (
      '<div class="reader">' +
      treeHTML(id) +
      '<article class="article" data-module="' +
      esc(id) +
      '">' +
      '<header>' +
      '<p class="eyebrow">' +
      esc(p.kisa) +
      ' · Modül ' +
      m.no +
      ' / ' +
      p.moduleIds.length +
      '</p>' +
      '<h1>' +
      esc(m.title) +
      '</h1>' +
      '<p class="lede" style="font-size:var(--text-sm)">' +
      esc(p.baslik) +
      '</p>' +
      '</header>' +
      body +
      '<label class="read-toggle' +
      (isRead ? ' on' : '') +
      '" id="readToggle"><input type="checkbox" id="readCheck"' +
      (isRead ? ' checked' : '') +
      '><span>Bu modülü okudum</span></label>' +
      pager +
      '<p class="kbd-hint">İpucu: <code>←</code> ve <code>→</code> ok tuşlarıyla modüller arasında geçebilir, <code>/</code> ile arama yapabilirsin.</p>' +
      '</article></div>'
    );
  };

  Pages.moduleAfter = function (id) {
    var cb = el('#readCheck');
    var wrap = el('#readToggle');
    if (cb) {
      cb.addEventListener('change', function () {
        M.Progress.set(id, cb.checked);
        wrap.classList.toggle('on', cb.checked);
        var link = el('.tree a[href="#/modul/' + id + '"]');
        if (link) link.classList.toggle('done', cb.checked);
      });
    }
    var tt = el('#treeToggle');
    if (tt) {
      tt.addEventListener('click', function () {
        var tree = el('.tree-collapsible');
        var open = tree.getAttribute('data-open') === 'true';
        tree.setAttribute('data-open', open ? 'false' : 'true');
        tt.setAttribute('aria-expanded', open ? 'false' : 'true');
      });
    }
    var act = el('.tree a[aria-current="true"]');
    if (act && window.innerWidth > 900) {
      var tree = el('.tree');
      if (tree && act.offsetTop > tree.clientHeight - 80) tree.scrollTop = act.offsetTop - tree.clientHeight / 2;
    }
    // ok tuşları
    var idx = moduleIndex(id);
    window.Moat._moduleKeys = function (e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === 'ArrowLeft' && M.data.modules[idx - 1]) location.hash = '#/modul/' + M.data.modules[idx - 1].id;
      if (e.key === 'ArrowRight' && M.data.modules[idx + 1]) location.hash = '#/modul/' + M.data.modules[idx + 1].id;
    };
  };

  /* =================== FLASHCARD =================== */
  var fc = { queue: [], i: 0, filter: 'all', flipped: false, bilinen: 0, tekrar: 0 };

  function fcPool() {
    return M.data.flashcards.filter(function (c) {
      return fc.filter === 'all' || c.part === fc.filter;
    });
  }

  Pages.cards = function () {
    var chips =
      '<div class="chip-row">' +
      '<button class="chip" data-fcpart="all" aria-pressed="' +
      (fc.filter === 'all') +
      '">Tümü (' +
      M.data.flashcards.length +
      ')</button>' +
      M.data.parts
        .map(function (p) {
          var n = M.data.flashcards.filter(function (c) {
            return c.part === p.id;
          }).length;
          return (
            '<button class="chip" data-fcpart="' +
            p.id +
            '" aria-pressed="' +
            (fc.filter === p.id) +
            '">' +
            esc(p.kisa) +
            ' (' +
            n +
            ')</button>'
          );
        })
        .join('') +
      '</div>';

    return (
      '<div class="page">' +
      '<p class="eyebrow">Aralıklı tekrar</p><h1 style="font-size:var(--text-xl)">Tekrar kartları</h1>' +
      '<p class="lede">Karta tıkla ya da <code>boşluk</code> tuşuna bas: arka yüzü görürsün. “Tekrar et” dediğin kart kuyruğun sonuna eklenir, “biliyorum” dediğin çıkar.</p>' +
      '<div class="toolbar"><label>Bölüm</label>' +
      chips +
      '<button class="btn btn-outline btn-sm" id="fcShuffle" style="margin-left:auto">Karıştır</button>' +
      '<button class="btn btn-outline btn-sm" id="fcReset">Baştan</button></div>' +
      '<div class="flash-wrap" id="flashWrap"></div>' +
      '</div>'
    );
  };

  function renderFlash() {
    var wrap = el('#flashWrap');
    if (!wrap) return;
    if (!fc.queue.length) {
      wrap.innerHTML =
        '<div class="flash-face" style="position:static;height:auto"><span class="face-label">Kuyruk tamam</span>' +
        '<p class="face-text">Bu bölümdeki tüm kartları bitirdin.</p>' +
        '<p style="font-size:var(--text-sm);color:var(--color-text-muted)">Biliyorum: ' +
        fc.bilinen +
        ' · Tekrar edilen: ' +
        fc.tekrar +
        '</p>' +
        '<div class="flash-actions"><button class="btn btn-primary btn-sm" id="fcAgain">Yeniden başla</button></div></div>';
      var again = el('#fcAgain');
      if (again)
        again.addEventListener('click', function () {
          resetFlash();
        });
      return;
    }
    var c = fc.queue[0];
    var p = partOf(c.part);
    wrap.innerHTML =
      '<div class="flashcard' +
      (fc.flipped ? ' flipped' : '') +
      '" id="flashCard" role="button" tabindex="0" aria-label="Kartı çevir">' +
      '<div class="flash-inner">' +
      '<div class="flash-face flash-front"><span class="face-label">Soru</span><p class="face-text">' +
      inline(c.on) +
      '</p><span class="face-part">' +
      esc(p ? p.kisa : '') +
      '</span></div>' +
      '<div class="flash-face flash-back"><span class="face-label">Cevap</span><p class="face-text">' +
      inline(c.arka) +
      '</p><span class="face-part">' +
      esc(p ? p.kisa : '') +
      '</span></div>' +
      '</div></div>' +
      '<div class="flash-actions">' +
      '<button class="btn btn-outline btn-sm" id="fcFlip">Çevir (boşluk)</button>' +
      '<button class="btn btn-outline btn-sm" id="fcRepeat">↺ Tekrar et</button>' +
      '<button class="btn btn-primary btn-sm" id="fcKnow">✓ Biliyorum</button>' +
      '</div>' +
      '<p class="flash-meta">Kuyrukta ' +
      fc.queue.length +
      ' kart · biliyorum ' +
      fc.bilinen +
      ' · tekrar ' +
      fc.tekrar +
      '</p>';

    function flip() {
      fc.flipped = !fc.flipped;
      el('#flashCard').classList.toggle('flipped', fc.flipped);
    }
    el('#flashCard').addEventListener('click', flip);
    el('#flashCard').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip();
      }
    });
    el('#fcFlip').addEventListener('click', function (e) {
      e.stopPropagation();
      flip();
    });
    el('#fcKnow').addEventListener('click', function () {
      fc.queue.shift();
      fc.bilinen++;
      fc.flipped = false;
      renderFlash();
    });
    el('#fcRepeat').addEventListener('click', function () {
      var card = fc.queue.shift();
      fc.queue.push(card);
      fc.tekrar++;
      fc.flipped = false;
      renderFlash();
    });
  }

  function resetFlash(sh) {
    var pool = fcPool();
    fc.queue = sh ? M.shuffle(pool) : pool.slice();
    fc.flipped = false;
    fc.bilinen = 0;
    fc.tekrar = 0;
    renderFlash();
  }

  Pages.cardsAfter = function () {
    els('[data-fcpart]').forEach(function (b) {
      b.addEventListener('click', function () {
        fc.filter = b.getAttribute('data-fcpart');
        els('[data-fcpart]').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        resetFlash(false);
      });
    });
    el('#fcShuffle').addEventListener('click', function () {
      resetFlash(true);
    });
    el('#fcReset').addEventListener('click', function () {
      resetFlash(false);
    });
    resetFlash(false);
    window.Moat._cardKeys = function (e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === ' ') {
        var card = el('#flashCard');
        if (card) {
          e.preventDefault();
          fc.flipped = !fc.flipped;
          card.classList.toggle('flipped', fc.flipped);
        }
      }
    };
  };

  /* =================== QUIZ =================== */
  var qz = { list: [], i: 0, correct: 0, answered: false, wrong: [], filter: 'all', started: false };

  Pages.quiz = function () {
    var chips =
      '<div class="chip-row">' +
      '<button class="chip" data-qzpart="all" aria-pressed="' +
      (qz.filter === 'all') +
      '">Karışık (' +
      M.data.quiz.length +
      ')</button>' +
      M.data.parts
        .map(function (p) {
          var n = M.data.quiz.filter(function (q) {
            return q.part === p.id;
          }).length;
          return (
            '<button class="chip" data-qzpart="' +
            p.id +
            '" aria-pressed="' +
            (qz.filter === p.id) +
            '">' +
            esc(p.kisa) +
            ' (' +
            n +
            ')</button>'
          );
        })
        .join('') +
      '</div>';
    return (
      '<div class="page">' +
      '<p class="eyebrow">Kendini sına</p><h1 style="font-size:var(--text-xl)">Quiz</h1>' +
      '<p class="lede">Bölüm seç veya karışık başla. Her cevaptan sonra doğru şık ve açıklaması gösterilir; sonunda yanlışlarını tekrar edebilirsin.</p>' +
      '<div class="toolbar"><label>Kapsam</label>' +
      chips +
      '<button class="btn btn-primary btn-sm" id="qzStart" style="margin-left:auto">Yeni tur başlat</button></div>' +
      '<div class="quiz-wrap" id="quizWrap"></div>' +
      '</div>'
    );
  };

  function startQuiz(list) {
    qz.list = list;
    qz.i = 0;
    qz.correct = 0;
    qz.wrong = [];
    qz.answered = false;
    qz.started = true;
    renderQuiz();
  }

  function renderQuiz() {
    var wrap = el('#quizWrap');
    if (!wrap) return;
    if (!qz.started) {
      wrap.innerHTML =
        '<div class="feedback"><b>Hazır olduğunda başla</b>Yukarıdan bir kapsam seç ve “Yeni tur başlat”a bas.</div>';
      return;
    }
    if (qz.i >= qz.list.length) {
      var yuzde = qz.list.length ? Math.round((qz.correct / qz.list.length) * 100) : 0;
      wrap.innerHTML =
        '<div class="feedback"><b>Tur bitti</b>' +
        '<p class="score-big">' +
        qz.correct +
        ' / ' +
        qz.list.length +
        ' <span style="font-size:var(--text-base);color:var(--color-text-muted)">(%' +
        yuzde +
        ')</span></p>' +
        '<p style="margin-top:var(--space-3)">' +
        (qz.wrong.length
          ? 'Yanlış yaptığın ' + qz.wrong.length + ' soru var. Sadece onları tekrar edebilirsin.'
          : 'Tüm soruları doğru yanıtladın.') +
        '</p>' +
        '<div class="flash-actions" style="justify-content:flex-start;margin-top:var(--space-4)">' +
        (qz.wrong.length ? '<button class="btn btn-primary btn-sm" id="qzRetryWrong">Yanlışları tekrar et</button>' : '') +
        '<button class="btn btn-outline btn-sm" id="qzRestart">Turu baştan çöz</button>' +
        '</div></div>';
      var rw = el('#qzRetryWrong');
      if (rw)
        rw.addEventListener('click', function () {
          startQuiz(qz.wrong.slice());
        });
      el('#qzRestart').addEventListener('click', function () {
        startQuiz(qz.list.slice());
      });
      return;
    }

    var q = qz.list[qz.i];
    var p = partOf(q.part);
    var letters = ['A', 'B', 'C', 'D'];
    wrap.innerHTML =
      '<div class="quiz-head"><span>Soru ' +
      (qz.i + 1) +
      ' / ' +
      qz.list.length +
      '</span><span>' +
      esc(p ? p.kisa : '') +
      ' · doğru: ' +
      qz.correct +
      '</span></div>' +
      '<div class="pbar" style="margin-top:var(--space-3)"><span style="width:' +
      Math.round((qz.i / qz.list.length) * 100) +
      '%"></span></div>' +
      '<h2 class="quiz-q">' +
      inline(q.soru) +
      '</h2>' +
      '<div class="answers" id="answers">' +
      q.secenekler
        .map(function (s, i) {
          return (
            '<button class="answer" data-ans="' +
            i +
            '"><span class="letter">' +
            letters[i] +
            '</span><span>' +
            inline(s) +
            '</span></button>'
          );
        })
        .join('') +
      '</div>' +
      '<div id="qzFeedback"></div>';

    els('#answers .answer').forEach(function (b) {
      b.addEventListener('click', function () {
        if (qz.answered) return;
        qz.answered = true;
        var pick = parseInt(b.getAttribute('data-ans'), 10);
        var ok = pick === q.dogru;
        if (ok) qz.correct++;
        else qz.wrong.push(q);
        els('#answers .answer').forEach(function (x) {
          var xi = parseInt(x.getAttribute('data-ans'), 10);
          x.disabled = true;
          if (xi === q.dogru) x.classList.add('correct');
          else if (xi === pick) x.classList.add('wrong');
        });
        el('#qzFeedback').innerHTML =
          '<div class="feedback ' +
          (ok ? 'ok' : 'no') +
          '"><b>' +
          (ok ? '✓ Doğru' : '✗ Yanlış — doğrusu ' + letters[q.dogru] + ' şıkkı') +
          '</b>' +
          inline(q.aciklama) +
          '<div class="flash-actions" style="justify-content:flex-start;margin-top:var(--space-4)">' +
          '<button class="btn btn-primary btn-sm" id="qzNext">' +
          (qz.i + 1 >= qz.list.length ? 'Sonucu gör' : 'Sonraki soru →') +
          '</button></div></div>';
        el('#qzNext').addEventListener('click', function () {
          qz.i++;
          qz.answered = false;
          renderQuiz();
        });
        el('#qzNext').focus();
      });
    });
  }

  Pages.quizAfter = function () {
    els('[data-qzpart]').forEach(function (b) {
      b.addEventListener('click', function () {
        qz.filter = b.getAttribute('data-qzpart');
        els('[data-qzpart]').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
      });
    });
    el('#qzStart').addEventListener('click', function () {
      var list = M.data.quiz.filter(function (q) {
        return qz.filter === 'all' || q.part === qz.filter;
      });
      startQuiz(qz.filter === 'all' ? M.shuffle(list) : list.slice());
    });
    renderQuiz();
  };

  /* =================== SÖZLÜK =================== */
  var gl = { q: '', letter: 'all' };

  Pages.glossary = function () {
    var letters = {};
    M.data.sozluk.forEach(function (t) {
      letters[t.en.charAt(0).toUpperCase()] = 1;
    });
    var alpha =
      '<div class="alpha-index" id="alphaIndex">' +
      '<button data-letter="all" aria-pressed="' +
      (gl.letter === 'all') +
      '">Tümü</button>' +
      Object.keys(letters)
        .sort()
        .map(function (L) {
          return '<button data-letter="' + L + '" aria-pressed="' + (gl.letter === L) + '">' + L + '</button>';
        })
        .join('') +
      '</div>';
    return (
      '<div class="page">' +
      '<p class="eyebrow">İngilizce–Türkçe</p><h1 style="font-size:var(--text-xl)">Sözlük</h1>' +
      '<p class="lede">Modüllerden otomatik derlenen ' +
      M.data.sozluk.length +
      ' terim. Her terimin geçtiği modüllere doğrudan gidebilirsin.</p>' +
      '<div class="toolbar"><label for="glossSearch">Ara</label>' +
      '<input type="text" id="glossSearch" placeholder="ör. moat, ROIC, ölçek" style="min-width:220px" value="' +
      esc(gl.q) +
      '">' +
      '<span id="glossCount" style="font-size:var(--text-sm);color:var(--color-text-muted);margin-left:auto"></span></div>' +
      alpha +
      '<div id="glossBody"></div>' +
      '</div>'
    );
  };

  function renderGloss() {
    var body = el('#glossBody');
    if (!body) return;
    var q = M.norm(gl.q.trim());
    var list = M.data.sozluk.filter(function (t) {
      var okL = gl.letter === 'all' || t.en.charAt(0).toUpperCase() === gl.letter;
      if (!okL) return false;
      if (!q) return true;
      return M.norm(t.en).indexOf(q) >= 0 || M.norm(t.tr).indexOf(q) >= 0 || M.norm((t.digerKarsiliklar || []).join(' ')).indexOf(q) >= 0;
    });
    el('#glossCount').textContent = list.length + ' terim';
    if (!list.length) {
      body.innerHTML = '<p class="empty-note">Bu aramaya uyan terim yok. Farklı bir yazım dene.</p>';
      return;
    }
    var groups = {};
    list.forEach(function (t) {
      var L = t.en.charAt(0).toUpperCase();
      (groups[L] = groups[L] || []).push(t);
    });
    body.innerHTML = Object.keys(groups)
      .sort()
      .map(function (L) {
        return (
          '<h2 class="gloss-letter">' +
          L +
          '</h2><dl class="gloss-list">' +
          groups[L]
            .map(function (t) {
              var refs = (t.modules || [])
                .map(function (id) {
                  var m = moduleById(id);
                  if (!m) return '';
                  return '<a href="#/modul/' + esc(id) + '" title="' + esc(m.title) + '">B' + m.partNo + '·M' + m.no + '</a>';
                })
                .join('');
              var alt = (t.digerKarsiliklar || []).length
                ? '<dd style="color:var(--color-text-faint)">Diğer karşılıklar: ' + esc(t.digerKarsiliklar.join(', ')) + '</dd>'
                : '';
              return (
                '<div class="gloss-item"><dt>' +
                esc(t.tr) +
                '</dt><dd class="en">' +
                esc(t.en) +
                '</dd>' +
                alt +
                (refs ? '<div class="refs">' + refs + '</div>' : '') +
                '</div>'
              );
            })
            .join('') +
          '</dl>'
        );
      })
      .join('');
  }

  Pages.glossaryAfter = function () {
    var input = el('#glossSearch');
    input.addEventListener('input', function () {
      gl.q = input.value;
      renderGloss();
    });
    els('#alphaIndex button').forEach(function (b) {
      b.addEventListener('click', function () {
        gl.letter = b.getAttribute('data-letter');
        els('#alphaIndex button').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        renderGloss();
      });
    });
    renderGloss();
  };

  /* =================== MODÜL LİSTESİ (indeks) =================== */
  Pages.exhibits = function () {
    return M.Exhibits.page();
  };
  Pages.exhibitsAfter = function () {
    M.Exhibits.pageAfter();
  };

  Pages.moduleIndexPage = function () {
    return Pages.module(M.data.modules[0].id);
  };

  M.Pages = Pages;
  M.helpers = { moduleById: moduleById, partOf: partOf, moduleIndex: moduleIndex };
})();
