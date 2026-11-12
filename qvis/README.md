# Q.V.I.S · 모듈 라인 불량 모니터

현장 대형 화면에 띄워 두는 불량 분석 어시스턴트. AI 없이 규칙으로 답하고, 자동 브리핑으로 스스로 묻고 답한다.

## 실행

- **그냥 보기**: `index.html` 을 더블클릭 (또는 배포용 `dist/qvis-pc.html` 한 파일).
- **서버로 보기**: `npm start` → http://localhost:5173
  - `?check=1` : 배치 검사기 켜기 (간격·겹침·줄바꿈 문제를 화면에 빨간 테두리로)
  - `?data=data/sample.json` : DB 연결 시험 (오른쪽 위 배지가 "DB 연결 · 시각"으로 바뀜)
- **검사**: `npm test` (처음 한 번 `npm install` → `npx playwright install chromium`)
- **배포 파일 만들기**: `npm run build` → `dist/qvis-pc.html`

## 구조

`index.html` 이 `css/` 와 `js/` 를 번호 순서대로 읽는다. 자세한 파일 지도와 작업 규칙은 [`AGENTS.md`](AGENTS.md).

## DB 연결

`js/00-config.js` 의 `dataUrl` 에 오늘 데이터를 주는 주소를 넣는다. JSON 모양은 [`data/SCHEMA.md`](data/SCHEMA.md), 예시는 `data/sample.json`.
모양이 틀리면 화면은 예시 데이터를 유지하고 배지에 "데이터 형식 오류 N건"과 틀린 위치를 보여 준다.

## 디자인 기준

- 색 4톤(네이비·미스트·민트·오렌지), 간격 단계, 그래프 규칙: `AGENTS.md`
- 부품 이름·움직임·통계 그래프 모음: `../design/qvis-design-collection.html`
