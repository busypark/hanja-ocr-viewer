# 정적 파일 서버 및 기본 UI 구현

Express에서 `public/` 디렉토리를 정적 파일로 제공하도록 설정하고, 전체 단일 페이지 레이아웃을 구현.

## 변경사항

- `server.js`: `express.static('public')` 추가
- `public/index.html`: 전체 UI 정적 구조
  - 캔버스(400×400), Pen/Erase/Clear 버튼
  - OCR 결과 테이블(4×5), 검색 텍스트 입력, Naver/Zdic/ExtractMP/ExtractWords 버튼
  - 텍스트 영역 TA_1, TA_2
- `public/css/mainStyle.css`: 다크 테마(배경 #000000), 960×1260px 고정 레이아웃, 강조색 체계(노랑/초록/빨강)
- `public/js/mainScript.js`: 기본 로드 확인 (`console.log`)

## 실행

```bash
npm start  # → http://localhost:3000
```

## 화면

![](./images/a.jpg)
<p align="center"><기본 UI 전체 레이아웃 (기능 미작동 상태)></p>
