# 네이버 한자사전 링크 검색 연동

검색어 편집 기능과 네이버 한자사전 외부 링크 연동 구현.

## 변경사항

- `public/js/mainScript.js`
  - **`>`** 버튼: 검색어 앞 글자 제거 (`slice(1)`)
  - **`<`** 버튼: 검색어 뒤 글자 제거 (`slice(0, -1)`)
  - **`reset`** 버튼: 검색어 초기화
  - **Copy text** 버튼: 검색어 클립보드 복사
  - **Naver** 버튼: `hanja.dict.naver.com/#/search?query=...` 새 탭 오픈

## 화면

![](./images/a.jpg)
<p align="center"><검색어 입력 및 Naver 버튼 클릭 후 한자사전 새 탭 오픈></p>
