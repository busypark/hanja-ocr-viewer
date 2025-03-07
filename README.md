# OCR 결과 표시 및 검색 연동 UI 구현

OCR 인식 결과를 4×5 테이블에 렌더링하고, 셀 클릭 시 검색어 필드에 한자를 자동 입력.

## 변경사항

- `public/js/mainScript.js`
  - 획 종료 시마다 `runOCR()` 자동 실행
  - 결과 파싱: `content.split(";")` → `[한자, 설명]`
  - 테이블 셀 렌더링: 한자(40px, gold) + 설명(18px)
  - 셀 클릭 → `searchText.value` append
  - 획 지우기/전체 지우기 시 테이블 셀 초기화

## 화면

![](./images/a.jpg)
<p align="center"><한자 획 입력 후 OCR 인식 결과 테이블></p>
