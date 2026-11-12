/* 00-config.js · 설정: 숫자·순서만 바꾸면 되는 값은 모두 여기 */
var CONFIG = {
  /* 자동 브리핑이 스스로 묻는 순서 (20-rules.js의 RULES 이름). 'event'는 새 불량 알림 */
  autoOrder: ['trend', 'stats', 'compare', 'rate', 'event', 'issue', 'alarms', 'detect', 'event'],
  /* DB 연결: 오늘 데이터를 JSON으로 주는 주소. 비워 두면 예시 데이터(10-data-sample.js)로 동작.
     모양은 data/SCHEMA.md. 주소 뒤에 ?data=주소 를 붙여도 된다 (예: index.html?data=data/sample.json) */
  dataUrl: '',
  /* dataUrl을 다시 읽는 간격(초) */
  refreshSec: 60
};
