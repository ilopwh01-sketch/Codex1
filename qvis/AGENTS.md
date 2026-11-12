# Q.V.I.S 작업 규칙 (Codex는 작업 전에 이 파일을 끝까지 읽는다)

모듈 라인 현장 대형 화면용 불량 모니터. AI 없이 규칙(`js/20-rules.js`)으로 답하고, 나중에 DB와 AI를 붙인다.
**화면을 볼 수 없으므로 간격·겹침·줄바꿈은 반드시 `npm test`로 확인한다.** 테스트가 실패 0건이 될 때까지 작업은 끝난 것이 아니다.

## 1. 작업 순서 (매번)

1. 이 파일을 읽는다 → 고칠 파일을 아래 "파일 지도"에서 찾는다.
2. 고친다. 한 번에 한 가지 목적만.
3. `npm test` 를 실행한다. 실패 목록(✗)을 하나씩 고친다. 경고(△)는 이유를 확인하고 되도록 고친다.
4. 통과하면 `npm run build` 로 `dist/qvis-pc.html` 을 다시 만든다.
5. 바꾼 내용을 한국어로 짧게 정리한다: 무엇을, 왜, 어느 파일.

처음 한 번만: `npm install` 후 `npx playwright install chromium`.

## 2. 파일 지도 (번호 순서대로 읽힌다. 순서를 바꾸지 않는다)

| 파일 | 하는 일 | 자주 고치는 경우 |
|---|---|---|
| `js/00-config.js` | 자동 브리핑 순서, DB 주소, 새로고침 간격 | 설정 값 |
| `js/01-util.js` | 숫자 표기(`f1` `f2` `num`), 통계 계산(정규분포, F분포, 분산분석) | 거의 안 고침 |
| `js/02-chart-kit.js` | **그래프 간격 도구** (`chartFrame` `niceTicks` `axisLeft` `axisBottom` `spreadLabels`) | 새 그래프 |
| `js/10-data-sample.js` | 예시 데이터 `DATA` | 예시 값 |
| `js/11-data-schema.js` | `DATA` 모양 검사 `validateData` | 필드 추가 시 같이 |
| `js/20-rules.js` | 질문 의도 `QA`, 답 규칙 `RULES` | 새 질문·문구 |
| `js/40-panel.js` | 팝업 열기/닫기, 표·마인드맵·경로·시간대 그래프 | 팝업 종류 추가 |
| `js/41-panel-el.js` | EL 이미지 팝업 | EL |
| `js/42-panel-anova.js` | 설비 비교(분산분석) 팝업 | |
| `js/43-panel-stats.js` | 통계(p 관리도·파레토·비율 검정) 팝업 | |
| `js/50-app.js` | 답 보여주기, 자동 브리핑, 알림, 좌우 숫자, 시계, 전체화면 | |
| `js/51-data-source.js` | **DB 연결 자리** (`applyData`, `pullData`) | DB 붙일 때 |
| `js/60-orb.js` `61-sky.js` | 오브, 별 배경 | 건드리지 않는다 |
| `js/95-layout-check.js` | 배치 검사기 (`?check=1`) | **고치지 않는다** |
| `css/00-base.css` | 간격 단계, 줄바꿈, 배치 부품 | |
| `css/01-tokens.css` | 색 | 색 바꿀 때만 |
| `css/02~04` | 화면별 스타일. 04가 앞을 덮어쓴다 | |

- 모든 파일은 일반 `<script>`로 차례대로 읽는다. **`import`/`export`, `type="module"`, 빌드 도구, 프레임워크(React 등)를 쓰지 않는다.** 파일 더블클릭으로도 열려야 한다.
- 함수·변수는 전역이다. 새 이름이 기존 이름과 겹치지 않게 접두어를 붙인다 (예: `trendX`, 그냥 `x` 금지).
- HTML의 `id`·`class`는 JS가 찾아 쓰므로 이름을 바꾸지 않는다.

## 3. 간격 규칙 — "좁게 적당히" (숫자로 지킨다)

넓은 것보다 약간 촘촘한 것이 낫다. 아래 값 밖의 숫자를 새로 만들지 않는다. CSS는 `var(--s1)`~`var(--s6)`을 쓴다.

| 자리 | 값 |
|---|---|
| 글자와 그 아래 보조 글자 | 2~4px (`--s1`) |
| 칸(카드·타일) 안쪽 여백 | 10~14px (보통 12px, `--s3`) |
| 칸 안 요소 사이 | 8~12px (`--s2`~`--s3`) |
| 카드와 카드 사이 | 12~16px (`--s3`~`--s4`) |
| 구역(왼쪽 단 ↔ 오른쪽 단, 그래프 ↔ 표) 사이 | 24~32px (`--s5`~`--s6`) |
| 표 한 줄 높이 | 글자 크기 × 2.6~3.0 (14px 글자면 36~42px) |
| 팝업 안쪽 여백 | 26px 36px (낮은 화면 20px 28px) |

- 칸이 넓어졌다고 글자·선을 그 폭만큼 늘이지 않는다. 짧은 내용이 넓은 칸에 놓이면 칸을 두 칸으로 나누거나 최대 폭(`max-width`, 보통 420px)을 준다.
- 간격은 `margin` 대신 부모의 `gap`으로 준다 (`.stack` `.row` `.cols-2`).

### 검사기가 알려 주는 것 (`npm test`, 또는 주소 뒤 `?check=1`)

| 표시 | 항목 | 고치는 법 |
|---|---|---|
| ✗ | 글자 겹침 | 겹친 두 글자 중 하나의 위치를 `KIT.LABEL_GAP`(16) 이상 벌리거나 `spreadLabels` 사용 |
| ✗ | 그림 밖 글자 | `chartFrame`의 left/right/top/bottom 여백을 글자 폭(`textWidth`)만큼 늘림 |
| ✗ | 말줄임 잘림 · 상자 밖 글자 | 문구를 짧게. 자세한 값은 칩·툴팁으로 |
| ✗ | 한 글자 줄바꿈 | 칸 폭을 조금 넓히거나 문구를 바꿈. `keep-all` 유지 |
| ✗ | 팝업 안 스크롤 · 화면 밖 | 그래프 높이 → 여백 → 겹치는 문장 순서로 줄임 |
| △ | 두 단 불균형 (EL 팝업 제외) | 긴 단의 카드 하나를 짧은 단으로 옮김 (`p._side`) |
| △ | 표 줄 높이 · 칸 안쪽 여백 · 축 여백 과다 | 위 간격 표의 값으로 줄임 |
| △ | 글자에 비해 넓은 칸 | 칸을 두 칸으로 나누거나 `max-width` |
- 같은 종류의 칸은 같은 안쪽 여백·같은 높이 기준을 쓴다.
- 두 단 배치에서 한쪽만 길면, 긴 쪽 카드를 짧은 쪽으로 옮겨 높이를 맞춘다.

## 4. 그래프 규칙 (x축·y축·라벨)

**좌표를 손으로 계산하지 않는다.** `js/02-chart-kit.js` 를 쓴다.

```js
var t = niceTicks(0, maxValue, 4);                       // 눈금: 0, 1, 2, 3, 4
var f = chartFrame({ W: 760, H: 280, xMin: 6, xMax: 15, yMin: 0, yMax: t.max,
                     left: textWidth(t.max + '%') + KIT.TICK_PAD + 6, right: 96 });
var s = '<svg class="chart" viewBox="0 0 760 280">';
s += axisLeft(f, t.ticks, function (v) { return v + '%'; });   // y축: 오른쪽 맞춤 숫자 + 가로 격자
s += axisBottom(f, [6, 8, 10, 12, 14], function (h) { return (h < 10 ? '0' : '') + h + '시'; }); // 겹치면 자동으로 건너뜀
s += '<polyline class="today" points="' + xs.map(function (h, i) { return f.X(h) + ',' + f.Y(ys[i]); }).join(' ') + '"></polyline>';
s += spreadLabels(f, [{ y: f.Y(ucl), text: 'UCL ' + ucl.toFixed(2) + '%', cls: 'lab-u' }, { y: f.Y(avg), text: '평균 ' + avg.toFixed(2) + '%', cls: 'lab-c' }]);
s += '</svg>';
```

- y축 왼쪽 여백 = 가장 긴 눈금 글자 폭 + 10px 정도. 고정 44px로 두지 않는다.
- 오른쪽 끝 라벨(UCL, 평균, 목표)은 `spreadLabels`로 16px 이상 벌린다.
- x축 글자가 겹칠 것 같으면 `axisBottom`이 하나씩 건너뛴다. 글자를 줄이거나 기울이지 않는다.
- 눈금은 맨 위 값까지 그린다 (위쪽이 비어 보이지 않게). `niceTicks`의 `max`를 축 끝으로 쓴다.
- 그래프 글자는 `svg text`에 이미 `nowrap`. 글자 크기는 11px(viewBox 기준), 강조 값만 13~16px.

## 5. 줄바꿈 규칙

- 한글은 단어 단위(`word-break: keep-all`, 이미 body에 있음). 한 글자만 다음 줄로 넘어가면 안 된다.
- 숫자+단위는 떨어지면 안 된다: `<span class="nw">1.84%</span>`.
- 말줄임(`text-overflow: ellipsis`)은 쓰지 않는다. 칸이 좁으면 문구를 짧게 바꾼다.
- 제목은 `text-wrap: balance`. 버튼 글자는 한 줄.

## 6. 색 규칙 (4톤)

| 색 | 값 | 쓰는 곳 |
|---|---|---|
| 네이비 | `#071226` | 바탕 (60%) |
| 미스트 | `#E8F0F7` | 글자·카드 (30%) |
| 민트 | `#1FCFBE` (`--teal`) | 버튼, 선택, 정상 (한 화면 한두 곳) |
| 오렌지 | `#F37321` (`--warm`) | **불량·초과·알람에만**. 목표선·장식에 쓰지 않는다 |

브랜드 그라데이션(`--grad`)은 로고와 큰 숫자 하나에만. 한화 로고·Tricircle 모양과 비율은 바꾸지 않는다.

## 7. 자주 하는 작업

**새 질문 추가** (`js/20-rules.js`)
1. `RULES`에 `이름: function (d) { return { a: '답 문장', facts: ['칩1', '칩2'], alert: 0, panel: {...}, actions: [{ t: '할 일', who: '설비' }], feedback: '의견' }; }`
2. `QA`에 `{ q: '추천 질문 문장', keys: ['키워드'], rule: '이름' }`. 앞에 있는 것이 먼저 맞으니 넓은 키워드는 뒤로.
3. 자동 브리핑에 넣으려면 `CONFIG.autoOrder`에 이름 추가.
4. 숫자는 반드시 `d`(DATA)에서 계산한다. 문장에 숫자를 직접 적지 않는다.

**새 팝업 종류**: `js/44-panel-이름.js`를 만들어 `function build이름(p)`를 쓰고 `pBody`에 붙인다 → `40-panel.js`의 `openPanel`에 `else if (p.type === '이름') { build이름(p); }` 추가 → `index.html` 스크립트 목록에 번호 순서대로 추가.

**DB 연결**: 서버가 `data/sample.json`과 같은 모양의 JSON을 주게 하고 `CONFIG.dataUrl`에 주소를 넣는다. 화면 코드는 고치지 않는다. 모양은 `data/SCHEMA.md`, 검사는 `validateData`.

**실제 EL 이미지**: `41-panel-el.js`의 `drawEL` 대신 `<img>`를 넣고, 불량 좌표는 이미지 크기에 대한 비율(0~1)로 넘긴다. 박스·확대 창은 `elGeo`가 주는 비율 좌표를 쓰므로 그 함수만 바꾼다.

## 8. 하지 말 것

- 검사기(`95-layout-check.js`)나 테스트 기준을 느슨하게 바꿔서 통과시키기.
- 화면에 `[담당자]`, `undefined`, `NaN` 같은 글자가 보이게 두기.
- 새 색, 새 글꼴, 새 간격 숫자 만들기.
- 팝업 위치를 내용 길이에 따라 바꾸기 (항상 위 76px에서 연다).
- 1920×1080과 1366×768 중 하나만 맞추기.
