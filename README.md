# 네이버 한자 OCR API 서버 프록시 구현

브라우저에서 직접 호출할 수 없는 네이버 OCR API를 Express 서버에서 중계.

## 변경사항

- `server.js`: `/api/ocr` POST 엔드포인트 추가
  - 획 좌표를 URL 인코딩 포맷(`%3DR%20...`)으로 압축하여 네이버 API에 전달
  - 호출 대상: `hw.dict.naver.com/hanja/recognize`
- `public/js/mainScript.js`: `compressStrokes()`, `buildInputStr()`, `runOCR()` 추가 (결과는 콘솔 출력)

## API

```
POST /api/ocr
Body:     { "inputStr": "URL인코딩된 획 데이터" }
Response: { "content": "한자,설명;한자,설명;..." }
```
