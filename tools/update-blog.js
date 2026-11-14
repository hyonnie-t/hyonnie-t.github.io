// 티스토리 RSS(https://0hyonnie.tistory.com/rss)를 읽어 data/blog.json에 최근 글을 적는다.
// 브라우저에서 RSS를 바로 못 읽어서(CORS 막힘) 이 스크립트로 받아 둔다. 실행: node tools/update-blog.js
// 공개 글의 제목·주소·날짜·분류·앞부분 90자만 옮긴다.
const fs = require('fs');
const path = require('path');

const RSS = 'https://0hyonnie.tistory.com/rss';
const KEEP = 8;
const SKIP_CATEGORIES = ['척척석사가 되는 길']; // 대학원 이야기는 홈페이지에 안 싣는다(2026-11-14 계획)

const pick = (xml, tag) => {
  const m = xml.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>'));
  return m ? m[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').trim() : '';
};
// RSS 본문은 HTML이 한 번 더 감싸여 있어(&lt;p&gt;) 먼저 풀고 태그를 지운 뒤 한 번 더 푼다
const plain = (html) => decode(decode(html).replace(/<[^>]+>/g, ' ')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const decode = (s) => s
  .replace(/&amp;/g, '&') // 티스토리 제목은 두 번 감싼 경우가 있어(&amp;mdash;) &amp;를 먼저 푼다
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&middot;/g, '·').replace(/&hellip;/g, '…')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/\s+/g, ' ').trim();
const iso = (s) => { const d = new Date(s); return isNaN(d) ? '' : d.toISOString().slice(0, 10); };

(async () => {
  const res = await fetch(RSS);
  if (!res.ok) throw new Error('RSS ' + res.status);
  const xml = await res.text();
  const items = xml.split('<item>').slice(1).map((it) => {
    const body = plain(pick(it, 'description'));
    return {
      t: plain(pick(it, 'title')),
      u: pick(it, 'link'),
      d: iso(pick(it, 'pubDate')),
      c: plain(pick(it, 'category')),
      x: body.length > 90 ? body.slice(0, 90) + '…' : body,
    };
  }).filter((p) => p.t && /^https:\/\/0hyonnie\.tistory\.com\//.test(p.u))
    .filter((p) => p.c && !SKIP_CATEGORIES.includes(p.c)); // 분류 없는 글(블로그 소개 등)과 대학원 분류는 홈페이지에 안 싣는다
  if (!items.length) throw new Error('RSS에서 글을 하나도 못 읽음 — blog.json을 덮어쓰지 않음');
  items.sort((a, b) => b.d.localeCompare(a.d));
  // 분류 이름은 거르는 데만 쓰고 공개 파일에는 남기지 않는다
  const out = { at: new Date().toISOString().slice(0, 10), posts: items.slice(0, KEEP).map(({ c, ...p }) => p) };
  const file = path.join(__dirname, '..', 'data', 'blog.json');
  let old = null;
  try { old = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { /* 처음이면 없음 */ }
  if (old && JSON.stringify(old.posts) === JSON.stringify(out.posts)) {
    console.log('blog.json: 바뀐 글 없음 (' + out.posts.length + '개 그대로)');
    return; // 날짜만 바뀐 커밋을 만들지 않게 파일을 그대로 둔다
  }
  const before = new Set(((old && old.posts) || []).map((p) => p.u));
  console.log('새 글 ' + out.posts.filter((p) => !before.has(p.u)).length + '개');
  fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
  console.log('blog.json: ' + out.posts.length + '개 (' + (out.posts[0] || {}).d + ' 최신)');
})().catch((e) => { console.error(e.message); process.exit(1); });
