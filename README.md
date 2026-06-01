# [hotfix] zdic URL 변경 반영

**날짜**: 2026-06-01 (월) 밤  
**브랜치**: hotfix  
**유형**: hotfix  
**기준 커밋**: 2025-03-27 (목) 낮 — fix UI 버그 수정 및 안정화

## 개요

zdic.net의 도메인 구조, URL 경로, HTML 구조가 변경되어 갑골문·금문·소전·해서 이미지 파싱이 전면 실패하던 문제를 수정.

## 수정 내용 (2025-03-27 → 2026-06-01 코드 비교)

### 1. 요청 URL 변경

| 서체 | 변경 전 | 변경 후 |
|------|---------|---------|
| 갑골문 | `www.zdic.net/zd/zx/jg/{char}` | `zdic.net/hans/{char}/jiaguwen` |
| 금문 | `www.zdic.net/zd/zx/jw/{char}` | `zdic.net/hans/{char}/jinwen` |
| 소전 | `www.zdic.net/zd/zx/xz/{char}` | `zdic.net/hans/{char}/xiaozhuan` |
| 해서·메인 | `www.zdic.net/hans/{char}` | `zdic.net/hans/{char}` (www 제거, `encodeURIComponent` 적용) |

### 2. HTML 파싱 구조 변경

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 갑골·금문·소전 파싱 대상 | `<div class="zy">` + `data-original` 속성 | `<div class="glyph-item">` + `<img src>` + `<div class="caption">` |
| 해서 파싱 대상 | `<div class="zx">` + `data-original` 속성 | `glyph-compare__item` + `alt` 속성으로 지역 구분 |
| 이미지 URL 구성 | `data-original` 값에 `"https:"` prefix 붙여 사용 | img src에서 filename만 추출 후 `img.zdic.net` CDN 절대 URL로 재조합 |
| 소전 설문해자 추가 항목 | 메인 페이지 `<div class="swnr">` 추가 파싱 | 제거 (신규 구조에서 미제공) |

### 3. 해서 지역별 5종 파싱으로 변경

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 파싱 방식 | `<div class="zx">` 기반, 사이트 제공 항목 최대 5개 수집 | `glyph-compare` 섹션에서 5개 지역 명시적 수집 |
| 수집 지역 | 사이트가 제공하는 항목에 따라 가변 | 中国大陆(cn) · 香港(hk) · 台湾(tw) · 日本(jp) · 韩国(kr) 고정 |
| 로컬 파일명 | URL 세그먼트 조합 (`/[4]-/[5]`) | region prefix 붙임 (`cn_53CB.png`, `hk_53CB.png` 등) |

### 4. 에러 처리 보강

| 위치 | 변경 전 | 변경 후 |
|------|---------|---------|
| 4개 페이지 fetch | 순차 개별 `await` — 하나 실패 시 전체 중단 | `Promise.all` 병렬 요청 + 각각 `.catch(() => null)` |
| download 폴더 생성 | 폴더가 미리 존재해야 함 | `fs.mkdirSync(..., { recursive: true })` 자동 생성 |
| `downloadFiles` 내 `pipe` | 스트림 쓰기 완료를 기다리지 않고 sharp 처리 진입 | `finish` 이벤트를 Promise로 래핑하여 완전히 쓴 후 sharp 처리 |
| sharp 변환 실패 | `res.status(500)` 반환 후 루프 중단 | `fileData.error = true` 처리 후 계속 진행 |
