// 효니 홈페이지 «서가»: 원고(data/home.json)·블로그(data/blog.json)는 이 레포에서, 책장 책·서평은 책장 앱의 공개 자료에서 읽는다.
// 책장 공개 자료는 책장 앱의 tools/publish.js가 만든 것이라 이미 공개된 것만 들어 있다.
'use strict';

// 시안 미리보기(?look=a|b|c) — 효니가 고르면 이 줄은 빼고 고른 시안만 남긴다
const LOOK = new URLSearchParams(location.search).get('look');
if (/^[abc]$/.test(LOOK || '')) document.documentElement.dataset.look = LOOK;

const SHELF = 'https://hyonnie-t.github.io/bookshelf/';
const SHELF_DATA = SHELF + 'data/';
const SPINES_MAX = 44; // 실물 책등은 얇아서(대부분 14~19px) PC 선반 한 줄을 채우려면 40권 넘게 꽂아야 한다
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

const card = (a) => el('li', null, ext(el('a', { href: a.u },
  a.img === false ? null : el('div', { className: 'thumb' }, el('img', { src: a.u + 'og-cover.jpg', alt: '', loading: 'lazy', decoding: 'async', width: 1200, height: 630,
    onerror() { this.closest('.thumb').remove(); } })), // 그림을 못 받으면 빈 상자도 같이 뺀다
  el('span', { className: 'card-t', textContent: a.t }),
  el('span', { className: 'card-x', textContent: a.x }))));

function renderHome(h) {
  $('hero-name').textContent = h.name;
  $('role').textContent = '· ' + h.role;
  $('lead').textContent = h.lead;
  $('about-text').replaceChildren(...h.about.map((p) => el('p', { textContent: p })));
  $('links').replaceChildren(...h.links.map((l) => el('li', null,
    ext(el('a', { href: l.url }, icon(l.key), el('b', { textContent: l.label }), el('span', { textContent: l.sub }))))));

  // 수업 웹앱: 원고에 적힌 순서대로 학년(g)별로 묶는다
  const groups = new Map();
  h.apps.forEach((a) => { if (!groups.has(a.g)) groups.set(a.g, []); groups.get(a.g).push(a); });
  $('apps-n').textContent = `${h.apps.length}개`;
  $('apps-note').textContent = h.appsNote || '';
  $('app-groups').replaceChildren(...[...groups].map(([g, list], i) => {
    const hid = `apps-g${i}`;
    return el('div', { className: 'group', role: 'group' },
      el('h3', { id: hid }, g, ' ', el('span', { textContent: `${list.length}개` })),
      el('ul', { className: 'apps' }, list.map(card)));
  }));
  [...$('app-groups').children].forEach((g, i) => g.setAttribute('aria-labelledby', `apps-g${i}`));
  // 묶음마다 첫 앱은 대표(lead), 전체 첫 앱은 hero — 그림 크기·배치는 css가 정한다
  document.querySelectorAll('#app-groups .apps').forEach((ul, i) => {
    const f = ul.firstElementChild;
    if (f) { f.classList.add('lead'); if (i === 0) f.classList.add('hero'); }
  });
  $('guide-list').replaceChildren(...h.guides.map(card));
  $('acts').replaceChildren(...h.reading.map((r) => el('li', null,
    el('span', { className: 'g', textContent: r.g }), el('h3', { textContent: r.t }), el('p', { textContent: r.x }))));
  rise([...document.querySelectorAll('#app-groups .apps > li'), ...$('acts').children, ...$('guide-list').children]);
}

function renderBlog(b) {
  const posts = (b.posts || []).slice(0, POSTS_MAX);
  $('posts').replaceChildren(...posts.map((p) => el('li', null, ext(el('a', { href: p.u },
    el('span', { className: 'item-d', textContent: dateKo(p.d) }),
    el('span', { className: 'item-t', textContent: p.t }),
    p.x ? el('span', { className: 'item-x', textContent: p.x }) : null)))));
  rise([...$('posts').children]);
}

// 선반이 화면보다 넓으면(폰·태블릿) «옆으로 넘겨 보기» 안내를 보인다
function watchSwipe(shelf, hint) {
  const check = () => { hint.hidden = shelf.scrollWidth <= shelf.clientWidth + 1; };
  check();
  if ('ResizeObserver' in window) new ResizeObserver(check).observe(shelf);
  else addEventListener('resize', check);
}

// 실물 책등(책장 앱 js/app.js realOf와 같은 규칙, 2026-11-14 효니 요청 «대표 홈페이지도 예스24 책등으로»):
// y24.json의 y[id]=[예스24 상품 번호, 책등 그림 가로/세로, 실물 키 mm(모르면 0)]. 주인이 고른 판은 공개본 책의 y24(배열=그 판, 0=색 책등).
// 그림은 저장하지 않고 볼 때 예스24에서 불러온다. 못 찾았거나 못 받은 책은 색 책등(spines.json)
const Y24_IMG = (no) => `https://image.yes24.com/goods/${no}/SIDE/${(window.devicePixelRatio || 1) > 2 ? 'XL' : 'L'}`;
const notSpine = (img) => { const r = img.naturalWidth / img.naturalHeight; return !(r >= 0.02 && r <= 0.35); }; // «이미지 없음» 그림 거르기
function realOf(b, y24) {
  const base = y24[b.id];
  if (Array.isArray(b.y24)) {
    const [no, r] = b.y24;
    return /^\d+$/.test(String(no)) && r > 0 ? { no: String(no), r: +r, mh: base && String(base[0]) === String(no) ? +base[2] || 0 : 0 } : null;
  }
  if (b.y24 === 0) return null;
  return base && /^\d+$/.test(String(base[0])) && base[1] > 0 ? { no: String(base[0]), r: +base[1], mh: +base[2] || 0 } : null;
}
// 키: 실물 265mm 이상이면 선반 끝(폰 192px, 큰 화면은 css가 4/3배), 모르면 210mm
const realH = (mh) => Math.max(120, Math.min(192, Math.round((mh || 210) * 192 / 265)));
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.codePointAt(0)) | 0, 7);
// 색 책등도 실물처럼: 키는 책마다 195~240mm, 두께는 키의 6~12%
const thinOf = (id) => ({ mh: 195 + Math.abs(hash('mh' + id)) % 46, r: 0.06 + (Math.abs(hash('thick' + id)) % 7) * 0.01 });

function addRealImg(a, real, onReal) {
  const img = el('img', { className: 'real-img', alt: '', decoding: 'async' });
  img.referrerPolicy = 'no-referrer';
  const back = () => { // 못 받으면 색 책등의 키·두께로
    const t = thinOf(a.dataset.id);
    img.remove(); a.classList.remove('real');
    a.style.setProperty('--h', `${realH(t.mh)}px`); a.style.setProperty('--r', t.r);
  };
  img.onerror = back;
  img.onload = () => { if (notSpine(img)) return back(); a.classList.add('real-on'); onReal(); };
  img.src = Y24_IMG(real.no);
  a.classList.add('real');
  a.append(img);
}

// 책등: 읽는 중인 책 + 다 읽은 날(fd)이 최근인 책
function renderShelf(pub, spines, y24) {
  const books = (pub.books || []).filter((b) => (b.k || 'book') === 'book' && b.t);
  const reading = books.filter((b) => b.st === 'reading').slice(0, 4);
  const done = books.filter((b) => b.fd && b.st !== 'reading').sort((a, b) => String(b.fd).localeCompare(String(a.fd)));
  const pick = [...reading, ...done].slice(0, SPINES_MAX);
  const shelf = $('shelf');
  const credit = ext(el('a', { className: 'y24-credit', href: 'https://www.yes24.com/', textContent: '책등 사진: 예스24', hidden: true })); // 예스24 이용약관 제6조 출처 표기
  shelf.replaceChildren(...pick.map((b) => {
    const c = spines[b.id];
    const real = realOf(b, y24);
    const thin = thinOf(b.id);
    const a = ext(el('a', { className: 'spine' + (b.st === 'reading' ? ' reading' : ''), href: `${SHELF}#book/${encodeURIComponent(b.id)}`,
      title: `${b.t}${b.a ? ' · ' + b.a : ''}` }, el('span', { textContent: b.t })));
    a.dataset.id = b.id;
    a.setAttribute('aria-label', `${b.t}${b.st === 'reading' ? ' (읽는 중)' : ''} — 책장에서 열기`);
    a.style.setProperty('--h', `${realH(real ? real.mh : thin.mh)}px`);
    a.style.setProperty('--r', real ? real.r : thin.r);
    if (c) { a.style.setProperty('--sb', c[0]); a.style.setProperty('--sf', c[1]); if (c[2]) a.style.setProperty('--sa', c[2]); }
    if (real) addRealImg(a, real, () => { credit.hidden = false; });
    return a;
  }));
  shelf.removeAttribute('aria-busy');

  $('count-n').textContent = books.length.toLocaleString('ko-KR');
  $('count').hidden = false;
  const hint = el('span', { className: 'swipe', textContent: '선반을 옆으로 넘기면 책이 더 있어요.' });
  $('shelf-note').replaceChildren(
    reading.length ? el('span', { className: 'legend', textContent: '위에 책갈피가 꽂힌 책은 지금 읽는 중' }) : null,
    el('span', { textContent: '책등을 누르면 책장에서 그 책이 열려요.' }),
    hint, credit);
  watchSwipe(shelf, hint);

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
  $('shelf-note').textContent = '책장을 지금 불러오지 못했어요.';
  $('shelf').replaceChildren(el('p', { className: 'wait' }, ext(el('a', { href: SHELF, textContent: '책장에서 직접 보기' }))));
  $('shelf').removeAttribute('aria-busy');
  reviewsEmpty();
}

getJSON('data/home.json').then(renderHome).catch((e) => console.error(e));
getJSON('data/blog.json').then(renderBlog).catch((e) => console.error(e));
Promise.all([
  getJSON(SHELF_DATA + 'public.json'),
  getJSON(SHELF_DATA + 'spines.json').then((x) => x.c || {}).catch(() => ({})),
  getJSON(SHELF_DATA + 'y24.json').then((x) => x.y || {}).catch(() => ({})), // 없으면 모두 색 책등
]).then(([pub, spines, y24]) => renderShelf(pub, spines, y24))
  .catch((e) => { console.error(e); shelfFailed(); });
