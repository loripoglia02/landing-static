/* Protocollo Terapista — landing. Nessuna dipendenza esterna. */
(function () {
  'use strict';

  var C = window.PT_CONFIG || {};
  var doc = document;
  var RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var HAS_IO = 'IntersectionObserver' in window;

  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }

  // sessionStorage / localStorage dentro try/catch: possono mancare o lanciare errori
  function area(t) { return t === 'local' ? window.localStorage : window.sessionStorage; }
  var store = {
    get: function (k, t) { try { var v = area(t).getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set: function (k, v, t) { try { area(t).setItem(k, JSON.stringify(v)); } catch (e) { /* niente */ } },
    del: function (k, t) { try { area(t).removeItem(k); } catch (e) { /* niente */ } }
  };

  function onView(el, cb, opts) {
    if (!el) return;
    if (!HAS_IO) { cb(); return; }
    var o = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { o.disconnect(); cb(); } });
    }, opts || { threshold: 0.05 });
    o.observe(el);
  }

  /* ---------- Link, dati legali, anno ---------- */
  var LINKS = { instagram: C.INSTAGRAM_URL, privacy: C.PRIVACY_URL, cookie: C.COOKIE_URL };
  $$('[data-href]').forEach(function (a) {
    var u = LINKS[a.getAttribute('data-href')];
    if (u) { a.href = u; return; }
    // Link non ancora configurato: niente nuova scheda verso la pagina stessa
    a.removeAttribute('target');
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  var year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  var legal = $('[data-legal]');
  if (legal) {
    var parts = [];
    if (C.INTESTAZIONE_LEGALE) parts.push(doc.createTextNode(C.INTESTAZIONE_LEGALE));
    if (C.PARTITA_IVA) parts.push(doc.createTextNode('P.IVA ' + C.PARTITA_IVA));
    if (C.EMAIL_CONTATTO) {
      var m = doc.createElement('a');
      m.href = 'mailto:' + C.EMAIL_CONTATTO;
      m.textContent = C.EMAIL_CONTATTO;
      parts.push(m);
    }
    parts.forEach(function (p, i) {
      if (i) legal.appendChild(doc.createTextNode(' · '));
      legal.appendChild(p);
    });
  }

  /* ---------- VSL nella hero (solo se c'è in config) ---------- */
  var media = $('#hero-media');
  if (C.VSL_SRC && media) {
    var box = doc.createElement('div');
    box.className = 'vsl';
    var v = doc.createElement('video');
    v.preload = 'none';
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-label', 'Video di presentazione di Protocollo Terapista');
    if (C.VSL_POSTER) v.poster = C.VSL_POSTER;
    v.src = C.VSL_SRC;
    var play = doc.createElement('button');
    play.type = 'button';
    play.className = 'vsl-play';
    play.innerHTML = '<span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg></span><span>Guarda il video</span>';
    play.addEventListener('click', function () {
      v.controls = true;
      play.hidden = true;
      var p = v.play();
      if (p && p.catch) p.catch(function () { play.hidden = false; });
    });
    box.appendChild(v);
    box.appendChild(play);
    media.innerHTML = '';
    media.appendChild(box);
  }

  /* ---------- Comparsa delle sezioni e linee ---------- */
  var revealIO = (HAS_IO && !RM) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 }) : null;
  $$('.reveal, .pline').forEach(function (el) {
    if (revealIO) revealIO.observe(el); else el.classList.add('in');
  });

  /* ---------- G2 Rete dei fornitori: curve calcolate sulle pillole ---------- */
  var net = $('.g2-net');
  function drawG2() {
    if (!net) return;
    var svg = $('.g2-lines', net);
    var r = net.getBoundingClientRect();
    if (!r.width) return;
    var tu = $('.g2-tu', net).getBoundingClientRect();
    var cx = tu.left - r.left + tu.width / 2;
    var cy = tu.top - r.top + tu.height / 2;
    var out = '';
    $$('.g2-pill', net).forEach(function (p, k) {
      var b = p.getBoundingClientRect();
      var x = b.left - r.left + b.width / 2;
      var y = b.top - r.top + b.height / 2;
      var dx = cx - x, dy = cy - y;
      // ogni curva scende (o sale) oltre il centro e rientra in «Tu» dal lato opposto:
      // le linee si incrociano senza girare attorno al cerchio
      var bend = (k % 2 ? 1 : -1) * r.height * 0.28 * (1 - Math.min(1, Math.abs(dy) / (r.height * 0.3)));
      var c1x = x + dx * 0.55, c1y = y + dy * 1.3 + bend;
      var c2x = cx - dx * 0.3, c2y = cy + dy * 0.35 - bend * 0.5;
      out += '<path pathLength="1" style="--k:' + k + '" d="M' + x.toFixed(1) + ' ' + y.toFixed(1) +
        'C' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ' ' +
        cx.toFixed(1) + ' ' + cy.toFixed(1) + '"/>';
    });
    svg.setAttribute('viewBox', '0 0 ' + r.width.toFixed(1) + ' ' + r.height.toFixed(1));
    svg.innerHTML = out;
  }
  if (net) {
    drawG2();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(drawG2);
    var g2t;
    window.addEventListener('resize', function () { clearTimeout(g2t); g2t = setTimeout(drawG2, 120); });
  }

  /* ---------- G3 Piano della settimana ---------- */
  var g3 = $('.g3');
  if (g3) {
    $$('tbody tr', g3).forEach(function (tr, r) {
      $$('i', tr).forEach(function (i, c) { i.style.setProperty('--d', String(r + c)); });
    });
    var g3Touched = false;
    var setMode = function (m) {
      g3.setAttribute('data-mode', m);
      $$('.seg button', g3).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === m)); });
    };
    $$('.seg button', g3).forEach(function (b) {
      b.addEventListener('click', function () { g3Touched = true; setMode(b.getAttribute('data-mode')); });
    });
    if (RM) {
      setMode('noi');
    } else {
      onView(g3, function () {
        setTimeout(function () { if (!g3Touched) setMode('noi'); }, 700);
      }, { threshold: 0.6 });
    }
  }

  /* ---------- G9 Reel nel telefono ---------- */
  var reel = $('.reel');
  var audioBtn = $('.audio-btn');
  if (reel) {
    if (C.REEL_POSTER) reel.poster = C.REEL_POSTER;
    var reelLoaded = false;
    var loadReel = function () {
      if (!reelLoaded && C.REEL_SRC) { reel.src = C.REEL_SRC; reelLoaded = true; }
    };
    var tryPlay = function () { var p = reel.play(); if (p && p.catch) p.catch(function () { /* autoplay bloccato */ }); };
    if (HAS_IO) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            loadReel();
            if (!RM || !reel.muted) tryPlay();
          } else if (!reel.paused) {
            reel.pause();
          }
        });
      }, { rootMargin: '200px 0px', threshold: 0 }).observe(reel);
    } else {
      loadReel();
    }
    if (audioBtn) {
      audioBtn.addEventListener('click', function () {
        loadReel();
        if (reel.muted) {
          reel.muted = false;
          tryPlay();
          audioBtn.textContent = 'Disattiva l’audio';
        } else {
          reel.muted = true;
          audioBtn.textContent = 'Attiva l’audio';
        }
      });
    }
  }

  /* ---------- Fisarmoniche: una voce aperta alla volta per gruppo (details con lo stesso name) ---------- */
  $$('details[name]').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      $$('details[name="' + d.getAttribute('name') + '"]').forEach(function (o) { if (o !== d && o.open) o.open = false; });
    });
  });

  /* ---------- Foto dei soci ---------- */
  var foto = C.FOTO_SOCI || {};
  $$('.socio-foto').forEach(function (boxEl) {
    var src = foto[boxEl.getAttribute('data-socio')];
    if (!src) return;
    var img = new Image();
    img.src = src;
    img.alt = ($('h3', boxEl.parentNode) || {}).textContent || '';
    img.width = 800;
    img.height = 1000;
    img.loading = 'lazy';
    img.decoding = 'async';
    boxEl.innerHTML = '';
    boxEl.appendChild(img);
  });

  /* ---------- Casi studio: «in costruzione» finché non ci sono casi completi ---------- */
  function casoCompleto(c) {
    var campi = ['studio', 'citta', 'professione', 'situazione_partenza', 'cosa_abbiamo_fatto', 'frase_terapista', 'foto'];
    if (!c || campi.some(function (k) { return !String(c[k] || '').trim(); })) return false;
    var r = c.risultati;
    return Array.isArray(r) && r.length > 0 && r.every(function (x) {
      return x && ['numero', 'periodo', 'fonte'].every(function (k) { return String(x[k] || '').trim(); });
    });
  }
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  if (C.SHOW_CASE_STUDIES && window.fetch) {
    fetch('casi-studio.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var casi = ((d && d.casi) || []).filter(casoCompleto);
        if (!casi.length) return;
        var sec = $('#casi-studio');
        var list = $('.casi-list', sec);
        casi.forEach(function (c) {
          var art = el('article', 'caso');
          var img = new Image();
          img.src = c.foto; img.alt = c.studio; img.loading = 'lazy'; img.decoding = 'async';
          art.appendChild(img);
          var body = el('div');
          body.appendChild(el('h3', null, c.studio));
          body.appendChild(el('p', 'caso-meta', c.professione + ' · ' + c.citta));
          body.appendChild(el('p', 'caso-lbl', 'Situazione di partenza'));
          body.appendChild(el('p', 'text', c.situazione_partenza));
          body.appendChild(el('p', 'caso-lbl', 'Cosa abbiamo fatto'));
          body.appendChild(el('p', 'text', c.cosa_abbiamo_fatto));
          body.appendChild(el('p', 'caso-lbl', 'Risultati'));
          var nums = el('div', 'caso-num');
          c.risultati.forEach(function (x) {
            var row = el('div');
            row.appendChild(el('b', null, x.numero));
            row.appendChild(el('span', null, x.periodo + ' · ' + x.fonte));
            nums.appendChild(row);
          });
          body.appendChild(nums);
          body.appendChild(el('blockquote', null, c.frase_terapista));
          art.appendChild(body);
          list.appendChild(art);
        });
        // Al posto del cantiere: sezione chiara con i casi veri
        $$('[data-casi]', sec).forEach(function (n) { n.hidden = n.getAttribute('data-casi') !== 'ok'; });
        sec.classList.remove('dark', 'dark-2');
        sec.classList.add('light');
        sec.setAttribute('aria-labelledby', 't-casi-ok');
      })
      .catch(function () { /* resta la versione «in costruzione» */ });
  }

  /* ---------- Provenienza del visitatore (UTM, fbclid, referrer) ---------- */
  var ATTR_KEY = 'pt_provenienza';
  var attrib = store.get(ATTR_KEY) || {};
  (function () {
    var q = {};
    location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = decodeURIComponent((i < 0 ? kv : kv.slice(0, i)).replace(/\+/g, ' '));
      var val = i < 0 ? '' : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
      q[k] = val;
    });
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'].forEach(function (k) {
      if (q[k]) attrib[k] = q[k];
    });
    if (attrib.referrer == null) attrib.referrer = doc.referrer || '';
    store.set(ATTR_KEY, attrib);
  })();

  /* ---------- Consenso cookie, Meta Pixel, GA4 ---------- */
  var pixelOn = false, gaOn = false, diagSeen = false, vcSent = false;

  function loadPixel() {
    if (pixelOn || !C.META_PIXEL_ID) return;
    pixelOn = true;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, doc, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', C.META_PIXEL_ID);
    window.fbq('track', 'PageView');
    if (diagSeen) sendViewContent();
  }
  function sendViewContent() {
    if (!pixelOn || vcSent) return;
    vcSent = true;
    window.fbq('track', 'ViewContent', { content_name: 'Diagnosi dello studio' });
  }
  function loadGA() {
    if (gaOn || !C.GA4_ID) return;
    gaOn = true;
    var s = doc.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(C.GA4_ID);
    doc.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', C.GA4_ID);
  }

  var CK = 'pt_consenso_v1';
  var consent = store.get(CK, 'local');
  var banner = $('.cookie');
  var fcState = { heroOut: false, diagIn: false, banner: false };

  function applyConsent(c) {
    if (c && c.mkt) loadPixel();
    if (c && c.stat) loadGA();
  }
  function setPrefsOpen(open) {
    $('.cookie-prefs', banner).hidden = !open;
    $('[data-cookie="personalizza"]', banner).hidden = open;
    $('[data-cookie="salva"]', banner).hidden = !open;
    if (open) {
      $('[data-consent="stat"]', banner).checked = !!(consent && consent.stat);
      $('[data-consent="mkt"]', banner).checked = !!(consent && consent.mkt);
    }
  }
  function showBanner(prefs) {
    banner.hidden = false;
    fcState.banner = true;
    updateFloat();
    setPrefsOpen(!!prefs);
  }
  function hideBanner() {
    banner.hidden = true;
    fcState.banner = false;
    updateFloat();
  }
  function saveConsent(stat, mkt) {
    var prev = consent;
    consent = { stat: !!stat, mkt: !!mkt, data: new Date().toISOString() };
    store.set(CK, consent, 'local');
    hideBanner();
    // Consenso ritirato: si ricarica la pagina così gli script già caricati spariscono
    if (prev && ((prev.stat && !consent.stat && gaOn) || (prev.mkt && !consent.mkt && pixelOn))) {
      location.reload();
      return;
    }
    applyConsent(consent);
  }
  if (banner) {
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cookie]');
      if (!b) return;
      var a = b.getAttribute('data-cookie');
      if (a === 'rifiuta') saveConsent(false, false);
      else if (a === 'accetta') saveConsent(true, true);
      else if (a === 'personalizza') { setPrefsOpen(true); $('[data-consent="stat"]', banner).focus(); }
      else if (a === 'salva') saveConsent($('[data-consent="stat"]', banner).checked, $('[data-consent="mkt"]', banner).checked);
    });
    $$('[data-cookie-prefs]').forEach(function (b) {
      b.addEventListener('click', function () { showBanner(true); $('[data-consent="stat"]', banner).focus(); });
    });
    if (!consent) showBanner(false); else applyConsent(consent);
  }

  /* ---------- CTA sempre visibile ---------- */
  var fc = $('.float-cta');
  var fcLink = fc && $('a', fc);
  function updateFloat() {
    if (!fc) return;
    var on = fcState.heroOut && !fcState.diagIn && !fcState.banner;
    fc.classList.toggle('on', on);
    fc.setAttribute('aria-hidden', String(!on));
    fcLink.tabIndex = on ? 0 : -1;
  }
  var hero = $('.hero');
  var diag = $('#diagnosi');
  if (HAS_IO && hero && diag) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { fcState.heroOut = !e.isIntersecting && e.boundingClientRect.top < 0; updateFloat(); });
    }).observe(hero);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        fcState.diagIn = e.isIntersecting;
        updateFloat();
        if (e.isIntersecting) { diagSeen = true; sendViewContent(); }
      });
    }).observe(diag);
  }

  /* ---------- Modulo della diagnosi ---------- */
  var form = $('#qform');
  if (!form) return;

  var steps = $$('.qf-step', form);
  var N = steps.length;          // 9 domande + contatti
  var QN = N - 1;
  var countEl = $('#qf-count');
  var prog = $('.qf-progress', form);
  var dots = $$('i', prog);
  var nav = $('.qf-nav', form);
  var backBtn = $('.qf-back', form);
  var nextBtn = $('.qf-next', form);
  var errEl = $('#qf-error');
  var submitBtn = $('.qf-submit', form);
  var doneEl = $('#qf-done');
  var failEl = $('.qf-fail');
  var qcard = $('.qcard');
  var MSG = {};
  $$('[data-err]').forEach(function (s) { MSG[s.getAttribute('data-err')] = s.textContent; });

  var FKEY = 'pt_diagnosi';
  var st = store.get(FKEY) || {};
  st.a = st.a || {};
  st.c = st.c || {};
  var cur = 0;
  var busy = false;

  var fields = {
    nome: $('#f-nome'), studio: $('#f-studio'), citta: $('#f-citta'),
    email: $('#f-email'), cellulare: $('#f-tel')
  };
  var privacy = $('#f-privacy');
  var news = $('#f-news');

  function save() { st.step = cur; store.set(FKEY, st); }

  function render(i, moveFocus) {
    cur = i;
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    countEl.textContent = i < QN ? 'Domanda ' + (i + 1) + ' di ' + QN : '';
    dots.forEach(function (d, k) {
      d.classList.toggle('done', k < i);
      d.classList.toggle('now', k === i);
    });
    prog.style.setProperty('--p', String(i / (N - 1)));
    backBtn.hidden = i === 0;
    var type = steps[i].getAttribute('data-type');
    nextBtn.hidden = type !== 'multi' && type !== 'text';
    nav.hidden = backBtn.hidden && nextBtn.hidden;
    errEl.textContent = '';
    save();
    if (moveFocus) {
      var top = qcard.getBoundingClientRect().top;
      var head = parseInt(getComputedStyle(doc.documentElement).getPropertyValue('--header-h'), 10) || 64;
      if (top < head) window.scrollBy({ top: top - head - 16, behavior: RM ? 'auto' : 'smooth' });
      $('.qf-q', steps[i]).focus({ preventScroll: true });
    }
  }

  function answered(s) {
    if (s.getAttribute('data-type') === 'text') return true;   // domande aperte facoltative
    var name = s.getAttribute('data-name');
    var v = st.a[name];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }

  steps.forEach(function (s, k) {
    var type = s.getAttribute('data-type');
    var name = s.getAttribute('data-name');
    if (type === 'contact') return;
    if (type === 'text') {
      var ta = $('textarea', s);
      if (st.a[name]) ta.value = st.a[name];
      ta.addEventListener('input', function () { st.a[name] = ta.value; save(); });
      return;
    }
    var opts = $$('.opt', s);
    opts.forEach(function (b) {
      b.addEventListener('click', function () {
        if (busy) return;
        var val = b.textContent.trim();
        if (type === 'single') {
          opts.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          st.a[name] = val;
          save();
          busy = true;
          setTimeout(function () { busy = false; render(k + 1, true); }, RM ? 0 : 260);
        } else {
          var on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', String(on));
          var arr = (st.a[name] || []).filter(function (x) { return x !== val; });
          if (on) arr.push(val);
          st.a[name] = arr;
          save();
          if (arr.length) errEl.textContent = '';
        }
      });
    });
  });

  nextBtn.addEventListener('click', function () {
    if (!answered(steps[cur])) { errEl.textContent = MSG.scegli; return; }
    render(cur + 1, true);
  });
  backBtn.addEventListener('click', function () { if (cur > 0) render(cur - 1, true); });

  // Ripristino delle risposte salvate
  steps.forEach(function (s) {
    var name = s.getAttribute('data-name');
    var v = name ? st.a[name] : null;
    if (v == null) return;
    $$('.opt', s).forEach(function (o) {
      var t = o.textContent.trim();
      o.setAttribute('aria-pressed', String(Array.isArray(v) ? v.indexOf(t) > -1 : v === t));
    });
  });
  Object.keys(fields).forEach(function (k) {
    var f = fields[k];
    if (st.c[k]) f.value = st.c[k];
    f.addEventListener('input', function () {
      st.c[k] = f.value;
      save();
      if (f.getAttribute('aria-invalid') === 'true') validate(k);
    });
    f.addEventListener('blur', function () { if (f.value.trim()) validate(k); });
  });
  privacy.checked = !!st.c.privacy;
  news.checked = !!st.c.news;
  privacy.addEventListener('change', function () { st.c.privacy = privacy.checked; save(); if (privacy.checked) validate('privacy'); });
  news.addEventListener('change', function () { st.c.news = news.checked; save(); });

  var start = Math.min(st.step || 0, N - 1);
  for (var s0 = 0; s0 < start; s0++) {
    if (!answered(steps[s0])) { start = s0; break; }
  }
  render(start, false);

  // Validazione
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function normPhone(raw) {
    var s = String(raw || '').replace(/[\s.\-()\/]/g, '');
    if (s.indexOf('00') === 0) s = '+' + s.slice(2);
    var m;
    if ((m = s.match(/^(?:\+39)?(3\d{8,9})$/))) return '+39' + m[1];        // Italia: 3xx…
    if ((m = s.match(/^\+410?(7[4-9]\d{7})$/))) return '+41' + m[1];        // Svizzera: +41 7x…
    if ((m = s.match(/^0(7[4-9]\d{7})$/))) return '+41' + m[1];             // Svizzera: 07x…
    return null;
  }
  function setErr(input, errId, msg) {
    var e = $('#' + errId);
    if (msg) { input.setAttribute('aria-invalid', 'true'); e.textContent = msg; }
    else { input.removeAttribute('aria-invalid'); e.textContent = ''; }
    return !msg;
  }
  function validate(k) {
    if (k === 'nome') return setErr(fields.nome, 'e-nome', /\S+\s+\S+/.test(fields.nome.value.trim()) ? '' : MSG.nome);
    if (k === 'email') return setErr(fields.email, 'e-email', EMAIL_RE.test(fields.email.value.trim()) ? '' : MSG.email);
    if (k === 'cellulare') return setErr(fields.cellulare, 'e-tel', normPhone(fields.cellulare.value) ? '' : MSG.tel);
    if (k === 'privacy') return setErr(privacy, 'e-privacy', privacy.checked ? '' : MSG.privacy);
    return true;
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }
  function cookie(name) {
    var m = doc.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  function send(payload) {
    if (!C.FORM_ENDPOINT || !window.fetch) return Promise.reject(new Error('FORM_ENDPOINT non configurato in config.js'));
    var type = C.FORM_CONTENT_TYPE || 'application/json';
    var simple = type.indexOf('text/plain') === 0;
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
    return fetch(C.FORM_ENDPOINT, {
      method: 'POST',
      mode: simple ? 'no-cors' : 'cors',
      headers: { 'Content-Type': type },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      // con no-cors la risposta è opaca: se la rete non ha dato errore la consideriamo arrivata
      if (!simple && !r.ok) throw new Error('Risposta ' + r.status);
      return r;
    }, function (err) { clearTimeout(timer); throw err; });
  }

  function showDone() {
    var first = fields.nome.value.trim().split(/\s+/)[0] || '';
    first = first.charAt(0).toUpperCase() + first.slice(1);
    $('[data-nome]', doneEl).textContent = first;
    form.hidden = true;
    failEl.hidden = true;
    doneEl.hidden = false;
    doneEl.focus();
  }

  var sending = false;
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (cur !== N - 1 || sending) return;
    failEl.hidden = true;

    ['nome', 'email', 'cellulare', 'privacy'].forEach(validate);
    var bad = [fields.nome, fields.email, fields.cellulare, privacy].filter(function (i) {
      return i.getAttribute('aria-invalid') === 'true';
    })[0];
    if (bad) { bad.focus(); return; }

    // Campo trappola compilato: è un bot. Mostriamo la conferma senza inviare.
    if ($('#f-sito').value) { showDone(); return; }

    // Anteprima per i soci: percorso completo, nessun invio
    if (C.FORM_DEMO) {
      store.del(FKEY);
      var demo = doc.createElement('p');
      demo.className = 'qf-demo';
      demo.textContent = 'Anteprima: le risposte non sono state inviate a nessuno.';
      doneEl.appendChild(demo);
      showDone();
      return;
    }

    var a = st.a;
    var eventId = uuid();
    var payload = {
      event_id: eventId,
      inviato_il: new Date().toISOString(),
      nome: fields.nome.value.trim(),
      studio: fields.studio.value.trim(),
      citta: fields.citta.value.trim(),
      email: fields.email.value.trim(),
      cellulare: normPhone(fields.cellulare.value),
      cellulare_inserito: fields.cellulare.value.trim(),
      professione: a.professione || '',
      ruolo: a.ruolo || '',
      struttura_attivita: a.struttura_attivita || '',
      acquisizione_pazienti: a.acquisizione_pazienti || '',
      ostacolo_principale: a.ostacolo_principale || '',
      capacita_nuovi_pazienti: a.capacita_nuovi_pazienti || '',
      esperienza_marketing: a.esperienza_marketing || '',
      motivazione: (a.motivazione || '').trim(),
      obiettivo_6_12_mesi: (a.obiettivo_6_12_mesi || '').trim(),
      consenso_privacy: privacy.checked,
      consenso_newsletter: news.checked,
      utm_source: attrib.utm_source || '',
      utm_medium: attrib.utm_medium || '',
      utm_campaign: attrib.utm_campaign || '',
      utm_content: attrib.utm_content || '',
      utm_term: attrib.utm_term || '',
      fbclid: attrib.fbclid || '',
      referrer: attrib.referrer || '',
      pagina_url: location.href,
      fbp: cookie('_fbp'),
      fbc: cookie('_fbc')
    };

    sending = true;
    submitBtn.disabled = true;
    send(payload).then(function () {
      if (pixelOn && window.fbq) window.fbq('track', 'Lead', { content_name: 'Diagnosi dello studio' }, { eventID: eventId });
      if (gaOn && window.gtag) window.gtag('event', 'generate_lead', { event_id: eventId });
      store.del(FKEY);
      showDone();
    }).catch(function (err) {
      if (window.console) console.warn('Invio non riuscito:', err && err.message);
      failEl.hidden = false;
    }).then(function () {
      sending = false;
      submitBtn.disabled = false;
    });
  });
})();
