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

app.post("/api/ExtractMP", async (req, res) => {
  try {
    const hanjaText = req.body.text;
    if (!hanjaText || typeof hanjaText !== "string")
      return res.json({ success: false, error: "유효하지 않은 입력입니다." });

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0",
      "Accept-Language": "ko,en;q=0.9,en-US;q=0.8",
      "Referer": "https://hanja.dict.naver.com/"
    };

    const searchUrl = `https://hanja.dict.naver.com/api3/ccko/search?query=${encodeURIComponent(hanjaText)}&m=pc&range=letter&page=1`;
    const searchData = await (await fetch(searchUrl, { headers })).json().catch(() => null);
    if (!searchData) return res.json({ success: false, error: "1. search request error" });

    const items = searchData?.searchResultMap?.searchResultListMap?.LETTER?.items;
    if (!items || items.length === 0) return res.json({ success: false, error: "2. empty search list" });

    const entryId = items[0]?.destinationLink?.split("/")[3];
    if (!entryId) return res.json({ success: false, error: "3. entryId error" });

    const detailUrl = `https://hanja.dict.naver.com/api/platform/ccko/entry?entryId=${entryId}&isConjsShowTTS=true&searchResult=false`;
    const detailData = await (await fetch(detailUrl, { headers })).json().catch(() => null);
    if (!detailData) return res.json({ success: false, error: "4. hanja description request error" });

    const means = detailData?.entry?.means;
    if (!means || !Array.isArray(means)) return res.json({ success: false, error: "4. hanja description request error" });

    const parseList = ["[" + detailData?.entry?.mix_pron.trim() + "]"];
    for (const m of means) {
      let s = "  ".repeat((m.mean_level || 1) - 1);
      const origin = (m.origin_mean || "").trim();
      const show   = (m.show_mean   || "").trim();
      if (origin) s += origin; else if (show) s += show; else continue;
      parseList.push(s);
    }

    const learningMoreList = [];
    for (const lm of (detailData?.entry?.group?.learningMores || [])) {
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

    res.json({ success: true, data: { MP: parseList.join("\n"), learningMoreList: JSON.stringify(learningMoreList) } });
  } catch (err) {
    console.error("서버 에러:", err);
    res.json({ success: false, error: "서버 처리 중 예외 발생" });
  }
});

// 관련단어, 성어 추출
app.post("/api/ExtractWords", async (req, res) => {
  try {
    const hanjaText = req.body.text;
    if (!hanjaText || typeof hanjaText !== "string")
      return res.json({ success: false, error: "유효하지 않은 입력입니다." });

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0",
      "Accept-Language": "ko,en;q=0.9,en-US;q=0.8",
      "Referer": "https://hanja.dict.naver.com/"
    };

    async function searchExpression(range, page) {
      const url = `https://hanja.dict.naver.com/api3/ccko/search?query=${encodeURIComponent(hanjaText)}&m=pc&range=${range}&page=${page}&shouldSearchOpen=true`;
      const data = await (await fetch(url, { headers })).json().catch(() => null);
      if (!data) return null;
      return data?.searchResultMap?.searchResultListMap;
    }

    async function retrieveWordEntryInfoPage1() {
      const url = `https://hanja.dict.naver.com/api3/ccko/search?query=${encodeURIComponent(hanjaText)}&m=pc&range=wordEntry&page=1&shouldSearchOpen=true`;
      const data = await (await fetch(url, { headers })).json().catch(() => null);
      if (!data) return null;
      return {
        pageSize:   data?.pagerInfo?.pageSize,
        totalRows:  data?.pagerInfo?.totalRows,
        totalPages: Math.min(10, data?.pagerInfo?.totalPages)
      };
    }

    const keywords = ['조선','고려','신라','백제','고구려','가야','이름.','http://','https://','의 자(字)','의 호(號)','자(字)는','호(號)는'];

    const wsInfo = await retrieveWordEntryInfoPage1();
    const wordList = [];

    for (let page = 1; page <= (wsInfo?.totalPages || 0); page++) {
      if (wordList.length >= 45) break;
      const result = await searchExpression("wordEntry", page);
      const wordEntry = result?.WORDENTRY;
      const items = wordEntry?.items;
      if (!items || items.length === 0) break;

      for (const item of items) {
        if (wordList.length >= 45) break;
        const expEntry       = item?.expEntry.replace(/<\/?strong>/g, '').trim();
        const expKoreanPron  = item?.expKoreanPron.replace(/<\/?strong>/g, '').trim();
        if (expKoreanPron.length >= 6) continue;

        const meanList = [];
        for (const mean of item?.meansCollector[0].means)
          if (mean?.value) meanList.push('> ' + mean?.value.replace(/<\/?strong>/g, ''));

        const meanJoin = meanList.join("\n");
        if (keywords.some(k => meanJoin.includes(k))) continue;
        wordList.push(expEntry + " (" + expKoreanPron + ")\n" + meanJoin);
      }
    }

    // 성어 추출 (1~3페이지)
    const idiomList = [];
    for (let page = 1; page <= 3; page++) {
      const result = await searchExpression("wordIdiom", page);
      const wordIdiom = result?.WORDIDIOM;
      const items = wordIdiom?.items;
      if (!items || items.length === 0) break;

      for (const item of items) {
        const expEntry      = item?.expEntry.replace(/<\/?strong>/g, '').trim();
        const expKoreanPron = item?.expKoreanPron.replace(/<\/?strong>/g, '').trim();
        const meanList = [];
        for (const mean of item?.meansCollector[0].means)
          if (mean?.value) meanList.push('> ' + mean?.value.replace(/<\/?strong>/g, ''));
        idiomList.push(expEntry + " (" + expKoreanPron + ")\n" + meanList.join("\n"));
      }

      if (Number(wordIdiom?.total) < (page * 15) + 1) break;
    }

    res.json({ success: true, data: { Words: wordList.join("\n\n"), Idioms: idiomList.join("\n\n") } });
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
