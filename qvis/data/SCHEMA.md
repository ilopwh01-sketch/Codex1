# DATA 모양 (DB → 화면)

서버는 아래 모양의 JSON 하나를 준다. 예시: `sample.json`. 검사 코드: `js/11-data-schema.js` 의 `validateData`.
숫자는 모두 숫자형(문자열 아님), 시각 `hours` 는 소수 시간(13.5 = 13시 30분).

| 필드 | 형식 | 뜻 |
|---|---|---|
| `line` | 문자 | 라인 이름 (예: 모듈 2라인) |
| `date` | 문자 | 표시용 날짜 (예: 11월 11일) |
| `target` | 숫자 | 목표 불량률 % |
| `inspected` / `defects` | 숫자 | 오늘 검사 수 / 불량 수 |
| `closedAlarms` | 숫자 | 오늘 조치 완료 알람 수 |
| `byProcess` | `[[공정, 불량 수], ...]` | 공정별 불량 |
| `hourly` | `{ hours[], today[], usual[], change }` | 시간대별 불량률 %. `today`·`usual` 은 `hours` 와 같은 길이. `change` 는 설비 변경 메모 |
| `issue` | `{ eq, type, lastHour, usualHour, causes[] }` | 가장 큰 문제. `causes`: `{ label, pct, leaves: [{ n, p, act, who }] }` |
| `detection` | `{ time, module, eq, verdict, cells[] }` | 방금 검출. `cells`: `[셀ID, 유형, 확신도%, 열(0~23), 행(0~5)]` (하프셀 24×6) |
| `baseline` | `{ label, n, d }` | 비교 기준 (예: 최근 7일 검사 수 n, 불량 수 d) |
| `hourlyCounts` | `{ hours[], n[], d[] }` | 시간별 검사 수·불량 수 (p 관리도용) |
| `defectTypes` | `[[유형, 건수], ...]` | 불량 유형별 건수 (파레토용) |
| `compare` | `{ eq, groups: [[호기, [값...]], ...] }` | 설비 비교(분산분석). 그룹 2개 이상, 값 2개 이상 |
| `alarms` | `[{ eq, what, min }]` | 미조치 알람과 경과 분 |
| `events` | `[{ date, time, insp, type, qty, module, shiftCount, suspects[], route[] }]` | 새 불량(FQC 등). `route`: `[[공정, 시각, 메모?], ...]` |
