# 프로젝트 초기 설정

Node.js 프로젝트 초기화 및 개발에 필요한 의존성 설치.

## 변경사항

- `package.json` 생성 (`"type": "module"`, `npm start` 스크립트)
- `server.js` 기본 골격 생성 (Express + CORS 미들웨어, 엔드포인트 없음)
- 의존성 설치: `express` `cors` `axios` `cheerio` `node-fetch` `puppeteer` `sharp`

## 파일

| 파일 | 설명 |
|------|------|
| `package.json` | 프로젝트 메타 및 의존성 |
| `server.js` | Express 서버 기본 구조 |

## 실행

```bash
npm install
npm start
# → http://localhost:3000 (아직 정적 파일 없음)
```
