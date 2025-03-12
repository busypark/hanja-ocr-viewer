# 한자 뜻·기원 설명 추출 기능 구현

네이버 한자사전 내부 API에서 뜻 목록(Meaning)과 기원 설명(Pedigree)을 파싱하여 표시.

## 변경사항

- `server.js`: `/api/ExtractMP` POST 엔드포인트 추가
  1. 한자 검색 API → `destinationLink`에서 entryId 추출
  2. Entry 상세 API → `means` 배열 파싱 (뜻 목록, 들여쓰기 레벨 적용)
  3. `group.learningMores` → 기원 설명 텍스트 추출 (HTML div 포함 시 cheerio 파싱)
- `public/js/mainScript.js`: ExtractMP 버튼 핸들러, TA_1(뜻) + TA_2(기원) 표시

## API

```
POST /api/ExtractMP
Body:     { "text": "한자" }
Response: { "success": true, "data": { "MP": "뜻 목록", "learningMoreList": "[...]" } }
```

## 화면

![](./images/a.jpg)
<p align="center"><ExtractMP 실행 후 뜻 목록(TA_1)과 기원 설명(TA_2) 표시></p>
