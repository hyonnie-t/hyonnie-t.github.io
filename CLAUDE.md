# hyonnie-t.github.io — 효니 대표 홈페이지

> 이 레포는 공개이고 Pages가 이 파일도 그대로 내보낸다(https://hyonnie-t.github.io/CLAUDE.md). 여기와 TODO.md에는 공개해도 되는 내용만 적는다. 일정·사람 이름·학교 이름·내부 자료 위치는 적지 않는다.

## 무엇인지
일반인이 보는 효니(중학교 역사 교사) 소개 페이지. 주소 https://hyonnie-t.github.io/ (GitHub Pages 사용자 사이트, main 브랜치 루트). 2026-11-14 만듦.

## 지우면 안 되는 것
- `.well-known/assetlinks.json` — 책장 안드로이드 앱(TWA)의 주소창 숨김 인증. 지우거나 옮기면 그 앱에 주소창이 다시 생긴다.
- `.nojekyll` — `.well-known` 폴더를 Pages가 내보내게 함.
- 서비스워커를 두지 않는다. 루트(`/`)의 서비스워커는 같은 주소 아래 다른 앱(`/bookshelf/` 등)까지 가로챌 수 있다.

## 구조
- `index.html` / `css/style.css` / `js/home.js` / `favicon.svg`
- `data/home.json` — 원고(소개·링크·수업 웹앱·독서교육 활동·안내). 글은 여기만 고치면 된다.
- `data/blog.json` — 블로그 최근 글. `node tools/update-blog.js`로 RSS에서 다시 받는다(브라우저에서 RSS를 바로 못 읽음). 대학원 분류 글은 뺀다(`SKIP_CATEGORIES`).
- 책장 책·서평은 책장 앱의 공개 자료(`/bookshelf/data/public.json`, `spines.json`, `y24.json`)를 실행할 때 읽는다. 복사하지 않는다. 책장 자료 모양이 바뀌면 `js/home.js`의 `renderShelf`·`realOf`를 같이 고친다.
- 첫 화면은 «서가»(2026-11-14): 한 줄 소개 + 책장 권수, 선반에 읽는 중 + 최근 다 읽은 책 44권. 책등은 책장 앱과 같은 규칙의 예스24 실물 책등 사진(상품 번호만 `y24.json`에, 그림은 볼 때 예스24에서 불러옴, 공개본 책의 `y24`가 우선), 못 찾거나 못 받은 책은 색 책등. 사진이 하나라도 보이면 «책등 사진: 예스24» 출처를 보인다(예스24 이용약관 제6조).
- 미리보기: `node tools/serve.js [포트]` → http://localhost:5180/
- `css/style.css`·`js/home.js`를 고치면 `index.html`의 `?v=` 판 번호도 바꾼다(Pages가 10분 캐시라 새 HTML에 옛 JS가 섞인다, 2026-11-14 배포 때 권수가 빈칸으로 보임).

## 규칙
- 싣는 것은 이미 공개된 것만: 책장 공개분, 인스타·블로그 공개 글, 공개 배포된 수업 웹앱, 공개 안내서. 이름은 «효니» + 중학교 역사 교사. 학교 이름·실명·연락처·얼굴 사진은 효니가 말한 것만.
- 학생 이름·학생 작품, 학교 업무·일정, 개인용 앱, 대학원 이야기는 싣지 않는다. 독서교육 활동을 옮길 때 학교 이름·사람 이름·예산은 뺀다.
- 간격은 8pt 토큰(`--space-1~7`)만, 움직임은 «보이는 순간 떠오르기»와 책등 꺼내기만, `prefers-reduced-motion`이면 전부 끈다. 다크 모드는 `prefers-color-scheme`.
- Baseline «널리 지원» 기능만 쓴다.
- 커밋 작성자는 `hyonnie-t`(GitHub noreply), 레포 로컬 설정. main에 올리는 것(= 공개 배포)은 효니 확인 뒤에만.
