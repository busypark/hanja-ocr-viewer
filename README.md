# 한자 단어·성어 추출 기능 구현

네이버 한자사전에서 관련 단어(`wordEntry`)와 성어(`wordIdiom`)를 파싱하고 불필요 항목을 필터링.

## 변경사항

- `server.js`: `/api/ExtractWords` POST 엔드포인트 추가
  - `wordEntry`: 최대 10페이지 탐색, 45개 단어 수집
  - `wordIdiom`: 최대 3페이지 성어 수집
  - 필터링 키워드: 조선·고려·신라·백제·고구려·가야·지역명·책 이름 포함 항목 제거
- `public/js/mainScript.js`: ExtractWords 버튼 핸들러, TA(단어/성어) 표시

## API

```
POST /api/ExtractWords
Body:     { "text": "한자" }
Response: { "success": true, "data": { "Words": "단어 목록", "Idioms": "성어 목록" } }
```

## 화면

![](./images/a.jpg)
<p align="center"><ExtractWords 실행 후 관련 단어/성어 목록 (TA)></p>
