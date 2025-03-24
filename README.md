# 코드 모듈화 리팩토링

`createSearchTab.js`에 인라인으로 포함되어 있던 캔버스·OCR 로직을 기능별 독립 모듈로 분리.

## 변경사항

| 신규 파일 | 분리된 기능 |
|-----------|------------|
| `canvasDraw.js` | 마우스·터치 획 그리기 이벤트 처리 |
| `canvasErase.js` | 지우개 이벤트, 캔버스 재렌더링 |
| `canvasClear.js` | 전체 지우기 및 OCR 초기화 |
| `ocrProcessor.js` | 좌표 압축·InputStr 생성·fetch·테이블 렌더링 |
| `state.js` | `canvas.dataset` 기반 모드·획 데이터 상태 관리 |
| `backup_mainScript.js` | 모듈화 이전 단일 파일 백업본 |

- `createSearchTab.js`: 인라인 코드 → 위 모듈 `import` 방식으로 교체  
  (Pen/Erase/Clear 모드 전환은 아직 인라인)

## 참고

기능 동작은 이전 커밋과 완전히 동일. 파일 구조만 변경됨.
