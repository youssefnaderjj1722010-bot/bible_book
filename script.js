/* Arabic Bible — offline reader */
(function () {
  'use strict';

  const META = window.__BB_META;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const fmt = (n) => String(n).replace(/[0-9]/g, (d) => AR_DIGITS[+d]);
  const numFmt = new Intl.NumberFormat('ar-EG');
  const dateFmt = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

  const DIAC = '[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]*';
  const CHAR_ALTS = { 'ا': '[اأإآٱ]', 'ي': '[يى]', 'ه': '[هة]', 'و': '[وؤ]' };

  function toLatinDigits(s) {
    return String(s).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  }

  function norm(s) {
    return toLatinDigits(String(s))
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .toLowerCase();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ---------------- Icons ---------------- */
  const ICON = {
    copy: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="11" height="12" rx="2.2"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4H6.5A2.5 2.5 0 0 0 4 6.5v8A2.5 2.5 0 0 0 6.5 17H8"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="m12 4 2.35 4.76 5.25.77-3.8 3.7.9 5.23L12 15.98 7.3 18.46l.9-5.23-3.8-3.7 5.25-.77L12 4Z"/></svg>',
    starSmall: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="m12 4 2.35 4.76 5.25.77-3.8 3.7.9 5.23L12 15.98 7.3 18.46l.9-5.23-3.8-3.7 5.25-.77L12 4Z"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10 5 7.6 5 6 6v13c1.6-1 4-1 6 .5 2-1.5 4.4-1.5 6-.5V6c-1.6-1-4-1-6 .5Z"/><path d="M12 6.5V19"/></svg>',
    bookBig: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10 5 7.6 5 6 6v13c1.6-1 4-1 6 .5 2-1.5 4.4-1.5 6-.5V6c-1.6-1-4-1-6 .5Z"/><path d="M12 6.5V19"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    searchBig: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    prev: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    grid: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    sun: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.4 8.4 0 1 0 20 14.5Z"/></svg>',
    bookTheme: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10 5 7.6 5 6 6v13c1.6-1 4-1 6 .5 2-1.5 4.4-1.5 6-.5V6c-1.6-1-4-1-6 .5Z"/><path d="M12 6.5V19"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3.5l2.1 6.4 6.4 2.1-6.4 2.1L12 20.5l-2.1-6.4L3.5 12l6.4-2.1z"/></svg>',
  };

  const ORN_BOOK = `<svg class="hero-ornament" viewBox="0 0 120 64" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M60 19c-9-5.5-19-5.5-27-1.5v33c8-4 18-4 27 1.5 9-5.5 19-5.5 27-1.5v-33c-8-4-18-4-27 1.5Z"/>
      <path d="M60 19v33"/>
      <path d="M14 36h16M90 36h16" opacity="0.55"/>
      <circle cx="104" cy="20" r="1.7" fill="currentColor" stroke="none" opacity="0.65"/>
      <circle cx="16" cy="20" r="1.7" fill="currentColor" stroke="none" opacity="0.65"/>
    </svg>`;

  const ORN_DIVIDER = `<svg viewBox="0 0 34 14" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true">
      <path d="M17 1.5l4 5.5-4 5.5-4-5.5z"/>
      <path d="M1 7h8M25 7h8"/>
    </svg>`;

  const THEMES = ['light', 'sepia', 'dark'];
  const THEME_LABEL = { light: 'فاتح', sepia: 'ورقي', dark: 'داكن' };
  const THEME_ICON = { light: ICON.sun, sepia: ICON.bookTheme, dark: ICON.moon };

  const DAILY_REFS = [
    [43, 3, 16], [19, 23, 1], [23, 41, 10], [45, 8, 28], [50, 4, 13],
    [19, 46, 1], [20, 3, 5], [24, 29, 11], [58, 11, 1], [19, 119, 105],
    [60, 5, 7], [6, 1, 9], [52, 5, 16], [19, 27, 1], [45, 12, 2],
    [48, 5, 22], [40, 6, 33], [19, 34, 8], [43, 14, 27], [23, 40, 31],
  ];

  const ALIASES = {
    'مزمور': 19, 'مزامير': 19, 'مزمور داود': 19,
    'امثال': 20, 'حكمه': 20,
    'نشيد': 22, 'نشيد الانشاد': 22,
    'رويا': 66, 'رويا يوحنا': 66, 'سفر الرويا': 66,
    'اعمال': 44,
    'فيلبي': 50, 'فيلبيات': 50,
    'عبرانيين': 58,
    'صموئيل الاول': 9, 'صموئيل الثاني': 10,
    'الملوك الاول': 11, 'الملوك الثاني': 12,
    'اخبار الايام الاول': 13, 'اخبار الايام الثاني': 14,
    'كورنثوس الاولي': 46, 'كورنثوس الثانيه': 47,
    'تسالونيكي الاولي': 52, 'تسالونيكي الثانيه': 53,
    'تيموثاوس الاولي': 54, 'تيموثاوس الثانيه': 55,
    'بطرس الاولي': 60, 'بطرس الثانيه': 61,
    'يوحنا الاولي': 62, 'يوحنا الثانيه': 63, 'يوحنا الثالثه': 64,
    'genesis': 1, 'exodus': 2, 'psalms': 19, 'psalm': 19, 'proverbs': 20,
    'isaiah': 23, 'matthew': 40, 'mark': 41, 'luke': 42, 'john': 43,
    'acts': 44, 'romans': 45, 'revelation': 66,
  };

  const sideBooks = $('#side-books');
  const view = $('#view');
  const searchInput = $('#search-input');
  const searchForm = $('#search-form');
  const sidebar = $('#sidebar');
  const scrim = $('#scrim');
  const topbarTitle = $('#topbar-title');
  const themeBtn = $('#theme-btn');
  const savedBtn = $('#saved-btn');
  const modal = $('#modal');
  const modalTitle = $('#modal-title');
  const modalBody = $('#modal-body');
  const toastEl = $('#toast');

  const bookNames = new Map();
  META.books.forEach((b, i) => bookNames.set(norm(b.n), i + 1));
  const aliasMap = new Map();
  Object.keys(ALIASES).forEach((k) => aliasMap.set(norm(k), ALIASES[k]));

  let sidebarTab = 0;
  let renderToken = 0;
  let sidebarSearchValue = '';
  let currentReader = null;
  let searchIndex = null;
  let searchIndexPromise = null;
  let searchState = null;
  let lastFocus = null;
  let toastTimer = 0;

  /* ---------------- Settings & storage ---------------- */
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  const settings = (function () {
    const s = loadJSON('bb.settings', {}) || {};
    return {
      theme: THEMES.indexOf(s.theme) >= 0 ? s.theme : 'light',
      size: Math.min(34, Math.max(15, Number(s.size) || 21)),
    };
  })();

  let lastRead = (function () {
    const x = loadJSON('bb.last', null);
    if (x && x.b >= 1 && x.b <= 66 && x.c >= 1) return { b: x.b, c: x.c };
    return null;
  })();

  let bookmarks = (function () {
    const arr = loadJSON('bb.saved', []);
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    return arr.filter((x) => {
      if (!x || !META.books[x.b - 1] || x.c < 1 || x.c > META.books[x.b - 1].ch) return false;
      const key = x.b + ':' + x.c;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  function applyTheme() {
    document.documentElement.dataset.theme = settings.theme;
    themeBtn.innerHTML = THEME_ICON[settings.theme];
    themeBtn.setAttribute('aria-label', 'المظهر الحالي: ' + THEME_LABEL[settings.theme] + ' — اضغط للتبديل');
    themeBtn.title = 'المظهر: ' + THEME_LABEL[settings.theme];
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', settings.theme === 'dark' ? '#0f1513' : settings.theme === 'sepia' ? '#ece0c7' : '#0e4438');
  }

  function applySize() {
    document.documentElement.style.setProperty('--reader-size', settings.size + 'px');
  }

  /* ---------------- Helpers ---------------- */
  function testamentOf(b) {
    return b <= 39 ? { label: 'العهد القديم', t: 0 } : { label: 'العهد الجديد', t: 1 };
  }

  function chLabel(n) {
    if (n === 1) return 'أصحاح واحد';
    if (n === 2) return 'أصحاحان';
    if (n <= 10) return fmt(n) + ' أصحاحات';
    return fmt(n) + ' أصحاحًا';
  }

  function resultCount(n) {
    if (n === 0) return 'لا نتائج';
    if (n === 1) return 'نتيجة واحدة';
    if (n === 2) return 'نتيجتان';
    if (n <= 10) return fmt(n) + ' نتائج';
    return fmt(n) + ' نتيجة';
  }

  function savedLabel(n) {
    if (n === 1) return 'أصحاح واحد محفوظ';
    if (n === 2) return 'أصحاحان محفوظان';
    if (n <= 10) return fmt(n) + ' أصحاحات محفوظة';
    return fmt(n) + ' أصحاحًا محفوظًا';
  }

  function refLabel(ref) {
    const name = META.books[ref.book - 1].n;
    if (!ref.chapter) return name;
    let s = name + ' ' + fmt(ref.chapter);
    if (ref.verse) s += ':' + fmt(ref.verse);
    return s;
  }

  function isSaved(b, c) {
    return bookmarks.some((x) => x.b === b && x.c === c);
  }

  function neighbor(b, c, dir) {
    const meta = META.books[b - 1];
    if (!meta) return null;
    if (dir > 0) {
      if (c < meta.ch) return { b, c: c + 1 };
      if (b < 66) return { b: b + 1, c: 1 };
    } else {
      if (c > 1) return { b, c: c - 1 };
      if (b > 1) return { b: b - 1, c: META.books[b - 2].ch };
    }
    return null;
  }

  function loadBook(b) {
    if (window.__BB && window.__BB[b]) return Promise.resolve(window.__BB[b]);
    if (!loadBook.cache) loadBook.cache = new Map();
    if (loadBook.cache.has(b)) return loadBook.cache.get(b);
    const p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'data/books/' + String(b).padStart(2, '0') + '.js';
      s.onload = () => {
        loadBook.cache.delete(b);
        if (window.__BB && window.__BB[b]) resolve(window.__BB[b]);
        else reject(new Error('missing book ' + b));
      };
      s.onerror = () => {
        loadBook.cache.delete(b);
        reject(new Error('failed to load book ' + b));
      };
      document.body.appendChild(s);
    });
    loadBook.cache.set(b, p);
    return p;
  }

  function loadAllBooks(onProgress) {
    const total = 66;
    let next = 1;
    let done = 0;
    let active = 0;
    return new Promise((resolve, reject) => {
      let failed = false;
      const launch = () => {
        while (!failed && active < 8 && next <= total) {
          const b = next++;
          active++;
          loadBook(b).then(() => {
            active--; done++;
            if (onProgress) onProgress(done, total);
            if (done === total) resolve();
            else launch();
          }).catch((err) => {
            if (failed) return;
            failed = true;
            reject(err);
          });
        }
      };
      launch();
      if (total === 0) resolve();
    });
  }

  function ensureIndex(onProgress) {
    if (searchIndex) return Promise.resolve(searchIndex);
    if (searchIndexPromise) return searchIndexPromise;
    searchIndexPromise = loadAllBooks(onProgress).then(() => {
      const idx = [];
      for (let b = 1; b <= 66; b++) {
        const book = window.__BB[b];
        for (let ci = 0; ci < book.c.length; ci++) {
          const arr = book.c[ci];
          for (let vi = 0; vi < arr.length; vi++) {
            const text = arr[vi];
            idx.push({ b, c: ci + 1, v: vi + 1, text, n: norm(text) });
          }
        }
      }
      searchIndex = idx;
      return idx;
    }).catch((err) => {
      searchIndexPromise = null;
      throw err;
    });
    return searchIndexPromise;
  }

  function resolveBook(s) {
    const key = norm(s).replace(/^سفر\s+/, '').trim();
    return bookNames.get(key) || aliasMap.get(key) || null;
  }

  function parseRef(raw) {
    const q = norm(raw).replace(/\s+/g, ' ').trim().replace(/[.,،;؛]+$/, '');
    if (!q) return null;
    const m = q.match(/^(.+?)\s+(\d{1,3})(?:\s*[:.]\s*(\d{1,3}))?$/);
    if (!m) {
      const b = resolveBook(q);
      return b ? { book: b } : null;
    }
    const book = resolveBook(m[1]);
    if (!book) return null;
    const chapter = Number(m[2]);
    const verse = m[3] ? Number(m[3]) : null;
    const meta = META.books[book - 1];
    if (!meta || chapter < 1 || chapter > meta.ch) return null;
    return { book, chapter, verse: verse && verse > 0 ? verse : null };
  }

  function queryTerms(q) {
    return norm(q).split(/\s+/).filter(Boolean).slice(0, 12);
  }

  function tolerantPattern(term) {
    let out = '';
    for (const ch of term) {
      if (/\s/.test(ch)) { out += '\\s+'; continue; }
      let base;
      if (CHAR_ALTS[ch]) base = CHAR_ALTS[ch];
      else if (/[0-9]/.test(ch)) base = '[' + ch + AR_DIGITS[Number(ch)] + ']';
      else base = escapeRe(ch);
      out += base + DIAC;
    }
    return out;
  }

  function highlightText(text, terms) {
    if (!terms || !terms.length) return esc(text);
    let re;
    try {
      re = new RegExp('(' + terms.slice().sort((a, b) => b.length - a.length).map(tolerantPattern).join('|') + ')', 'gi');
    } catch (e) {
      return esc(text);
    }
    let out = '';
    let last = 0;
    let m;
    let guard = 0;
    while ((m = re.exec(text)) !== null && guard < 120) {
      guard++;
      out += esc(text.slice(last, m.index)) + '<mark>' + esc(m[0]) + '</mark>';
      last = m.index + m[0].length;
      if (m[0].length === 0) re.lastIndex++;
    }
    out += esc(text.slice(last));
    return out;
  }

  function snippet(text, terms) {
    const MAX = 210;
    if (text.length <= MAX) return text;
    const n = norm(text);
    let pos = -1;
    terms.forEach((t) => {
      const p = n.indexOf(t);
      if (p !== -1 && (pos === -1 || p < pos)) pos = p;
    });
    if (pos === -1) return text.slice(0, MAX) + '…';
    const approx = Math.round(pos * (text.length / Math.max(1, n.length)));
    let start = Math.max(0, approx - 70);
    if (start > 0) {
      const sp = text.indexOf(' ', start);
      if (sp !== -1 && sp - start < 24) start = sp + 1;
    }
    let end = Math.min(text.length, start + MAX);
    if (end < text.length) {
      const sp = text.lastIndexOf(' ', end);
      if (sp > start) end = sp;
    }
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function announce(msg) {
    const live = $('#live');
    if (live) live.textContent = msg;
  }

  function go(path) {
    if (location.hash === '#' + path) render();
    else location.hash = path;
  }

  function parseRoute() {
    const raw = location.hash.replace(/^#/, '');
    if (!raw || raw === '/') return { view: 'welcome' };
    const qIndex = raw.indexOf('?');
    let path;
    try {
      path = decodeURIComponent(qIndex >= 0 ? raw.slice(0, qIndex) : raw);
    } catch (e) {
      path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    }
    const params = new URLSearchParams(qIndex >= 0 ? raw.slice(qIndex + 1) : '');
    if (path === '/saved') return { view: 'saved' };
    if (path === '/search') return { view: 'search', q: (params.get('q') || '').trim() };
    let m = path.match(/^\/t\/([01])$/);
    if (m) return { view: 'testament', t: Number(m[1]) };
    m = path.match(/^\/b\/(\d{1,2})$/);
    if (m) return { view: 'book', b: Number(m[1]) };
    m = path.match(/^\/(\d{1,2})(?:\/(\d{1,3}))?(?:\/(\d{1,3}))?$/);
    if (m) return { view: 'chapter', b: Number(m[1]), c: Number(m[2] || 1), v: m[3] ? Number(m[3]) : null };
    return { view: 'welcome' };
  }

  /* ---------------- Sidebar ---------------- */
  function paintTabs() {
    $$('.tab').forEach((tab) => {
      const active = Number(tab.dataset.t) === sidebarTab;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function paintSideBooks() {
    const start = sidebarTab === 0 ? 1 : 40;
    const end = sidebarTab === 0 ? 39 : 66;
    let html = '';
    for (let b = start; b <= end; b++) {
      const meta = META.books[b - 1];
      html += '<button class="side-book" type="button" data-b="' + b + '" data-go="/b/' + b + '">' +
        '<span class="name">' + esc(meta.n) + '</span>' +
        '<span class="count" aria-label="' + chLabel(meta.ch) + '">' + fmt(meta.ch) + '</span>' +
        '</button>';
    }
    sideBooks.innerHTML = html;
  }

  function syncSidebar(route) {
    let book = null;
    if (route.view === 'book' || route.view === 'chapter') book = route.b;
    if (route.view === 'testament' && sidebarTab !== route.t) {
      sidebarTab = route.t;
      paintTabs();
      paintSideBooks();
    }
    if (book && META.books[book - 1]) {
      const t = testamentOf(book).t;
      if (sidebarTab !== t) {
        sidebarTab = t;
        paintTabs();
        paintSideBooks();
      }
      $$('.side-book', sideBooks).forEach((el) => el.classList.remove('is-active'));
      const btn = sideBooks.querySelector('.side-book[data-b="' + book + '"]');
      if (btn) {
        btn.classList.add('is-active');
        if (window.innerWidth > 900) btn.scrollIntoView({ block: 'nearest' });
      }
    } else {
      $$('.side-book', sideBooks).forEach((el) => el.classList.remove('is-active'));
    }
  }

  function openSidebar() {
    sidebar.classList.add('open');
    scrim.classList.add('show');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    scrim.classList.remove('show');
  }

  /* ---------------- Modal ---------------- */
  function openModal(title, bodyHtml) {
    lastFocus = document.activeElement;
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyHtml;
    modal.hidden = false;
    const close = modal.querySelector('.modal-head .icon-btn');
    if (close) close.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    modalBody.innerHTML = '';
    if (lastFocus && lastFocus.isConnected) lastFocus.focus();
    lastFocus = null;
  }

  /* ---------------- Routing ---------------- */
  function updateTopbar(route) {
    let title = 'الكتاب المقدس';
    let docTitle = 'الكتاب المقدس — العهد القديم والعهد الجديد';
    if (route.view === 'chapter' && META.books[route.b - 1]) {
      title = META.books[route.b - 1].n + ' ' + fmt(route.c);
      docTitle = title + ' — الكتاب المقدس';
    } else if (route.view === 'book' && META.books[route.b - 1]) {
      title = META.books[route.b - 1].n;
      docTitle = title + ' — الكتاب المقدس';
    } else if (route.view === 'testament') {
      title = route.t === 0 ? 'العهد القديم' : 'العهد الجديد';
      docTitle = title + ' — الكتاب المقدس';
    } else if (route.view === 'search') {
      title = 'البحث في الكتاب';
      docTitle = 'البحث — الكتاب المقدس';
    } else if (route.view === 'saved') {
      title = 'المحفوظات';
      docTitle = 'المحفوظات — الكتاب المقدس';
    }
    topbarTitle.textContent = title;
    document.title = docTitle;
    searchInput.value = route.view === 'search' ? route.q : sidebarSearchValue;
  }

  function render() {
    const route = parseRoute();
    const token = ++renderToken;
    closeModal();
    closeSidebar();
    updateTopbar(route);
    syncSidebar(route);
    view.scrollTop = 0;
    if (route.view === 'welcome') renderWelcome(token);
    else if (route.view === 'testament') renderTestament(route, token);
    else if (route.view === 'book') renderBook(route, token);
    else if (route.view === 'chapter') renderChapter(route, token);
    else if (route.view === 'search') renderSearch(route, token);
    else if (route.view === 'saved') renderSaved(token);
    else renderNotFound(token);
  }

  function setView(html) {
    view.innerHTML = '<div class="view-inner">' + html + '</div>';
  }

  /* ---------------- Views ---------------- */
  function renderWelcome(token) {
    currentReader = null;
    const last = lastRead;
    const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1)) / 86400000);
    const dailyRef = DAILY_REFS[day % DAILY_REFS.length];
    const popular = [1, 19, 20, 23, 43, 44, 45];

    const continueHtml = last ? (
      '<section class="welcome-section">' +
        '<div class="section-title">تابع القراءة</div>' +
        '<div class="continue-card">' +
          '<div class="continue-main">' +
            '<span class="continue-icon">' + ICON.bookBig + '</span>' +
            '<div>' +
              '<div class="continue-label">آخر ما قرأت</div>' +
              '<div class="continue-title">' + esc(META.books[last.b - 1].n) + ' ' + fmt(last.c) + '</div>' +
              '<div class="continue-sub">' + testamentOf(last.b).label + '</div>' +
            '</div>' +
          '</div>' +
          '<button class="continue-btn" type="button" data-go="/' + last.b + '/' + last.c + '">متابعة ' + ICON.next + '</button>' +
        '</div>' +
      '</section>'
    ) : '';

    setView(
      '<div class="welcome">' +
        '<section class="hero">' +
          ORN_BOOK +
          '<h1 class="hero-title">الكتاب المقدس</h1>' +
          '<p class="hero-sub">العهد القديم والعهد الجديد · ترجمة سميث وفان دايك</p>' +
          '<div class="hero-actions">' +
            '<button class="btn btn-primary" type="button" data-go="' + (last ? '/' + last.b + '/' + last.c : '/1/1') + '">' +
              ICON.book + (last ? ' متابعة القراءة' : ' ابدأ القراءة') +
            '</button>' +
            '<button class="btn btn-ghost" type="button" data-go="/search">' + ICON.search + ' ابحث في النص</button>' +
          '</div>' +
        '</section>' +
        continueHtml +
        '<section class="welcome-section">' +
          '<div class="section-title">آية اليوم</div>' +
          '<div class="daily-card" id="daily-card">' +
            '<span class="daily-label">' + ICON.spark + ' آية اليوم</span>' +
            '<div class="skeleton w-70"></div><div class="skeleton w-50"></div>' +
          '</div>' +
        '</section>' +
        '<section class="welcome-section">' +
          '<div class="section-title">تصفح الكتاب</div>' +
          '<div class="testament-grid">' +
            '<a class="testament-card" href="#/t/0">' +
              '<span class="tc-main"><span class="testament-icon">' + ICON.bookBig + '</span>' +
                '<span class="tc-text"><span class="tc-name">العهد القديم</span><span class="tc-sub">من التكوين إلى ملاخي</span></span>' +
              '</span>' +
              '<span class="tc-count">٣٩<small>سفرًا</small></span>' +
            '</a>' +
            '<a class="testament-card" href="#/t/1">' +
              '<span class="tc-main"><span class="testament-icon">' + ICON.bookBig + '</span>' +
                '<span class="tc-text"><span class="tc-name">العهد الجديد</span><span class="tc-sub">من متى إلى الرؤيا</span></span>' +
              '</span>' +
              '<span class="tc-count">٢٧<small>سفرًا</small></span>' +
            '</a>' +
          '</div>' +
        '</section>' +
        '<section class="welcome-section">' +
          '<div class="section-title">أسفار شائعة</div>' +
          '<div class="chips">' +
            popular.map((b) => '<a class="chip" href="#/b/' + b + '">' + esc(META.books[b - 1].n) + '</a>').join('') +
          '</div>' +
        '</section>' +
        '<p class="welcome-note">يعمل التطبيق دون اتصال بالإنترنت · النص: ترجمة سميث وفان دايك (١٨٦٥)<br>' +
          '٦٦ سفرًا · ١٬١٨٩ أصحاحًا · ٣١٬١٠٢ آية</p>' +
        '<p class="credit">Made by Youssef Nader</p>' +
      '</div>'
    );

    loadBook(dailyRef[0]).then((book) => {
      if (token !== renderToken) return;
      const card = $('#daily-card');
      if (!card) return;
      const verses = book.c[dailyRef[1] - 1];
      if (!verses || !verses[dailyRef[2] - 1]) return;
      card.innerHTML =
        '<span class="daily-label">' + ICON.spark + ' آية اليوم</span>' +
        '<p class="daily-text">«' + esc(verses[dailyRef[2] - 1]) + '»</p>' +
        '<div class="daily-ref">' + esc(META.books[dailyRef[0] - 1].n) + ' ' + fmt(dailyRef[1]) + ':' + fmt(dailyRef[2]) + '</div>' +
        '<div class="daily-actions"><a class="btn btn-ghost" href="#/' + dailyRef[0] + '/' + dailyRef[1] + '/' + dailyRef[2] + '">اقرأ الأصحاح</a></div>';
    }).catch(() => {
      if (token !== renderToken) return;
      const card = $('#daily-card');
      if (card) card.innerHTML = '<span class="daily-label">' + ICON.spark + ' آية اليوم</span><div class="daily-loading">تعذّر تحميل آية اليوم.</div>';
    });
  }

  function renderTestament(route, token) {
    currentReader = null;
    const t = route.t;
    const start = t === 0 ? 1 : 40;
    const end = t === 0 ? 39 : 66;
    let tiles = '';
    for (let b = start; b <= end; b++) {
      const meta = META.books[b - 1];
      tiles += '<a class="book-tile" href="#/b/' + b + '">' +
        '<span><span class="bt-name">' + esc(meta.n) + '</span><span class="bt-meta">' + chLabel(meta.ch) + '</span></span>' +
        '<span class="bt-count" aria-hidden="true">' + fmt(b) + '</span>' +
        '</a>';
    }
    setView(
      '<div>' +
        '<div class="page-head">' +
          '<span class="eyebrow">' + ICON.book + ' ' + (t === 0 ? 'العهد القديم' : 'العهد الجديد') + '</span>' +
          '<h1 class="page-title">' + (t === 0 ? 'العهد القديم' : 'العهد الجديد') + '</h1>' +
          '<p class="page-sub">' + (t === 0 ? '٣٩ سفرًا · من التكوين إلى ملاخي' : '٢٧ سفرًا · من متى إلى الرؤيا') + '</p>' +
        '</div>' +
        '<div class="book-grid">' + tiles + '</div>' +
      '</div>'
    );
    void token;
  }

  function renderBook(route, token) {
    currentReader = null;
    const meta = META.books[route.b - 1];
    if (!meta) { renderNotFound(token); return; }
    let cells = '';
    for (let c = 1; c <= meta.ch; c++) {
      cells += '<a class="chapter-cell" href="#/' + route.b + '/' + c + '">' + fmt(c) + '</a>';
    }
    setView(
      '<div>' +
        '<div class="page-head">' +
          '<span class="eyebrow">' + testamentOf(route.b).label + '</span>' +
          '<h1 class="page-title">' + esc(meta.n) + '</h1>' +
          '<p class="page-sub">' + chLabel(meta.ch) + ' · اختر الأصحاح للبدء</p>' +
        '</div>' +
        '<div class="chapter-grid">' + cells + '</div>' +
      '</div>'
    );
  }

  async function renderChapter(route, token) {
    const meta = META.books[route.b - 1];
    if (!meta) { renderNotFound(token); return; }
    setView(
      '<div class="reader-sheet" style="min-height:340px;display:grid;place-items:center">' +
        '<div class="search-status"><span class="spinner"></span><span>جارٍ تحميل الأصحاح…</span></div>' +
      '</div>'
    );
    let book;
    try {
      book = await loadBook(route.b);
    } catch (e) {
      if (token !== renderToken) return;
      renderNotFound(token);
      return;
    }
    if (token !== renderToken) return;
    const verses = book.c[route.c - 1];
    if (!verses) { renderNotFound(token); return; }

    currentReader = { b: route.b, c: route.c, verses, book };
    lastRead = { b: route.b, c: route.c };
    saveJSON('bb.last', lastRead);

    const prev = neighbor(route.b, route.c, -1);
    const next = neighbor(route.b, route.c, 1);
    const saved = isSaved(route.b, route.c);
    const t = testamentOf(route.b);

    const verseHtml = verses.map((text, i) => {
      const vn = i + 1;
      return '<div class="verse" data-v="' + vn + '">' +
        '<span class="vnum" aria-hidden="true">' + fmt(vn) + '</span>' +
        '<span class="vtext">' + esc(text) + '</span>' +
        '<button class="copy-btn" type="button" aria-label="نسخ الآية ' + fmt(vn) + '" title="نسخ الآية">' + ICON.copy + '</button>' +
        '</div>';
    }).join('');

    const nav = '<div class="reader-nav">' +
      (prev ? '<a class="nav-chip" href="#/' + prev.b + '/' + prev.c + '">' + ICON.prev + ' السابق</a>' : '<span></span>') +
      '<button class="chapter-pill" type="button" data-action="open-chapters">' + ICON.grid + ' الأصحاحات</button>' +
      (next ? '<a class="nav-chip" href="#/' + next.b + '/' + next.c + '">التالي ' + ICON.next + '</a>' : '<span></span>') +
      '</div>';

    const foot = '<div class="reader-foot">' +
      (prev ? '<a class="foot-nav" href="#/' + prev.b + '/' + prev.c + '">' +
        '<span class="fn-label">الأصحاح السابق</span>' +
        '<span class="fn-title">' + ICON.prev + ' ' + esc(META.books[prev.b - 1].n) + ' ' + fmt(prev.c) + '</span></a>' : '<span></span>') +
      (next ? '<a class="foot-nav next" href="#/' + next.b + '/' + next.c + '">' +
        '<span class="fn-label">الأصحاح التالي</span>' +
        '<span class="fn-title">' + esc(META.books[next.b - 1].n) + ' ' + fmt(next.c) + ' ' + ICON.next + '</span></a>' : '<span></span>') +
      '</div>';

    setView(
      '<div class="reader-sheet">' +
        '<button class="reader-star' + (saved ? ' is-saved' : '') + '" type="button" data-action="toggle-bookmark" aria-pressed="' + (saved ? 'true' : 'false') + '" aria-label="' + (saved ? 'إزالة الأصحاح من المحفوظات' : 'حفظ الأصحاح') + '" title="' + (saved ? 'إزالة من المحفوظات' : 'حفظ الأصحاح') + '">' + ICON.star + '</button>' +
        nav +
        '<div class="reader-head">' +
          '<div class="reader-kicker">' + t.label + ' · الإصحاح ' + fmt(route.c) + '</div>' +
          '<h1 class="reader-title">' + esc(book.n) + ' <span class="num">' + fmt(route.c) + '</span></h1>' +
          '<div class="reader-meta">' + fmt(verses.length) + ' آية</div>' +
          '<div class="ornament">' + ORN_DIVIDER + '</div>' +
        '</div>' +
        '<div class="scripture">' + verseHtml + '</div>' +
        foot +
        '<p class="attribution">ترجمة سميث وفان دايك · ١٨٦٥</p>' +
      '</div>'
    );

    if (route.v) {
      const v = route.v;
      setTimeout(() => {
        if (token !== renderToken) return;
        const el = view.querySelector('.verse[data-v="' + v + '"]');
        if (el) {
          el.classList.add('flash');
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }, 90);
    }
    announce(esc(book.n) + ' ' + fmt(route.c));
  }

  function openChapters() {
    if (!currentReader) return;
    const { b, c, book } = currentReader;
    const cells = book.c.map((_, i) => {
      const n = i + 1;
      return '<a class="chapter-cell' + (n === c ? ' is-current' : '') + '" href="#/' + b + '/' + n + '">' + fmt(n) + '</a>';
    }).join('');
    openModal(esc(book.n), '<div class="chapter-grid">' + cells + '</div>');
  }

  function toggleBookmark() {
    if (!currentReader) return;
    const { b, c } = currentReader;
    const idx = bookmarks.findIndex((x) => x.b === b && x.c === c);
    const star = $('.reader-star');
    let message;
    if (idx >= 0) {
      bookmarks.splice(idx, 1);
      message = 'أُزيل الأصحاح من المحفوظات';
    } else {
      bookmarks.unshift({ b, c, ts: Date.now() });
      message = 'أُضيف الأصحاح إلى المحفوظات';
    }
    saveJSON('bb.saved', bookmarks);
    const isNow = idx < 0;
    if (star) {
      star.classList.toggle('is-saved', isNow);
      star.setAttribute('aria-pressed', isNow ? 'true' : 'false');
      const label = isNow ? 'إزالة الأصحاح من المحفوظات' : 'حفظ الأصحاح';
      star.setAttribute('aria-label', label);
      star.title = isNow ? 'إزالة من المحفوظات' : 'حفظ الأصحاح';
    }
    showToast(message);
    if (parseRoute().view === 'saved') render();
  }

  function renderSaved(token) {
    currentReader = null;
    const list = bookmarks.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (!list.length) {
      setView(
        '<div class="empty">' +
          '<div class="empty-icon">' + ICON.star + '</div>' +
          '<h3>لا توجد أصحاحات محفوظة</h3>' +
          '<p>اضغط على النجمة أعلى أي أصحاح لحفظه والعودة إليه لاحقًا.</p>' +
          '<a class="btn btn-primary" href="#/">العودة للرئيسية</a>' +
        '</div>'
      );
      void token;
      return;
    }
    const items = list.map((x) => {
      const meta = META.books[x.b - 1];
      let date = '';
      try { date = dateFmt.format(new Date(x.ts || Date.now())); } catch (e) { date = ''; }
      return '<div class="saved-item">' +
        '<span class="saved-star">' + ICON.starSmall + '</span>' +
        '<button class="saved-open" type="button" data-go="/' + x.b + '/' + x.c + '">' +
          '<div class="saved-ref">' + esc(meta.n) + ' ' + fmt(x.c) + '</div>' +
          '<div class="saved-sub">' + testamentOf(x.b).label + (date ? ' · حُفظ في ' + esc(date) : '') + '</div>' +
        '</button>' +
        '<button class="saved-remove" type="button" data-action="remove-saved" data-b="' + x.b + '" data-c="' + x.c + '" aria-label="إزالة من المحفوظات" title="إزالة">' + ICON.x + '</button>' +
        '</div>';
    }).join('');
    setView(
      '<div>' +
        '<div class="page-head">' +
          '<span class="eyebrow">' + ICON.star + ' المحفوظات</span>' +
          '<h1 class="page-title">الأصحاحات المحفوظة</h1>' +
          '<p class="page-sub">' + savedLabel(list.length) + '</p>' +
        '</div>' +
        '<div class="saved-list">' + items + '</div>' +
      '</div>'
    );
    void token;
  }

  function renderNotFound(token) {
    currentReader = null;
    setView(
      '<div class="empty">' +
        '<div class="empty-icon">' + ICON.book + '</div>' +
        '<h3>لم يتم العثور على الصفحة</h3>' +
        '<p>قد يكون الرابط غير صحيح أو السفر غير موجود.</p>' +
        '<a class="btn btn-primary" href="#/">العودة للرئيسية</a>' +
      '</div>'
    );
    void token;
  }

  /* ---------------- Search ---------------- */
  function searchHintHtml() {
    const sugs = ['محبة', 'سلام', 'رجاء', 'إيمان', 'حكمة', 'قوة', 'نور', 'فرح'];
    return '<div class="search-hint">' +
      '<p>ابحث في ٣١٬١٠٢ آية. جرّب كلمة أو عبارة، أو اكتب مرجعًا مثل «يوحنا ٣:١٦» للانتقال إليه مباشرة.</p>' +
      '<div class="suggests">' + sugs.map((s) => '<a class="chip" href="#/search?q=' + encodeURIComponent(s) + '">' + s + '</a>').join('') + '</div>' +
      '</div>';
  }

  function refCardHtml(ref) {
    const label = refLabel(ref);
    const href = ref.chapter ? '#/' + ref.book + '/' + ref.chapter + (ref.verse ? '/' + ref.verse : '') : '#/b/' + ref.book;
    return '<div class="ref-card">' +
      '<div><span class="rc-label">انتقال مباشر إلى مرجع</span><span class="rc-ref">' + esc(label) + '</span></div>' +
      '<a class="btn btn-ghost" href="' + href + '">افتح</a>' +
      '</div>';
  }

  function resultHtml(item, terms) {
    const meta = META.books[item.b - 1];
    const text = snippet(item.text, terms);
    return '<a class="result" href="#/' + item.b + '/' + item.c + '/' + item.v + '">' +
      '<div class="result-ref">' + esc(meta.n) + ' ' + fmt(item.c) + ':' + fmt(item.v) + '</div>' +
      '<div class="result-text">' + highlightText(text, terms) + '</div>' +
      '</a>';
  }

  function paintSearchResults(container, state) {
    if (!container) return;
    if (!state.all.length) {
      const hasRef = !!document.querySelector('.ref-card');
      container.innerHTML = '<div class="results-head">' + resultCount(0) + ' عن <strong>«' + esc(state.q) + '»</strong></div>' +
        '<div class="empty" style="padding:40px 20px">' +
          '<div class="empty-icon">' + ICON.searchBig + '</div>' +
          '<h3>' + (hasRef ? 'لا توجد نتائج نصية' : 'لا توجد نتائج') + '</h3>' +
          '<p>' + (hasRef ? 'يمكنك الانتقال مباشرة إلى المرجع أعلاه.' : 'جرّب كلمات أخرى، أو تحقق من الإملاء. البحث يتجاهل التشكيل وهمزات الألف.') + '</p>' +
        '</div>';
      return;
    }
    const shown = state.all.slice(0, state.shown);
    const remaining = state.all.length - shown.length;
    container.innerHTML =
      '<div class="results-head">' + resultCount(state.all.length) + ' عن <strong>«' + esc(state.q) + '»</strong></div>' +
      '<div class="results-list">' + shown.map((item) => resultHtml(item, state.terms)).join('') + '</div>' +
      (remaining > 0 ? '<div class="load-more-wrap"><button class="btn btn-ghost" type="button" data-action="load-more">عرض المزيد (' + fmt(remaining) + ')</button></div>' : '');
  }

  async function renderSearch(route, token) {
    currentReader = null;
    const q = route.q || '';
    sidebarSearchValue = q;
    searchInput.value = q;
    setView(
      '<div class="search-wrap">' +
        '<div class="page-head" style="margin-bottom:16px">' +
          '<span class="eyebrow">' + ICON.search + ' البحث</span>' +
          '<h1 class="page-title" style="font-size:clamp(26px,3.6vw,34px)">ابحث في الكتاب المقدس</h1>' +
        '</div>' +
        '<form class="search-big" id="search-page-form" role="search">' +
          '<input id="search-page-input" type="search" value="' + esc(q) + '" placeholder="كلمة، عبارة، أو مرجع مثل: يوحنا ٣:١٦" autocomplete="off" spellcheck="false" aria-label="عبارة البحث">' +
          '<button class="btn btn-primary" type="submit">بحث</button>' +
        '</form>' +
        '<div id="search-ref"></div>' +
        '<div id="search-body"></div>' +
      '</div>'
    );

    const body = $('#search-body');
    if (!q) {
      body.innerHTML = searchHintHtml();
      return;
    }

    const ref = parseRef(q);
    const refSlot = $('#search-ref');
    if (ref && refSlot) refSlot.innerHTML = refCardHtml(ref);

    body.innerHTML =
      '<div class="search-status"><span class="spinner"></span><span id="st-text">جارٍ تحضير فهرس البحث…</span></div>' +
      '<div class="progress"><span id="st-bar"></span></div>';

    try {
      const idx = await ensureIndex((done, total) => {
        if (token !== renderToken) return;
        const t = $('#st-text');
        const bar = $('#st-bar');
        if (t) t.textContent = 'جارٍ تحضير فهرس البحث… ' + fmt(done) + '/' + fmt(total);
        if (bar) bar.style.width = (done / total * 100) + '%';
      });
      if (token !== renderToken) return;
      const t = $('#st-text');
      if (t) t.textContent = 'جارٍ البحث…';
      await new Promise((r) => setTimeout(r, 20));
      if (token !== renderToken) return;

      const terms = queryTerms(q);
      const all = [];
      for (let i = 0; i < idx.length; i++) {
        const item = idx[i];
        let ok = true;
        for (let j = 0; j < terms.length; j++) {
          if (item.n.indexOf(terms[j]) === -1) { ok = false; break; }
        }
        if (ok) all.push(item);
      }
      searchState = { q, terms, all, shown: 30 };
      body.innerHTML = '<div id="search-results"></div>';
      paintSearchResults($('#search-results'), searchState);
    } catch (e) {
      if (token !== renderToken) return;
      body.innerHTML = '<div class="empty" style="padding:40px 20px">' +
        '<div class="empty-icon">' + ICON.searchBig + '</div>' +
        '<h3>تعذّر تحميل فهرس البحث</h3>' +
        '<p>تأكد من وجود مجلد البيانات بجانب ملف التطبيق، ثم أعد المحاولة.</p>' +
        '<button class="btn btn-ghost" type="button" data-action="reload">إعادة المحاولة</button>' +
        '</div>';
    }
  }

  /* ---------------- About ---------------- */
  function openAbout() {
    const chapters = META.books.reduce((sum, b) => sum + b.ch, 0);
    openModal('حول التطبيق',
      '<div class="modal-text">' +
        '<h3>الكتاب المقدس</h3>' +
        '<p>تطبيق للقراءة والبحث في العهد القديم والعهد الجديد كاملين، ويعمل دون اتصال بالإنترنت. كل النصوص محفوظة على جهازك.</p>' +
        '<h3>النص</h3>' +
        '<p>ترجمة سميث وفان دايك (١٨٦٥م)، والمصدر: <b>getbible.net</b>. النص مضمَّن داخل التطبيق للاستخدام الشخصي.</p>' +
        '<h3>اختصارات لوحة المفاتيح</h3>' +
        '<ul>' +
          '<li><b>→</b> / <b>←</b>: الأصحاح السابق / التالي</li>' +
          '<li><b>/</b>: الانتقال إلى البحث</li>' +
          '<li><b>Esc</b>: إغلاق النوافذ والقائمة</li>' +
        '</ul>' +
        '<h3>الخطوط</h3>' +
        '<p>خطّا Amiri وCairo بموجب رخصة الخطوط المفتوحة (OFL).</p>' +
        '<div class="modal-sign">الكتاب المقدس · ٦٦ سفرًا · ' + fmt(chapters) + ' أصحاحًا · ٣١٬١٠٢ آية</div>' +
      '</div>'
    );
  }

  /* ---------------- Events ---------------- */
  document.addEventListener('click', (ev) => {
    const copyBtn = ev.target.closest('.copy-btn');
    if (copyBtn && currentReader) {
      const verseEl = copyBtn.closest('.verse');
      const v = Number(verseEl && verseEl.dataset.v);
      const text = currentReader.verses[v - 1];
      if (text) {
        copyText(escRef(currentReader, v) + '\n' + text);
        showToast('تم نسخ الآية');
      }
      return;
    }

    const actionEl = ev.target.closest('[data-action]');
    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === 'toggle-bookmark') { toggleBookmark(); return; }
      if (action === 'open-chapters') { openChapters(); return; }
      if (action === 'load-more' && searchState) {
        searchState.shown += 30;
        paintSearchResults($('#search-results'), searchState);
        return;
      }
      if (action === 'remove-saved') {
        const b = Number(actionEl.dataset.b);
        const c = Number(actionEl.dataset.c);
        const idx = bookmarks.findIndex((x) => x.b === b && x.c === c);
        if (idx >= 0) {
          bookmarks.splice(idx, 1);
          saveJSON('bb.saved', bookmarks);
          showToast('أُزيل الأصحاح من المحفوظات');
          render();
        }
        return;
      }
      if (action === 'reload') { location.reload(); return; }
    }

    const goEl = ev.target.closest('[data-go]');
    if (goEl) {
      ev.preventDefault();
      go(goEl.dataset.go);
      return;
    }

    if (ev.target.closest('.modal-card a')) { closeModal(); }
  });

  function escRef(cr, v) {
    return META.books[cr.b - 1].n + ' ' + fmt(cr.c) + ':' + fmt(v);
  }

  document.addEventListener('submit', (ev) => {
    const form = ev.target.closest('#search-form, #search-page-form');
    if (!form) return;
    ev.preventDefault();
    const input = form.querySelector('input[type="search"]');
    const q = (input ? input.value : '').trim();
    closeSidebar();
    if (!q) { go('/search'); return; }
    go('/search?q=' + encodeURIComponent(q));
  });

  document.addEventListener('keydown', (ev) => {
    if (!modal.hidden) {
      if (ev.key === 'Escape') closeModal();
      return;
    }
    if (ev.key === 'Escape') {
      closeSidebar();
      return;
    }
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) return;
    if (ev.key === '/') {
      ev.preventDefault();
      const big = $('#search-page-input');
      if (big) { big.focus(); big.select(); }
      else {
        openSidebar();
        searchInput.focus();
        searchInput.select();
      }
      return;
    }
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      const route = parseRoute();
      if (route.view === 'chapter' && currentReader) {
        const target = neighbor(route.b, route.c, ev.key === 'ArrowLeft' ? 1 : -1);
        if (target) {
          ev.preventDefault();
          go('/' + target.b + '/' + target.c);
        }
      }
    }
  });

  window.addEventListener('hashchange', render);

  $$('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      sidebarTab = Number(tab.dataset.t);
      paintTabs();
      paintSideBooks();
      sideBooks.scrollTop = 0;
    });
  });

  $('#menu-btn').addEventListener('click', openSidebar);
  $('#scrim').addEventListener('click', closeSidebar);
  $('#search-mobile').addEventListener('click', () => {
    openSidebar();
    setTimeout(() => searchInput.focus(), 60);
  });
  $('#about-btn').addEventListener('click', () => {
    closeSidebar();
    openAbout();
  });

  themeBtn.addEventListener('click', () => {
    const i = THEMES.indexOf(settings.theme);
    settings.theme = THEMES[(i + 1) % THEMES.length];
    saveJSON('bb.settings', settings);
    applyTheme();
    showToast('المظهر: ' + THEME_LABEL[settings.theme]);
  });

  $('#font-inc').addEventListener('click', () => {
    settings.size = Math.min(34, settings.size + 1);
    saveJSON('bb.settings', settings);
    applySize();
    showToast('حجم الخط: ' + fmt(settings.size));
  });

  $('#font-dec').addEventListener('click', () => {
    settings.size = Math.max(15, settings.size - 1);
    saveJSON('bb.settings', settings);
    applySize();
    showToast('حجم الخط: ' + fmt(settings.size));
  });

  savedBtn.addEventListener('click', () => go('/saved'));

  $$('[data-close]', modal).forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  /* ---------------- Init ---------------- */
  applyTheme();
  applySize();
  paintTabs();
  paintSideBooks();
  render();
})();
