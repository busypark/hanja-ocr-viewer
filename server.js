import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { load } from 'cheerio';

const app = express();
const hostname = '0.0.0.0';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.static('./public'));

// 획(좌표) 정보에 대해 OCR 요청 전송
app.post("/api/ocr", async (req, res) => {
  try {
    const inputStr = req.body.inputStr;
    const url = `https://hw.dict.naver.com/hanja/recognize?dicType=hanjaauto=1&type=1&charset=8&ReqNum=1&InputStr=${inputStr}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0",
        "Accept-Language": "ko,en;q=0.9,en-US;q=0.8"
      }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("OCR 요청 실패:", err);
    res.status(500).json({ error: "OCR 요청 실패" });
  }
});

// 뜻음 + 기원설명 추출
app.post("/api/ExtractMP", async (req, res) => {
  try {
    const hanjaText = req.body.text;
    if (!hanjaText || typeof hanjaText !== "string") {
      return res.json({ success: false, error: "유효하지 않은 입력입니다." });
    }

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0",
      "Accept-Language": "ko,en;q=0.9,en-US;q=0.8",
      "Referer": "https://hanja.dict.naver.com/"
    };

    const searchUrl = `https://hanja.dict.naver.com/api3/ccko/search?query=${encodeURIComponent(hanjaText)}&m=pc&range=letter&page=1`;
    const searchResp = await fetch(searchUrl, { headers });
    const searchData = await searchResp.json().catch(() => null);
    if (!searchData) return res.json({ success: false, error: "1. search request error" });

    const items = searchData?.searchResultMap?.searchResultListMap?.LETTER?.items;
    if (!items || items.length === 0) return res.json({ success: false, error: "2. empty search list" });

    const destinationLink = items[0]?.destinationLink;
    const entryId = destinationLink?.split("/")[3];
    if (!entryId || typeof entryId !== "string") return res.json({ success: false, error: "3. entryId error" });

    const detailUrl = `https://hanja.dict.naver.com/api/platform/ccko/entry?entryId=${entryId}&isConjsShowTTS=true&searchResult=false`;
    const detailResp = await fetch(detailUrl, { headers });
    const detailData = await detailResp.json().catch(() => null);
    if (!detailData) return res.json({ success: false, error: "4. hanja description request error" });

    const means = detailData?.entry?.means;
    if (!means || !Array.isArray(means)) return res.json({ success: false, error: "4. hanja description request error" });

    const parseList = ["[" + detailData?.entry?.mix_pron.trim() + "]"];
    for (const m of means) {
      let s = "  ".repeat((m.mean_level || 1) - 1);
      const origin = (m.origin_mean || "").trim();
      const show   = (m.show_mean   || "").trim();
      if (origin)     s += origin;
      else if (show)  s += show;
      else continue;
      parseList.push(s);
    }

    const MP = parseList.join("\n");

    const learningMores = detailData?.entry?.group?.learningMores;
    let learningMoreList = [];
    for (const lm of learningMores) {
      const title = (lm.learning_info_title || "").trim();
      const body  = (lm.learning_info_body  || "").trim();
      if (title && body) {
        let desc = body;
        if (desc.startsWith("<div")) {
          const $ = load(desc);
          desc = $('p.se-text-paragraph.se-text-paragraph-align-').first().text();
        }
        learningMoreList.push(desc);
      }
    }

    res.json({ success: true, data: { MP, learningMoreList: JSON.stringify(learningMoreList) } });
  } catch (err) {
    console.error("서버 에러:", err);
    res.json({ success: false, error: "서버 처리 중 예외 발생" });
  }
});

try {
  app.listen(PORT, hostname, () => {
    console.log(`Server listening on http://${hostname}:${PORT}`);
  });
} catch (error) {
  console.error('Error starting the server:', error);
}
