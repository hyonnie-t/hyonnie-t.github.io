// 효니 홈페이지: 원고(data/home.json)·블로그(data/blog.json)는 이 레포에서, 책장 책·서평은 책장 앱의 공개 자료에서 읽는다.
// 책장 공개 자료는 책장 앱의 tools/publish.js가 만든 것이라 이미 공개된 것만 들어 있다.
'use strict';

const SHELF = 'https://hyonnie-t.github.io/bookshelf/';
const SHELF_DATA = SHELF + 'data/';
const SPINES_MAX = 18;
const REVIEWS_MAX = 3;
const POSTS_MAX = 4;

const $ = (id) => document.getElementById(id);
function el(tag, props, ...kids) {
  const n = Object.assign(document.createElement(tag), props || {});
  kids.flat().forEach((k) => k != null && n.append(k));
  return n;
}
const ext = (a) => { a.target = '_blank'; a.rel = 'noopener'; return a; };
const dateKo = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}. ${+m[2]}. ${+m[3]}.` : '';
};
const getJSON = (url) => fetch(url, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });

const ICONS = {
  shelf: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM16.5 5.2l3.4-.9 3.1 15.5-3.4.9z"/>',
  insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
  blog: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
};
const icon = (key) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic'); s.setAttribute('aria-hidden', 'true');
  s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linejoin', 'round');
  s.innerHTML = ICONS[key] || '';
  return s;
};

// 보이는 순간 한 번 떠오르기
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' })
  : null;
function rise(nodes) {
  if (!io) return;
  nodes.forEach((n, i) => { n.classList.add('rise'); n.style.setProperty('--d', `${Math.min(i, 6) * 0.05}s`); io.observe(n); });
}

function renderHome(h) {
  $('role').textContent = h.role;
  $('hero-name').textContent = h.name;
  $('lead').textContent = h.lead;
  $('about').replaceChildren(...h.about.map((p) => el('p', { textContent: p })));
  $('links').replaceChildren(...h.links.map((l) => el('li', null,
    ext(el('a', { href: l.url }, icon(l.key), el('b', { textContent: l.label }), el('span', { textContent: l.sub }))))));

  const card = (a) => el('li', null, ext(el('a', { href: a.u },
    a.img === false ? null : el('div', { className: 'thumb' }, el('img', { src: a.u + 'og-cover.jpg', alt: '', loading: 'lazy', decoding: 'async', width: 1200, height: 630,
      onerror() { this.closest('.thumb').remove(); } })), // 그림을 못 받으면 빈 상자도 같이 뺀다
    el('div', { className: 'card-body' }, el('span', { className: 'chip', textContent: a.g }), el('span', { className: 'card-t', textContent: a.t }), el('span', { className: 'card-x', textContent: a.x })))));
  $('apps-note').textContent = h.appsNote || '';
  $('app-list').replaceChildren(...h.apps.map(card));
  $('guide-list').replaceChildren(...h.guides.map(card));
  $('acts').replaceChildren(...h.reading.map((r) => el('li', null,
    el('h3', { textContent: r.t }), el('span', { className: 'g', textContent: r.g }), el('p', { textContent: r.x }))));
  rise([...$('app-list').children, ...$('acts').children, ...$('guide-list').children]);
}

function renderBlog(b) {
  const posts = (b.posts || []).slice(0, POSTS_MAX);
  $('posts').replaceChildren(...posts.map((p) => el('li', null, ext(el('a', { href: p.u },
    el('span', { className: 'item-d', textContent: dateKo(p.d) }),
    el('span', { className: 'item-t', textContent: p.t }),
    p.x ? el('span', { className: 'item-x', textContent: p.x }) : null)))));
  rise([...$('posts').children]);
}

// 책등: 다 읽은 날(fd)이 최근인 책 + 읽는 중인 책. 색은 책장 앱이 표지에서 뽑은 색
function renderShelf(pub, spines) {
  const books = (pub.books || []).filter((b) => (b.k || 'book') === 'book' && b.t);
  const reading = books.filter((b) => b.st === 'reading').slice(0, 4);
  const done = books.filter((b) => b.fd && b.st !== 'reading').sort((a, b) => String(b.fd).localeCompare(String(a.fd)));
  const pick = [...reading, ...done].slice(0, SPINES_MAX);
  const shelf = $('shelf');
  shelf.replaceChildren(...pick.map((b, i) => {
    const c = spines[b.id];
    const len = [...b.t].length;
    const a = ext(el('a', { className: 'spine' + (b.st === 'reading' ? ' reading' : ''), href: `${SHELF}#book/${encodeURIComponent(b.id)}`,
      textContent: b.t, title: `${b.t}${b.a ? ' · ' + b.a : ''}` }));
    a.setAttribute('aria-label', `${b.t}${b.st === 'reading' ? ' (읽는 중)' : ''} — 책장에서 열기`);
    a.style.setProperty('--w', `${len > 12 ? 48 : len > 6 ? 40 : 32}px`); // 8pt 눈금: 제목 길이로 책 두께
    a.style.setProperty('--h', `${[184, 168, 176, 192, 160][i % 5]}px`); // 8pt 눈금: 책 키를 조금씩 다르게
    if (len > 9) a.classList.add('long'); // 긴 제목은 글자를 줄여 끝까지 보이게
    if (c) { a.style.setProperty('--sb', c[0]); a.style.setProperty('--sf', c[1]); if (c[2]) a.style.setProperty('--sa', c[2]); }
    return a;
  }));
  shelf.removeAttribute('aria-busy');
  if (reading.length) shelf.after(el('p', { className: 'shelf-legend' }, el('i'), '위에 띠가 있는 책은 지금 읽는 중'));
  $('shelf-count').textContent = `책장에 꽂힌 책 ${books.length.toLocaleString('ko-KR')}권 중 최근 책이에요. 책등을 누르면 책장에서 열려요.`;

  // 최근 서평: 인스타그램에 올린 서평(티스토리 글은 tb로 시작해 뺌)
  const byId = new Map(books.map((b) => [b.id, b]));
  const moved = pub.moved || {};
  const titleOf = (id) => (byId.get(moved[id] || id) || {}).t;
  const revs = (pub.posts || []).filter((p) => p.k === 'review' && p.c && !/^tb/.test(p.c))
    .sort((a, b) => String(b.d).localeCompare(String(a.d))).slice(0, REVIEWS_MAX);
  if (!revs.length) { reviewsEmpty(); return; }
  $('reviews').replaceChildren(...revs.map((p) => {
    const t = (p.w || []).map(titleOf).filter(Boolean)[0];
    // 해시태그만 있는 줄은 건너뛰고 첫 문장 줄을 보인다
    const first = String(p.x || '').split('\n').map((s) => s.trim()).find((s) => s && !/^(#\S+\s*)+$/.test(s)) || '';
    return el('li', null, ext(el('a', { href: `https://www.instagram.com/p/${encodeURIComponent(p.c)}/` },
      el('span', { className: 'item-d', textContent: dateKo(p.d) }),
      el('span', { className: 'item-t', textContent: t ? `『${t}』` : first }),
      t && first ? el('span', { className: 'item-x', textContent: first }) : null)));
  }));
  rise([...$('reviews').children]);
}

function reviewsEmpty() {
  $('reviews').replaceChildren(el('li', { className: 'wait' }, '서평은 ',
    ext(el('a', { href: 'https://www.instagram.com/hyonnie_books/', textContent: '인스타그램 @hyonnie_books' })), '에서 볼 수 있어요.'));
}
function shelfFailed() {
  $('shelf-count').textContent = '책장을 지금 불러오지 못했어요.';
  $('shelf').replaceChildren(el('p', { className: 'wait' }, ext(el('a', { href: SHELF, textContent: '책장에서 직접 보기' }))));
  $('shelf').removeAttribute('aria-busy');
  reviewsEmpty();
}

getJSON('data/home.json').then(renderHome).catch((e) => console.error(e));
getJSON('data/blog.json').then(renderBlog).catch((e) => console.error(e));
Promise.all([getJSON(SHELF_DATA + 'public.json'), getJSON(SHELF_DATA + 'spines.json').then((x) => x.c || {}).catch(() => ({}))])
  .then(([pub, spines]) => renderShelf(pub, spines))
  .catch((e) => { console.error(e); shelfFailed(); });
