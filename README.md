# zdic 서체 이미지 스크래핑 서버 구현

zdic.net에서 한자의 4종 서체 SVG 이미지를 서버에서 다운로드.

## 변경사항

- `server.js`: `/zChar` POST 엔드포인트 추가 (SVG 다운로드, PNG 변환 미포함)
  - 갑골문(GAP) · 금문(GUM) · 소전(SOJ) · 해서(HES) 각 zdic URL 요청
  - `<div class="zy">` / `<div class="zx">` 정규식 파싱 → SVG 링크 추출
  - `public/download/{서체명}/` 경로로 SVG 파일 저장 (서체당 최대 5개)
- `public/js/mainScript.js`: Zdic 버튼 핸들러 추가 (서버 요청 후 콘솔 확인)

## API

```
POST /zChar
Body:     { "zChar": "한자" }
Response: { "GAP": [...], "GUM": [...], "SOJ": [...], "HES": [...] }
```

> 이 시점에서 클라이언트는 서버 응답을 콘솔에만 출력.  
> 이미지 뷰어 UI는 이후 커밋에서 구현.
