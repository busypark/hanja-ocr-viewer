# 상태 관리 및 모드 전환 모듈 분리

Pen/Erase/Clear 모드 전환 로직을 `modeSwitcher.js`로 분리하여 모듈 구조 완성.

## 변경사항

| 신규 파일 | 분리된 기능 |
|-----------|------------|
| `modeSwitcher.js` | Pen/Erase 버튼 이벤트, Clear 시 모드 복귀 (`setupModeSwitcher`) |

- `createSearchTab.js`: 인라인 모드 전환 코드 → `setupModeSwitcher(ocrCanvas, btnPen, btnErase, btnClear)` 호출로 교체

## 모듈 의존 구조

```
createSearchTab.js
  ├── modeSwitcher.js  → state.js, canvasClear.js
  ├── canvasDraw.js    → state.js, ocrProcessor.js
  └── canvasErase.js   → state.js, ocrProcessor.js
```

## 참고

기능 동작은 이전 커밋과 완전히 동일. 최종 모듈 구조 완성.
