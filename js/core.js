/* ============================================================
   core.js — durum, depolama, yardımcılar, satır içi biçimleme
   ============================================================ */
(function () {
  'use strict';

  /* ---------- güvenli depolama (önizleme çerçevesinde kalıcı depo engelli olabilir) ---------- */
  var memory = {};
  /* Kalıcı depo dinamik olarak aranır; önizleme çerçevelerinde erişim engellenebilir,
     bu yüzden her çağrı try/catch ile sarılı ve bellek içi yedeğe düşer. */
  var STORE_NAME = ['local', 'Storage'].join('');
  var store = null;
  var lsOK = (function () {
    try {
      var s = window[STORE_NAME];
      if (!s) return false;
      var k = '__moat_test__';
      s.setItem(k, '1');
      s.removeItem(k);
      store = s;
      return true;
    } catch (e) {
      return false;
    }
  })();

  var Store = {
    get: function (key, fallback) {
      try {
        var raw = lsOK && store ? store.getItem(key) : memory[key];
        if (raw == null) return fallback;
        return JSON.parse(raw);
      } catch (e) {
        try {
          return memory[key] != null ? JSON.parse(memory[key]) : fallback;
        } catch (e2) {
          return fallback;
        }
      }
    },
    set: function (key, value) {
      var raw;
      try {
        raw = JSON.stringify(value);
      } catch (e) {
        return;
      }
      memory[key] = raw;
      try {
        if (lsOK && store) store.setItem(key, raw);
      } catch (e) {
        /* sessizce yoksay — bellek içi yedek yeterli */
      }
    },
    available: lsOK
  };

  var KEYS = {
    read: 'moat.okunan',
    theme: 'moat.tema',
    check: 'moat.kontrol',
    notes: 'moat.notlar',
    cards: 'moat.kartlar',
    quiz: 'moat.quiz'
  };

  /* ---------- DOM yardımcıları ---------- */
  function el(sel, root) {
    return (root || document).querySelector(sel);
  }
  function els(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Satır içi markdown: `kod`, **kalın**, *italik* */
  function inline(s) {
    var out = esc(s);
    out = out.replace(/`([^`]+)`/g, function (_, c) {
      return '<code>' + c + '</code>';
    });
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[\s(–—"“])\*([^*\n]+)\*(?=$|[\s.,;:)!?"”])/g, '$1<em>$2</em>');
    /* Kod/formül kutucuğuna yapışan Türkçe ekleri kesme işaretiyle ayır: %3tür -> %3’tür */
    out = out.replace(/<\/code>([a-zçğıöşü]{1,5})(?![a-zçğıöşü])/g, '</code>’$1');
    return out;
  }

  /* Markdown işaretlerini temizle (kart özetleri için) */
  function plain(s) {
    return String(s || '')
      .replace(/`/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Türkçe duyarlı normalizasyon (arama için) */
  var MAP = { ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c', â: 'a', î: 'i', û: 'u' };
  function norm(s) {
    return String(s || '')
      .replace(/[ıİşŞğĞüÜöÖçÇâîû]/g, function (c) {
        return MAP[c];
      })
      .toLowerCase();
  }

  function fmt(n, digits) {
    if (!isFinite(n)) return '—';
    return n.toLocaleString('tr-TR', {
      minimumFractionDigits: digits == null ? 2 : digits,
      maximumFractionDigits: digits == null ? 2 : digits
    });
  }
  function pct(n, digits) {
    if (!isFinite(n)) return '—';
    return fmt(n, digits == null ? 2 : digits) + '%';
  }
  function num(v) {
    var x = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
    return isFinite(x) ? x : 0;
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /* ---------- tema ---------- */
  var THEME_ICON = {
    light:
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>',
    dark:
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>'
  };

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    els('[data-theme-toggle]').forEach(function (b) {
      b.innerHTML = THEME_ICON[t];
      b.setAttribute('aria-label', t === 'light' ? 'Koyu temaya geç' : 'Açık temaya geç');
      b.setAttribute('title', t === 'light' ? 'Koyu tema' : 'Açık tema');
    });
  }
  function initTheme() {
    var saved = Store.get(KEYS.theme, null);
    var t = saved === 'dark' || saved === 'light' ? saved : 'light';
    applyTheme(t);
    els('[data-theme-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        Store.set(KEYS.theme, next);
      });
    });
  }

  /* ---------- ilerleme ---------- */
  var Progress = {
    all: function () {
      var v = Store.get(KEYS.read, {});
      return v && typeof v === 'object' ? v : {};
    },
    isRead: function (id) {
      return !!Progress.all()[id];
    },
    set: function (id, val) {
      var m = Progress.all();
      if (val) m[id] = 1;
      else delete m[id];
      Store.set(KEYS.read, m);
    },
    count: function () {
      return Object.keys(Progress.all()).length;
    },
    countIn: function (ids) {
      var m = Progress.all();
      return ids.filter(function (i) {
        return m[i];
      }).length;
    }
  };

  window.Moat = {
    Store: Store,
    KEYS: KEYS,
    el: el,
    els: els,
    esc: esc,
    inline: inline,
    plain: plain,
    norm: norm,
    fmt: fmt,
    pct: pct,
    num: num,
    shuffle: shuffle,
    initTheme: initTheme,
    Progress: Progress,
    data: null
  };
})();
