# 캔버스 드로잉 기능 구현

마우스로 획을 그리고, 획 단위로 지우고, 전체를 초기화할 수 있는 캔버스 인터페이스 구현.

## 변경사항

- `public/js/mainScript.js`
  - **Pen 모드**: `mousedown → mousemove → mouseup` 이벤트로 획 수집 및 렌더링
  - **Erase 모드**: 마우스 위치에서 반경 10px 이내 획 감지 후 삭제 (`distanceToSegment` 활용)
  - **Clear**: 전체 `strokes` 배열 초기화 및 캔버스 clear
  - Pen/Erase/Clear 버튼 비활성화 상태 토글

## 화면

![](./images/a.jpg)
<p align="center"><펜 모드에서 획 그리기></p>

![](./images/b.jpg)
<p align="center"><지우개 모드 - 획 단위 삭제></p>
