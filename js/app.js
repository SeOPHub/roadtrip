/* America West Roadtrip: renderização, rotas (#/), estado de visitados e PWA.
   Sem dependências. O gerar.py escreve js/trip-data.js com:
   - window.TRIP_DATA: o roteiro (app/conteudo/roteiro.json);
   - window.TRIP_PHOTOS: as fotos otimizadas encontradas em fotos/, por "<destino>/<espaço>";
   - window.TRIP_BUILD: número e data da versão gerada. */
(function () {
  'use strict';

  var STORE_KEY = 'visitedPlaces';
  var D = window.TRIP_DATA;
  var PHOTOS = window.TRIP_PHOTOS || {};
  var BUILD = window.TRIP_BUILD || null;
  var root = document.getElementById('app');
  var visited = loadVisited();
  var io = null;

  /* ---------- utilidades ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function url(u) {
    u = (u || '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
  }
  function icon(name, size) {
    var body = (window.ICONS || {})[name] || '';
    size = size || 16;
    return '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      body + '</svg>';
  }
  function list(a) { return Array.isArray(a) ? a : []; }
  function map(a, fn) { return list(a).map(fn).join(''); }
  function num(i) { return String(i + 1).padStart(2, '0'); }

  /* ---------- visitados (persistem no aparelho, funcionam offline) ---------- */

  function loadVisited() {
    var v = {};
    try {
      v = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {};
      // Migra a chave antiga do protótipo ("destino/local").
      var legacy = JSON.parse(localStorage.getItem('rt-visited') || 'null');
      if (legacy) {
        Object.keys(legacy).forEach(function (k) {
          var nk = k.replace('/', '-');
          if (!(nk in v)) v[nk] = legacy[k];
        });
        localStorage.setItem(STORE_KEY, JSON.stringify(v));
      }
    } catch (e) {}
    return v;
  }
  function saveVisited() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(visited)); } catch (e) {}
  }
  // Chave estável: "<destino>-<local>", ex.: "joshua-tree-hidden-valley".
  function placeKey(destId, p) {
    return p.visit !== false && p.id ? destId + '-' + p.id : '';
  }
  function doneCount(keys) {
    return keys.filter(function (k) { return visited[k]; }).length;
  }
  function progressText(keys) {
    return doneCount(keys) + ' de ' + keys.length + ' visitados';
  }

  /* ---------- componentes ---------- */

  // Par fixo [Maps] [Instagram]: sempre visível; sem URL fica desativado.
  function actions(maps, instagram) {
    var m = url(maps), ig = url(instagram);
    var mapsBtn = m
      ? '<a class="act act--maps" href="' + esc(m) + '" target="_blank" rel="noopener noreferrer" aria-label="Abrir no Maps">' + icon('map-pin') + 'Maps</a>'
      : '<span class="act act--maps" aria-disabled="true" title="Maps indisponível">' + icon('map-pin') + 'Maps</span>';
    var igBtn = ig
      ? '<a class="act act--ig" href="' + esc(ig) + '" target="_blank" rel="noopener noreferrer" aria-label="Abrir no Instagram">' + icon('instagram') + '</a>'
      : '<span class="act act--ig" aria-disabled="true" title="Instagram indisponível" aria-label="Instagram indisponível">' + icon('instagram') + '</span>';
    return '<div class="actions">' + mapsBtn + igBtn + '</div>';
  }

  function checkBtn(key) {
    if (!key) return '';
    var on = !!visited[key];
    return '<button class="check" type="button" data-visit="' + esc(key) + '" aria-pressed="' + on + '" aria-label="' +
      (on ? 'Desmarcar visitado' : 'Marcar como visitado') + '">' + icon('check', 18) + '</button>';
  }
  function visitedTag(key) {
    return key ? '<span class="visited-tag" data-tag="' + esc(key) + '"' + (visited[key] ? '' : ' hidden') + '>Visitado</span>' : '';
  }

  function chip(c, extra) {
    var tone = c.tone === 'ok' ? ' chip--ok' : c.tone === 'accent' ? ' chip--accent' : c.tone === 'warn' ? ' chip--warn' : '';
    return '<span class="chip' + (extra || '') + tone + '">' + (c.icon ? icon(c.icon, 12) : '') + esc(c.t) + '</span>';
  }

  // Larguras de exibição por tipo de espaço: o navegador escolhe no srcset o tamanho certo para a tela.
  var SIZES = {
    full: '(min-width: 430px) 430px, 100vw',
    wide: '(min-width: 430px) 390px, calc(100vw - 40px)',
    card: '(min-width: 430px) 310px, 72vw',
    thumb: '(min-width: 430px) 130px, 30vw'
  };

  // Espaço de foto: quadro neutro por baixo + a foto otimizada de fotos/<destino>/<espaço>, quando existir.
  // Com ?slots=1, mostra qual arquivo colocar em fotos/ para preencher o espaço.
  function photo(destId, slot, alt, ratio, size, attrs) {
    if (!slot) return '';
    var p = PHOTOS[destId + '/' + slot];
    return '<span class="ph" aria-hidden="true">' + icon('image', 20) + '</span>' +
      '<span class="slot-tag" aria-hidden="true">fotos/' + esc(destId) + '/' + esc(slot) + '.jpg · ' + ratio + '</span>' +
      (p ? '<img class="cover" src="' + esc(p.src) + '" srcset="' + esc(p.srcset) + '" sizes="' + SIZES[size] + '" data-full="' + esc(p.full) +
        '" width="' + p.w + '" height="' + p.h + '" alt="' + esc(alt) + '"' + (attrs || '') + ' onerror="this.remove()">' : '');
  }

  // Texto "x de y visitados" + barra; a barra cresce até o valor real após a pintura (syncBars).
  function progressSpan(keys, id) {
    return '<div class="progress-wrap" data-progress="' + esc(id) + '" data-keys="' + esc(keys.join(' ')) + '">' +
      '<span class="progress">' + progressText(keys) + '</span>' +
      '<span class="progress-bar" aria-hidden="true"><i></i></span></div>';
  }

  /* ---------- HOME ---------- */

  function renderHome() {
    var all = D.destinations;
    var ready = all.filter(function (d) { return d.ready; });
    var meta = all.length + ' etapas · ' + ready.length + ' ' + (ready.length === 1 ? 'guia pronto' : 'guias prontos');

    var featured = map(ready, function (d) {
      var i = all.indexOf(d);
      return '<a class="feature" href="#/' + esc(d.id) + '" data-reveal>' +
        photo(d.id, d.hero, d.name, '4:5', 'wide') +
        '<div class="feature-shade"></div>' +
        '<div class="feature-top"><span class="eyebrow eyebrow--light">Etapa ' + num(i) + '</span>' +
        '<span class="glass-pill glass-chip">' + icon('check', 12) + 'Guia pronto</span></div>' +
        '<div class="feature-bottom">' +
          '<div><div class="feature-name">' + esc(d.name) + '</div><div class="feature-places">' + esc(d.places) + '</div></div>' +
          '<div class="meta-row">' +
            (d.distance ? '<span>' + icon('route', 14) + esc(d.distance) + '</span>' : '') +
            (d.drive ? '<span>' + icon('car', 14) + esc(d.drive) + '</span>' : '') +
          '</div>' +
          '<div class="feature-cta glass-chip"><span>Abrir guia</span>' + icon('arrow-right', 18) + '</div>' +
        '</div></a>';
    });

    var upcoming = map(all, function (d, i) {
      if (d.ready) return '';
      return '<li><span class="num">' + num(i) + '</span><span class="dot"></span>' +
        '<span class="name">' + esc(d.name) + '</span><span class="soon">Em breve</span></li>';
    });

    return '<main class="home" data-screen-label="Início">' +
      '<header class="home-head" data-reveal>' +
        '<div class="rule"></div>' +
        '<div class="eyebrow">' + esc(D.trip.eyebrow) + '</div>' +
        '<h1 class="home-title">' + esc(D.trip.title) + '</h1>' +
        '<p class="home-sub">' + esc(D.trip.subtitle) + '</p>' +
        '<div class="home-meta"><span>' + esc(meta) + '</span>' +
          '<span class="offline-pill" data-offline' + (navigator.onLine ? ' hidden' : '') + '>' + icon('wifi-off', 12) + 'Offline · conteúdo salvo</span>' +
        '</div>' +
      '</header>' +
      featured +
      (upcoming ? '<section class="upcoming" data-reveal><div class="eyebrow">Próximas etapas</div><ol>' + upcoming + '</ol></section>' : '') +
      (BUILD ? '<p class="build">Versão ' + esc(BUILD.version) + ' · ' + esc(BUILD.date) + '</p>' : '') +
    '</main>';
  }

  /* ---------- DESTINO ---------- */

  function renderIntro(b) {
    return '<section class="intro" data-reveal><div class="eyebrow">Introdução</div>' +
      (b.lead ? '<p class="lead">' + esc(b.lead) + '</p>' : '') +
      (b.body ? '<p class="body-text">' + esc(b.body) + '</p>' : '') +
    '</section>';
  }

  function photoBlock(ph, destId) {
    return '<button class="photo-block" type="button" data-photo data-caption="' + esc(ph.caption) + '" aria-label="Ampliar: ' + esc(ph.caption) + '">' +
      photo(destId, ph.foto, ph.caption, '3:2', 'wide') + '<span class="photo-shade"></span>' +
      (ph.caption ? '<span class="photo-cap">' + esc(ph.caption) + '</span>' : '') + '</button>';
  }

  function renderGroup(b, destId) {
    var places = list(b.places);
    var keys = places.map(function (p) { return placeKey(destId, p); }).filter(Boolean);
    var pr = b.practical;

    var rows = map(places, function (p) {
      var key = placeKey(destId, p);
      return '<div class="row' + (visited[key] ? ' is-visited' : '') + '"><div class="row-main">' +
          '<div class="row-title"><span class="row-name">' + esc(p.name) + '</span>' +
            map(p.chips, function (c) { return chip(c, ' chip--sm'); }) + visitedTag(key) + '</div>' +
          (p.desc ? '<span class="row-desc">' + esc(p.desc) + '</span>' : '') +
        '</div><div class="row-actions">' + actions(p.maps, p.instagram) + checkBtn(key) + '</div></div>';
    });

    return '<section class="section"' + (b.id ? ' id="' + esc(b.id) + '"' : '') + ' data-reveal>' +
      '<div class="section-head"><div>' +
        (b.eyebrow ? '<div class="eyebrow">' + esc(b.eyebrow) + '</div>' : '') +
        '<h2 class="h2">' + esc(b.title) + '</h2></div>' +
        (keys.length > 1 ? progressSpan(keys, b.id || b.title) : '') +
      '</div>' +
      (b.photo ? photoBlock(b.photo, destId) : '') +
      (b.feature ? '<div class="feature-num"><span class="v">' + esc(b.feature.value) + '</span><span class="eyebrow">' + esc(b.feature.label) + '</span></div>' : '') +
      (list(b.paragraphs).length ? '<div class="paras">' + map(b.paragraphs, function (p) { return '<p class="body-text">' + esc(p) + '</p>'; }) + '</div>' : '') +
      (pr ? '<div class="card practical"><span class="tile">' + icon('shopping-cart', 18) + '</span>' +
        '<div class="stack-2"><span class="label-sm">' + esc(pr.label) + '</span><span class="name">' + esc(pr.name) + '</span></div>' +
        actions(pr.maps, pr.instagram) + '</div>' : '') +
      (places.length ? '<div class="places">' + (b.placesLabel ? '<div class="eyebrow">' + esc(b.placesLabel) + '</div>' : '') + rows + '</div>' : '') +
    '</section>';
  }

  function factsHtml(facts) {
    return map(facts, function (f) { return '<span class="fact">' + (f.icon ? icon(f.icon) : '') + esc(f.t) + '</span>'; });
  }

  function renderEntry(b) {
    return '<section class="section" data-reveal>' +
      '<div class="section-head"><div>' +
        (b.eyebrow ? '<div class="eyebrow">' + esc(b.eyebrow) + '</div>' : '') +
        '<h2 class="h2">' + esc(b.title) + '</h2></div></div>' +
      '<div class="card entry">' +
        '<div class="entry-main"><span class="tile">' + icon('log-in', 18) + '</span>' +
          '<div class="stack-2"><span class="label-sm">Entrada planejada</span><span class="entry-name">' + esc(b.entrance) + '</span></div>' +
          actions(b.maps, b.instagram) + '</div>' +
        (list(b.facts).length ? '<div class="facts">' + factsHtml(b.facts) + '</div>' : '') +
        (b.pass ? '<span class="pass">' + icon('check-circle-2', 14) + esc(b.pass) + '</span>' : '') +
      '</div>' +
    '</section>';
  }

  function renderSpots(b, destId) {
    var spots = list(b.spots);
    var keys = spots.map(function (s) { return placeKey(destId, s); }).filter(Boolean);
    var rows = map(spots, function (s) {
      var key = placeKey(destId, s);
      return '<div class="row' + (visited[key] ? ' is-visited' : '') + '"><div class="row-main">' +
          '<div class="row-title"><span class="row-name">' + esc(s.name) + '</span>' + visitedTag(key) + '</div>' +
          (list(s.chips).length ? '<div class="chips">' + map(s.chips, function (c) { return chip(c); }) + '</div>' : '') +
          (s.note ? '<span class="row-desc">' + esc(s.note) + '</span>' : '') +
        '</div><div class="row-actions">' + actions(s.maps, s.instagram) + checkBtn(key) + '</div></div>';
    });

    // Cards com foto para os spots que têm "photo": destaque no topo (acento/ok), demais chips como legenda.
    var reel = map(spots.filter(function (s) { return s.photo; }), function (s) {
      var chips = list(s.chips);
      var top = chips.filter(function (c) { return c.tone === 'accent' || c.tone === 'ok'; })[0];
      var meta = chips.filter(function (c) { return c !== top; }).map(function (c) { return esc(c.t); }).join(' · ');
      return '<button class="reel-card" type="button" data-photo data-caption="' + esc(s.name) + '" aria-label="Ampliar: ' + esc(s.name) + '">' +
        photo(destId, s.photo, s.name, '4:5', 'card') + '<span class="photo-shade"></span>' +
        '<span class="reel-top">' + (top ? chip(top) : '') + visitedTag(placeKey(destId, s)) + '</span>' +
        '<span class="reel-body"><span class="reel-name">' + esc(s.name) + '</span>' +
          (meta ? '<span class="reel-meta">' + meta + '</span>' : '') + '</span></button>';
    });

    return '<section class="section spots"' + (b.id ? ' id="' + esc(b.id) + '"' : '') + ' data-reveal>' +
      '<div class="section-head"><div>' +
        (b.eyebrow ? '<div class="eyebrow">' + esc(b.eyebrow) + '</div>' : '') +
        '<h2 class="h2">' + esc(b.title) + '</h2></div>' +
        (keys.length ? progressSpan(keys, b.id || b.title) : '') +
      '</div>' +
      (reel ? '<div class="reel">' + reel + '</div>' : '') +
      (list(b.light).length ? '<div class="card light">' + map(b.light, function (l) {
        return '<div><span class="label-sm">' + icon(l.icon) + esc(l.label) + '</span><span class="place">' + esc(l.place) + '</span></div>';
      }) + '</div>' : '') +
      '<div>' + rows + '</div>' +
    '</section>';
  }

  function renderPlan(p) {
    var shower = Math.max(0, Math.min(5, p.shower || 0));
    var dots = '';
    for (var i = 0; i < 5; i++) dots += '<span' + (i < shower ? ' class="on"' : '') + '></span>';

    var sites = map(p.sites, function (s) {
      return '<div class="site"><div class="site-main">' +
          '<span class="site-name">' + esc(s.name) + '</span>' +
          '<div class="chips">' +
            map(s.chips, function (c) { return chip({ t: c.t, tone: c.tone || 'warn', icon: c.icon || 'clock' }); }) +
            map(s.facts, function (f) { return '<span class="site-fact">' + esc(f.t) + '</span>'; }) +
          '</div>' +
          (list(s.lacks).length ? '<span class="site-lacks">' + esc(s.lacks.join(' · ')) + '</span>' : '') +
        '</div>' + actions(s.maps, s.instagram) + '</div>';
    });

    return '<div class="card plan' + (p.featured ? ' plan--featured' : '') + '" data-reveal>' +
      '<div class="plan-head"><span class="eyebrow">Plano ' + esc(p.letter) + '</span>' +
        (p.tag ? '<span class="plan-tag">' + icon('star', 12) + esc(p.tag) + '</span>' : '') + '</div>' +
      '<div class="plan-name">' + esc(p.name) + '</div>' +
      '<div class="shower" aria-label="Banho: ' + shower + ' de 5"><span class="shower-label">' + icon('shower-head') + 'Banho</span>' +
        '<div class="shower-dots">' + dots + '</div><span class="shower-val">' + shower + '/5</span></div>' +
      (list(p.facts).length ? '<div class="facts">' + factsHtml(p.facts) + '</div>' : '') +
      (list(p.amenities).length ? '<div class="pills">' + map(p.amenities, function (a) { return '<span class="pill pill--has">' + icon('check', 14) + esc(a) + '</span>'; }) + '</div>' : '') +
      (list(p.lacks).length ? '<div class="pills">' + map(p.lacks, function (a) { return '<span class="pill pill--lacks">' + icon('x', 14) + esc(a) + '</span>'; }) + '</div>' : '') +
      (sites ? '<div class="sites">' + sites + '</div>' : '') +
      (p.note ? '<div class="plan-note">' + icon('info') + '<span>' + esc(p.note) + '</span></div>' : '') +
      ('maps' in p || 'instagram' in p ? '<div class="plan-foot">' + actions(p.maps, p.instagram) + '</div>' : '') +
    '</div>';
  }

  function renderLodging(b) {
    return '<section class="section" id="hospedagem" data-reveal>' +
      '<div class="section-head"><div>' +
        (b.eyebrow ? '<div class="eyebrow">' + esc(b.eyebrow) + '</div>' : '') +
        '<h2 class="h2">' + esc(b.title) + '</h2></div></div>' +
      map(b.plans, renderPlan) +
    '</section>';
  }

  // Inspirações de Foto: componente pronto; só aparece quando há itens reais.
  function renderInspirations(b, destId) {
    var items = list(b.items);
    if (!items.length) return '';
    return '<section class="section" data-reveal>' +
      '<div class="section-head"><div><div class="eyebrow">Fotos</div><h2 class="h2">' + esc(b.title || 'Inspirações de Foto') + '</h2></div>' +
        '<span class="progress">' + (items.length === 1 ? '1 foto' : items.length + ' fotos') + '</span></div>' +
      '<div class="insp-track">' + map(items, function (it, i) {
        return '<figure><div class="insp-img">' + photo(destId, it.image, it.caption, '4:5', 'card', ' loading="lazy"') +
            '<span class="label-sm">' + num(i) + '</span></div>' +
          '<figcaption><span class="insp-caption">' + esc(it.caption) + '</span>' +
            (it.location ? '<span class="insp-loc">' + icon('map-pin', 14) + esc(it.location) + '</span>' : '') +
            (it.howTo ? '<div class="card insp-how"><span class="label-sm">' + icon('camera', 14) + 'Como reproduzir</span><span>' + esc(it.howTo) + '</span></div>' : '') +
          '</figcaption></figure>';
      }) + '</div>' +
    '</section>';
  }

  function renderVideo(v, destId) {
    if (!v || !v.title) return '';
    var u = url(v.url);
    var inner =
      '<div class="video-thumb">' + photo(destId, v.thumb, '', '16:9', 'wide') +
        '<span class="video-play">' + icon('play', 20) + '</span>' +
        '<span class="eyebrow">Vídeo de referência</span></div>' +
      '<div class="video-body"><div class="video-title">' + esc(v.title) + '</div>' +
        (u ? '<span class="video-link">' + icon('youtube') + 'Abrir no YouTube' + icon('arrow-up-right', 14) + '</span>' : '') +
      '</div>';
    return u
      ? '<a class="card video" href="' + esc(u) + '" target="_blank" rel="noopener noreferrer" data-reveal>' + inner + '</a>'
      : '<div class="card video" data-reveal>' + inner + '</div>';
  }

  function renderDest(dest) {
    var all = D.destinations, idx = all.indexOf(dest), next = all[idx + 1];
    var gallery = list(dest.gallery);
    var weather = list(dest.weather);

    var blocks = map(dest.blocks, function (b) {
      switch (b.type) {
        case 'intro': return renderIntro(b);
        case 'group': return renderGroup(b, dest.id);
        case 'entry': return renderEntry(b);
        case 'spots': return renderSpots(b, dest.id);
        case 'lodging': return renderLodging(b);
        case 'inspirations': return renderInspirations(b, dest.id);
        default: return '';
      }
    });

    return '<article class="dest" data-screen-label="Destino">' +
      '<div class="topbar" id="topbar"><div class="topbar-row">' +
        '<a class="topbar-back" href="#/" aria-label="Voltar ao início">' + icon('arrow-left', 18) + '</a>' +
        '<span class="topbar-name">' + esc(dest.name) + '</span>' +
        '<span class="topbar-places">· ' + esc(dest.places) + '</span>' +
      '</div></div>' +

      '<header class="hero">' +
        photo(dest.id, dest.hero, dest.name, '3:4', 'full') +
        '<div class="hero-shade"></div>' +
        '<a class="hero-back glass-chip" href="#/" aria-label="Voltar ao início">' + icon('arrow-left', 18) + 'Início</a>' +
        '<div class="hero-body" data-reveal>' +
          '<div class="hero-stage"><div class="rule"></div><span class="eyebrow eyebrow--light">Etapa ' + num(idx) + '</span></div>' +
          '<h1 class="hero-title"><span class="n">' + esc(dest.name) + '</span>' +
            (dest.places ? '<span class="p">· ' + esc(dest.places) + '</span>' : '') + '</h1>' +
          '<div class="meta-row">' +
            (dest.distance ? '<span class="glass-chip">' + icon('route', 14) + esc(dest.distance) + '</span>' : '') +
            (dest.drive ? '<span class="glass-chip">' + icon('car', 14) + esc(dest.drive) + '</span>' : '') +
          '</div>' +
        '</div>' +
      '</header>' +

      '<div class="content">' +
        (gallery.length ? '<div class="gallery" data-reveal>' + map(gallery, function (g, i) {
          return '<figure><button class="gallery-btn" type="button" data-photo data-caption="' + esc(g.caption) + '" aria-label="Ampliar: ' + esc(g.caption) + '">' +
            photo(dest.id, g.foto, g.caption, '4:5', 'thumb') + '</button>' +
            '<figcaption>' + esc(g.caption) + '</figcaption></figure>';
        }) + '</div>' : '') +

        (weather.length ? '<section class="card weather" aria-label="Temperatura estimada" data-reveal>' +
          '<div class="eyebrow">Temperatura estimada</div><div class="weather-days">' +
          map(weather, function (w) {
            return '<div class="weather-day"><span class="d">' + esc(w.date) + '</span>' + icon(w.icon, 22) +
              '<span class="t"><span class="hi">' + esc(w.hi) + '</span><span class="lo"> / ' + esc(w.lo) + '</span></span>' +
              '<span class="l">' + esc(w.label) + '</span></div>';
          }) + '</div></section>' : '') +

        renderVideo(dest.video, dest.id) +
        blocks +

        '<footer class="foot" data-reveal>' +
          (next ? '<div class="card next"><div><span class="eyebrow">Próxima etapa · ' + num(idx + 1) + '</span>' +
            '<span class="n">' + esc(next.name) + '</span></div>' +
            (next.ready ? '' : '<span class="soon">Em breve</span>') + '</div>' : '') +
          (next && next.ready
            ? '<a class="btn-primary" href="#/' + esc(next.id) + '">Abrir ' + esc(next.name) + icon('arrow-right', 18) + '</a>'
            : '') +
          '<a class="btn-primary" href="#/">' + icon('arrow-left', 18) + 'Voltar ao início</a>' +
        '</footer>' +
      '</div>' +

      '<div class="lightbox" id="lightbox" hidden>' +
        '<button class="lightbox-close" type="button" aria-label="Fechar">' + icon('x', 18) + '</button>' +
        '<img alt=""><div class="lightbox-cap"></div>' +
      '</div>' +
    '</article>';
  }

  /* ---------- rotas e comportamento ---------- */

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ?slots=1 mostra o nome do arquivo e o formato de cada espaço de foto.
  if (/[?&]slots=1\b/.test(location.search)) document.documentElement.classList.add('show-slots');

  function route() {
    var id = location.hash.replace(/^#\/?/, '');
    var dest = D.destinations.filter(function (d) { return d.id === id && d.ready; })[0] || null;
    root.innerHTML = dest ? renderDest(dest) : renderHome();
    document.title = dest ? dest.name + ' · Road Trip' : 'Road Trip';
    window.scrollTo(0, 0);
    onScroll();
    if (!reduceMotion && root.firstElementChild) root.firstElementChild.classList.add('route-in');
    watchImages();
    syncBars();
    observeReveal();
  }

  function syncBars() {
    requestAnimationFrame(function () {
      root.querySelectorAll('.progress-wrap[data-keys]').forEach(function (w) {
        var keys = w.getAttribute('data-keys').split(' ');
        w.querySelector('.progress').textContent = progressText(keys);
        w.querySelector('.progress-bar > i').style.transform = 'scaleX(' + (keys.length ? doneCount(keys) / keys.length : 0) + ')';
      });
    });
  }

  // Esqueleto só enquanto uma foto local está de fato carregando.
  function watchImages() {
    root.querySelectorAll('img.cover').forEach(function (img) {
      if (img.complete) return;
      var holder = img.parentNode;
      holder.classList.add('is-loading');
      var done = function () { holder.classList.remove('is-loading'); };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

  function observeReveal() {
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('reveal-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px 40px 0px' });
    root.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  function onScroll() {
    var bar = document.getElementById('topbar');
    if (bar) bar.classList.toggle('is-on', window.scrollY > 320);
  }

  function toggleVisited(btn) {
    var key = btn.getAttribute('data-visit');
    visited[key] = !visited[key];
    saveVisited();
    var on = visited[key];
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Desmarcar visitado' : 'Marcar como visitado');
    var row = btn.closest('.row');
    if (row) row.classList.toggle('is-visited', on);
    root.querySelectorAll('[data-tag="' + key + '"]').forEach(function (t) { t.hidden = !on; });
    syncBars();
    btn.classList.remove('just-checked');
    if (on && !reduceMotion) { void btn.offsetWidth; btn.classList.add('just-checked'); }
    if (on && navigator.vibrate) navigator.vibrate(8);
  }

  function openLightbox(el) {
    var img = el.querySelector('img.cover');
    // Só abre quando a foto local existe e carregou.
    if (!img || !img.complete || !img.naturalWidth) return;
    var cap = el.getAttribute('data-caption') || '';
    var lb = document.getElementById('lightbox');
    lb.querySelector('img').src = img.getAttribute('data-full') || img.currentSrc || img.getAttribute('src');
    lb.querySelector('img').alt = cap;
    lb.querySelector('.lightbox-cap').textContent = cap;
    lb.hidden = false;
  }
  function closeLightbox() {
    var lb = document.getElementById('lightbox');
    if (lb) lb.hidden = true;
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-visit], [data-photo], #lightbox, [aria-disabled="true"]');
    if (!t) return;
    if (t.hasAttribute('aria-disabled')) { e.preventDefault(); return; }
    if (t.hasAttribute('data-visit')) toggleVisited(t);
    else if (t.hasAttribute('data-photo')) openLightbox(t);
    else if (t.id === 'lightbox') closeLightbox();
  });
  root.addEventListener('animationend', function (e) {
    if (e.animationName === 'check-ring') e.target.classList.remove('just-checked');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', onScroll, { passive: true });
  function onNet() {
    var pill = root.querySelector('[data-offline]');
    if (pill) pill.hidden = navigator.onLine;
  }
  window.addEventListener('online', onNet);
  window.addEventListener('offline', onNet);

  route();

  // Offline + atualização. No iPhone, o app da Tela de Início costuma voltar de onde parou sem recarregar;
  // por isso procura versão nova ao abrir e sempre que volta para a frente, e avisa quando ela está pronta.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      var check = function () { reg.update().catch(function () {}); };
      check();
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') check(); });
    }).catch(function () {});
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (hadController) showUpdate();
      hadController = true;
    });
  }

  function showUpdate() {
    if (document.getElementById('update')) return;
    var el = document.createElement('div');
    el.id = 'update';
    el.className = 'update glass-chip';
    el.setAttribute('role', 'status');
    el.innerHTML = '<span>Nova versão do guia</span><button type="button" class="update-btn">Atualizar</button>';
    el.querySelector('button').addEventListener('click', function () { location.reload(); });
    document.body.appendChild(el);
  }
})();
