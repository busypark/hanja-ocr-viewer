# 한자 서체 이미지 뷰어 탭 구현

Zdic 검색 결과를 Char 탭으로 분리 표시하고 이미지 확대 모달을 구현.

## 변경사항

- `createORremoveTabs/createCharTab.js` (신규): Char 탭 동적 생성
  - 4종 서체(갑골문·금문·소전·해서)별 150×150px 이미지 그리드
  - 레이블: 흰색(검색 한자 `「」` 내 일치) / 노란색(불일치 경고)
  - 이미지 클릭 → 해상도 선택(256/512/1024px) → 확대 모달 오버레이 (scale 애니메이션)
  - Cancel 버튼으로 탭 제거
- `createORremoveTabs/removeCharTab.js` (신규): Char 탭 제거 및 인접 탭 활성화
- `createORremoveTabs/createSearchTab.js`: Zdic 버튼 → `create_charTab()` 연동

## 화면

![](./images/a.jpg)
<p align="center"><Char 탭 - 4종 서체 이미지 그리드 (갑골문·금문·소전·해서)></p>

![](./images/b.jpg)
<p align="center"><이미지 클릭 시 확대 모달 (해상도 선택 후)></p>
