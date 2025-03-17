import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
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
    res.json(await response.json());
  } catch (err) {
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
    const searchData = await (await fetch(`https://hanja.dict.naver.com/api3/ccko/search?query=${encodeURIComponent(hanjaText)}&m=pc&range=letter&page=1`, { headers })).json().catch(() => null);
    if (!searchData) return res.json({ success: false, error: "1. search request error" });
    const items = searchData?.searchResultMap?.searchResultListMap?.LETTER?.items;
    if (!items || !items.length) return res.json({ success: false, error: "2. empty search list" });
    const entryId = items[0]?.destinationLink?.split("/")[3];
    if (!entryId) return res.json({ success: false, error: "3. entryId error" });
    const detailData = await (await fetch(`https://hanja.dict.naver.com/api/platform/ccko/entry?entryId=${entryId}&isConjsShowTTS=true&searchResult=false`, { headers })).json().catch(() => null);
    if (!detailData) return res.json({ success: false, error: "4. hanja description request error" });
    const means = detailData?.entry?.means;
    if (!means || !Array.isArray(means)) return res.json({ success: false, error: "4. hanja description request error" });
    const parseList = ["[" + detailData?.entry?.mix_pron.trim() + "]"];
    for (const m of means) {
      let s = "  ".repeat((m.mean_level || 1) - 1);
      const v = (m.origin_mean || m.show_mean || "").trim();
      if (v) parseList.push(s + v);
    }
    const learningMoreList = [];
    for (const lm of (detailData?.entry?.group?.learningMores || [])) {
      const title = (lm.learning_info_title || "").trim();
      let body = (lm.learning_info_body || "").trim();
      if (title && body) {
        if (body.startsWith("<div")) { const $ = load(body); body = $('p.se-text-paragraph.se-text-paragraph-align-').first().text(); }
        learningMoreList.push(body);
      }
    }
    res.json({ success: true, data: { MP: parseList.join("\n"), learningMoreList: JSON.stringify(learningMoreList) } });
  } catch (err) { res.json({ success: false, error: "서버 처리 중 예외 발생" }); }
});

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
    async function search(range, page) {
      const data = await (await fetch(`https://hanja.dict.naver.com/api3/ccko/search?query=${encodeURIComponent(hanjaText)}&m=pc&range=${range}&page=${page}&shouldSearchOpen=true`, { headers })).json().catch(() => null);
      return data?.searchResultMap?.searchResultListMap;
    }
    const info1 = await (async () => {
      const data = await (await fetch(`https://hanja.dict.naver.com/api3/ccko/search?query=${encodeURIComponent(hanjaText)}&m=pc&range=wordEntry&page=1&shouldSearchOpen=true`, { headers })).json().catch(() => null);
      return { totalPages: Math.min(10, data?.pagerInfo?.totalPages || 0) };
    })();
    const keywords = ['조선','고려','신라','백제','고구려','가야','이름.','http://','https://','의 자(字)','의 호(號)','자(字)는','호(號)는'];
    const wordList = [];
    for (let page = 1; page <= info1.totalPages; page++) {
      if (wordList.length >= 45) break;
      const items = (await search("wordEntry", page))?.WORDENTRY?.items || [];
      for (const item of items) {
        if (wordList.length >= 45) break;
        const expEntry      = item?.expEntry.replace(/<\/?strong>/g, '').trim();
        const expKoreanPron = item?.expKoreanPron.replace(/<\/?strong>/g, '').trim();
        if (expKoreanPron.length >= 6) continue;
        const meanList = [];
        for (const mean of item?.meansCollector[0].means)
          if (mean?.value) meanList.push('> ' + mean?.value.replace(/<\/?strong>/g, ''));
        const meanJoin = meanList.join("\n");
        if (keywords.some(k => meanJoin.includes(k))) continue;
        wordList.push(expEntry + " (" + expKoreanPron + ")\n" + meanJoin);
      }
    }
    const idiomList = [];
    for (let page = 1; page <= 3; page++) {
      const result = await search("wordIdiom", page);
      const wordIdiom = result?.WORDIDIOM;
      const items = wordIdiom?.items || [];
      if (!items.length) break;
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
  } catch (err) { res.json({ success: false, error: "서버 처리 중 예외 발생" }); }
});

// zChar 검색 및 SVG 이미지 획득 (PNG 변환 전)
app.post("/zChar", async (req, res) => {
  const { zChar } = req.body;
  try {
    const maxDownloads = 5;
    const headers = { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko,en;q=0.9,en-US;q=0.8" };

    async function fetchZdic(url) {
      const resp = await axios.get(url, { headers });
      return resp.data;
    }

    function parseDivs(html, divClass, filenameSplit) {
      const links = [];
      const divs = html.match(new RegExp(`<div class="${divClass}">.*?<\/div>`, 'g'));
      if (!divs) return links;
      let i = 0;
      for (const div of divs) {
        if (i >= maxDownloads) break;
        const svgMatch = div.match(/data-original="(.*?)"/);
        if (!svgMatch) continue;
        const svgLink = svgMatch[1];
        const parts = svgLink.split("/");
        const filename = filenameSplit === "single" ? parts[5] : parts[filenameSplit[0]] + "-" + parts[filenameSplit[1]];
        const textMatch = div.match(new RegExp(`<div class="${divClass}">(.*?)<\/div>`));
        const text = textMatch ? textMatch[1] : "";
        if (filename === ".svg") continue;
        links.push({ svgLink, filename, text, error: false });
        i++;
      }
      return links;
    }

    const [html1, html2, html3, html4] = await Promise.all([
      fetchZdic(`https://www.zdic.net/zd/zx/jg/${zChar}`),
      fetchZdic(`https://www.zdic.net/zd/zx/jw/${zChar}`),
      fetchZdic(`https://www.zdic.net/zd/zx/xz/${zChar}`),
      fetchZdic(`https://www.zdic.net/hans/${zChar}`)
    ]);

    const GAPsvgLinks = parseDivs(html1, "zy", "single");
    const GUMsvgLinks = parseDivs(html2, "zy", "single");
    const SOJsvgLinks = parseDivs(html3, "zy", "single");
    const HESsvgLinks = parseDivs(html4, "zx", [4, 5]);

    const downloadFiles = async (links, folder) => {
      for (const link of links) {
        try {
          const svgUrl = "https:" + link.svgLink;
          const filePath = path.join("./public/download", folder, link.filename);
          const writer = fs.createWriteStream(filePath);
          const response = await axios.get(svgUrl, { responseType: "stream" });
          response.data.pipe(writer);
        } catch (err) {
          link.error = true;
        }
      }
    };

    await Promise.all([
      downloadFiles(GAPsvgLinks, "GAP"),
      downloadFiles(GUMsvgLinks, "GUM"),
      downloadFiles(SOJsvgLinks, "SOJ"),
      downloadFiles(HESsvgLinks, "HES"),
    ]);

    res.json({ GAP: GAPsvgLinks, GUM: GUMsvgLinks, SOJ: SOJsvgLinks, HES: HESsvgLinks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "서버에서 처리하는 동안 오류가 발생했습니다." });
  }
});

try {
  app.listen(PORT, hostname, () => {
    console.log(`Server listening on http://${hostname}:${PORT}`);
  });
} catch (error) {
  console.error('Error starting the server:', error);
}
