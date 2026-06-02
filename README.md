# 한자학습 Local Web

## 프로젝트 개요

네이버 한자사전 및 zdic.net을 활용하여 한자를 학습할 수 있는 로컬 웹 애플리케이션.  
손글씨로 한자를 직접 쓰면 OCR로 인식하고, 해당 한자의 뜻·기원·관련 단어·서체 이미지를 조회할 수 있다.

> **외부 서비스 사용 고지**: 네이버 한자사전 내부 API 및 zdic.net 크롤링을 활용합니다. 개인 학습 목적의 로컬 환경 전용이며 공개 배포를 목적으로 하지 않습니다.

- **개발 기간**: 2025년 3월 (평일, 비주기적)
- **개발 환경**: Windows 10 / Node.js
- **개발 인원**: 1인

---

## 주요 기능

![](./images/a.jpg)
<p align="center"><탭 기반 UI - Search 탭></p>

### 1. 손글씨 한자 OCR 인식
- 400×400px 캔버스에 마우스 또는 터치로 한자를 직접 획 입력
- 획이 추가될 때마다 자동으로 OCR 실행
- 획 좌표를 압축·인코딩하여 네이버 한자 OCR API에 전달
- 인식 결과를 4×5 테이블로 표시하며, 셀 클릭 시 검색어 필드에 자동 입력
- 지우개(반경 10px 이내 획 삭제) 및 전체 지우기 기능

### 2. 네이버 한자사전 검색
- 검색어 입력 후 Naver 버튼으로 네이버 한자사전 외부 링크 오픈
- 검색어 텍스트 편집 버튼(이전 글자 `<`, 다음 글자 `>`, 초기화 `reset`)

### 3. 한자 뜻·기원 설명 추출 (ExtractMP)
- 네이버 한자사전 API로 해당 한자의 엔트리를 검색
- 뜻 목록(Meaning)과 학습 기원 설명(Pedigree)을 파싱하여 텍스트영역에 표시
- Copy 버튼으로 클립보드 복사 지원

### 4. 한자 단어·성어 추출 (ExtractWords)
- 네이버 한자사전 API로 관련 단어(`wordEntry`)와 성어(`wordIdiom`) 목록 수집
- 왕조명(조선, 고려 등), 지역명, 책 이름 포함 항목 자동 필터링
- 최대 단어 45개 + 성어 목록을 별도 텍스트영역에 표시

![](./images/b.jpg)
<p align="center"><탭 기반 UI - 한자별 zdic 조회 탭></p>

### 5. zdic 서체 이미지 조회 (SearchZ)
- zdic.net에서 4종 서체 이미지를 서버에서 스크래핑
  - **GAP** (갑골문): Oracle bone script
  - **GUM** (금문): Bronze inscription
  - **SOJ** (소전): Small seal script
  - **HES** (해서): Regular script
- 각 서체별 최대 5개 SVG 이미지 다운로드 → sharp로 PNG 변환 (흰색 배경, 검정 획 정규화)
- `public/download/{서체명}/` 경로에 저장 후 Char 탭에 150×150px 그리드로 표시

### 6. 서체 이미지 뷰어 (Char 탭)
- 4종 서체 이미지를 서체별 그리드로 표시
- 이미지 클릭 시 해상도 선택(256 / 512 / 1024px) 및 확대 모달 팝업
- 이미지 레이블 색상: 흰색 = 검색한 한자 일치, 노란색 = 불일치(경고)

### 7. 탭 기반 멀티 검색 UI
- Search 탭을 Replicate 버튼으로 복제하여 여러 한자를 동시에 탐색
- Cancel 버튼으로 탭 제거 (최소 1개 탭 유지)
- Zdic 검색 결과는 Char 탭으로 분리 생성

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 런타임 | Node.js (ES Modules) |
| 웹 프레임워크 | Express.js v5 |
| HTTP 클라이언트 | axios |
| HTML 파싱 | cheerio |
| 이미지 처리 | sharp (SVG→PNG 변환) |
| 헤드리스 브라우저 | puppeteer |
| 프론트엔드 | HTML5, CSS3, Vanilla JS (ES Modules) |
| Canvas | Canvas API (마우스·터치 이벤트) |
| 외부 API | 네이버 한자사전 API, zdic.net |

---

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 서버 실행
npm start
# 또는 SERVER ON.bat 더블클릭
```

서버 실행 후 브라우저에서 `http://localhost:3000` 접속

- 포트: 3000 (기본값)
- 바인딩: 0.0.0.0 (로컬 네트워크 접속 가능)

---

## 프로젝트 구조

```
project/
├── server.js                  # Express 서버 (API 엔드포인트, 정적 파일 제공)
├── package.json
├── SERVER ON.bat              # 서버 실행 배치 파일
└── public/
    ├── index.html             # 단일 HTML 진입점
    ├── css/
    │   └── mainStyle.css      # 전체 스타일 (다크 테마, 960×1260px 고정)
    ├── js/
    │   ├── mainScript.js      # 진입점 (초기 Search 탭 생성)
    │   ├── state.js           # 캔버스 모드·획 데이터 상태 관리
    │   ├── modeSwitcher.js    # Pen/Erase 모드 전환 및 버튼 상태 관리
    │   ├── ocrProcessor.js    # 획 압축, OCR API 요청, 결과 렌더링
    │   ├── canvasDraw.js      # 펜 그리기 이벤트 처리
    │   ├── canvasErase.js     # 지우개 이벤트 처리
    │   ├── canvasClear.js     # 전체 지우기
    │   ├── backup_mainScript.js  # 모듈화 이전 단일 파일 백업본
    │   └── createORremoveTabs/
    │       ├── createSearchTab.js  # Search 탭 동적 생성 및 이벤트 바인딩
    │       ├── createCharTab.js    # Char 탭 동적 생성 및 이미지 뷰어
    │       ├── removeSearchTab.js  # Search 탭 제거
    │       └── removeCharTab.js    # Char 탭 제거
    └── download/              # 서체 이미지 저장 (동적 생성)
        ├── GAP/
        ├── GUM/
        ├── SOJ/
        └── HES/
```

**서버 API 엔드포인트**

| 메서드 | 경로 | 기능 |
|--------|------|------|
| POST | `/api/ocr` | 손글씨 획 좌표 → 네이버 OCR API 프록시 |
| POST | `/api/ExtractMP` | 한자 → 뜻·기원 설명 추출 |
| POST | `/api/ExtractWords` | 한자 → 관련 단어·성어 추출 |
| POST | `/zChar` | 한자 → zdic 서체 이미지 다운로드·변환 |

---

## 개발 진행 이력

> 아래 표는 실제 git 커밋 이력 작성을 위한 추정 일정입니다. 검토 후 수정해 주세요.

| 날짜 | 제목 | 유형 | 브랜치 | 설명 |
|------|------|------|--------|------|
| 2025-03-03(월) 낮 | POC 네이버 한자 OCR API 테스트 | feat | poc | Express 서버 없이 단독 HTML에서 네이버 OCR API를 fetch()로 직접 호출, 손글씨 인식 응답 구조 및 좌표 포맷 탐색 |
| 2025-03-03(월) 밤 | 프로젝트 초기 설정 | chore | main | Node.js 프로젝트 초기화, package.json 구성, Express·axios·cheerio·puppeteer·sharp 의존성 설치 |
| 2025-03-04(화) 낮 | 정적 파일 서버 및 기본 UI 구현 | feat | feature/basic-ui | Express 정적 파일 제공 설정, index.html 기본 DOM 구조, mainStyle.css 레이아웃 및 다크 색상 체계(배경 검정, 강조 노랑/초록/빨강) 구현 |
| 2025-03-05(수) 낮 | 캔버스 드로잉 기능 구현 | feat | feature/canvas-draw | 마우스·터치 이벤트 기반 획 그리기, 지우개(반경 10px 이내 획 삭제), 전체 지우기 기능 구현 |
| 2025-03-06(목) 낮 | 네이버 한자 OCR API 서버 프록시 구현 | feat | feature/ocr | /api/ocr 엔드포인트, 획 좌표 압축(compressStrokes, 283/399 비율 스케일링), URL 인코딩 포맷(buildInputStr), OCR 결과 파싱 구현 |
| 2025-03-07(금) 밤 | OCR 결과 표시 및 검색 연동 UI 구현 | feat | feature/ocr | 4×5 결과 테이블 렌더링(한자 40px + 설명 18px), 셀 클릭으로 검색어 자동 입력, 획 추가 시 자동 OCR 실행 |
| 2025-03-10(월) 낮 | 네이버 한자사전 링크 검색 연동 | feat | feature/naver-search | Naver 버튼으로 한자사전 외부 링크 오픈, 검색어 편집 버튼(이전/다음/reset) 구현 |
| 2025-03-12(수) 낮 | 한자 뜻·기원 설명 추출 기능 구현 | feat | feature/naver-extract | /api/ExtractMP 엔드포인트, 네이버 한자사전 API로 엔트리 검색→뜻 목록(Meaning)·기원 설명(Pedigree) 파싱, 텍스트영역 표시 |
| 2025-03-13(목) 낮 | 한자 단어·성어 추출 기능 구현 | feat | feature/naver-extract | /api/ExtractWords 엔드포인트, wordEntry·wordIdiom 파싱, 왕조·지역명·책 이름 포함 항목 자동 필터링, 최대 45개 단어 반환 |
| 2025-03-17(월) 낮 | zdic 서체 이미지 스크래핑 서버 구현 | feat | feature/zdic | /zChar 엔드포인트, zdic.net에서 갑골문(GAP)·금문(GUM)·소전(SOJ)·해서(HES) 4종 서체 SVG 이미지 최대 5개 다운로드 |
| 2025-03-18(화) 낮 | SVG-PNG 변환 및 이미지 저장 구현 | feat | feature/zdic | sharp 라이브러리로 SVG→PNG 변환, 흰색 배경·검정 획 정규화, public/download/{서체명}/ 디렉토리 구조로 저장 |
| 2025-03-19(수) 낮 | 탭 기반 멀티 검색 UI 구현 | feat | feature/tab-ui | Search 탭 동적 생성(모든 UI 요소 JS로 생성), Replicate로 탭 복제, Cancel로 탭 제거(최소 1개 유지) |
| 2025-03-20(목) 밤 | 한자 서체 이미지 뷰어 탭 구현 | feat | feature/tab-ui | Char 탭 동적 생성, 4종 서체별 이미지 그리드(150×150px), 클릭 시 해상도 선택(256/512/1024px) 확대 모달·애니메이션 구현 |
| 2025-03-24(월) 낮 | 코드 모듈화 리팩토링 | refactor | develop | 단일 mainScript.js를 기능별 독립 모듈(canvasDraw, canvasErase, canvasClear, ocrProcessor, createSearchTab, createCharTab, removeSearchTab, removeCharTab)로 분리 |
| 2025-03-25(화) 새벽 | 상태 관리 및 모드 전환 모듈 분리 | refactor | develop | state.js(캔버스 모드·획 데이터 JSON 직렬화·역직렬화), modeSwitcher.js(Pen/Erase 전환, 버튼 활성화·비활성화 관리) 독립 모듈 분리 |
| 2025-03-27(목) 낮 | 서버 실행 배치 파일 추가 | chore | main | SERVER ON.bat 추가 (더블클릭으로 npm start 실행) |
| 2026-06-01(월) 밤 | zdic URL 변경 반영 | hotfix | hotfix | zdic.net 도메인·URL 경로·HTML 구조 변경으로 인한 갑골문·금문·소전·해서 이미지 파싱 전면 실패 수정, 해서 5개 지역(CN/HK/TW/JP/KR) 파싱 확장, 에러 처리 보강(fetch 실패 격리, pipe 완료 대기, sharp 오류 시 서버 중단 방지) |
| 2026-06-02(화) 낮 | zdic URL 변경 hotfix 반영 | merge | main | hotfix 브랜치를 main에 머지 |

---

## 브랜치 전략

| 브랜치 | 설명 |
|--------|------|
| `main` | 안정화된 결과물 |
| `develop` | 특정 기능을 완성하여 합친 결과물 |
| `feature/*` | 특정 기능을 개발하기 위한 브랜치 |
| `release` | 여러 기능을 완성하여 합친 결과물 |
| `hotfix` | 긴급 버그 수정 |
| `poc` | 결과물과 독립적인 개념 증명 실험 코드 (특정 API 호출 결과 확인용 독립 프로토타입) |
