import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { load } from 'cheerio';

const app = express();
const hostname = '0.0.0.0';
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.static("./public"));

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
    if (!items || !items.length) return res.json({ success: false, error: "2. empty search list" });
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
    const MP = parseList.join("\n");
    const learningMores = detailData?.entry?.group?.learningMores;
    const learningMoreList = [];
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
    async function searchExpression(headers, range, page) {
      const searchUrl = `https://hanja.dict.naver.com/api3/ccko/search?query=${encodeURIComponent(hanjaText)}&m=pc&range=${range}&page=${page}&shouldSearchOpen=true`;
      const searchResp = await fetch(searchUrl, { headers });
      const searchData = await searchResp.json().catch(() => null);
      if (!searchData) return res.json({ success: false, error: "1. search request error" });
      return searchData?.searchResultMap?.searchResultListMap;
    }
    async function retrieveWordEntryInfoPage1(headers) {
      const searchUrl = `https://hanja.dict.naver.com/api3/ccko/search?query=${encodeURIComponent(hanjaText)}&m=pc&range=wordEntry&page=1&shouldSearchOpen=true`;
      const searchResp = await fetch(searchUrl, { headers });
      const searchData = await searchResp.json().catch(() => null);
      if (!searchData) return res.json({ success: false, error: "retrieveInfoPage1" });
      const pageSize   = searchData?.pagerInfo?.pageSize;
      const totalRows  = searchData?.pagerInfo?.totalRows;
      const totalPages = Math.min(10, searchData?.pagerInfo?.totalPages);
      return { pageSize, totalRows, totalPages };
    }
    const keywords = ['조선','고려','신라','백제','고구려','가야','이름.','http://','https://','의 자(字)','의 호(號)','자(字)는','호(號)는'];
    let wsInfo = (await retrieveWordEntryInfoPage1(headers));
    const wordList = [];
    for (let page = 1; page <= wsInfo.totalPages; page++) {
      if (wordList.length >= 45) break;
      let wordEntry = (await searchExpression(headers, "wordEntry", page)).WORDENTRY;
      let items = wordEntry?.items;
      if (!items || items.length === 0 || Number(wordEntry?.total) === 0) break;
      for (const item of items) {
        if (wordList.length >= 45) break;
        const expEntry      = item?.expEntry.replace(/<\/?strong>/g, '').trim();
        const expKoreanPron = item?.expKoreanPron.replace(/<\/?strong>/g, '').trim();
        if (expKoreanPron.length >= 6) continue;
        const meanList = [];
        for (const mean of item?.meansCollector[0].means)
          if (mean?.value) meanList.push('> ' + mean?.value.replace(/<\/?strong>/g, ''));
        const meanJoin = meanList.join("\n");
        if (keywords.some(keyword => meanJoin.includes(keyword))) continue;
        wordList.push(expEntry + " (" + expKoreanPron + ")\n" + meanJoin);
      }
    }
    let wordIdiom = (await searchExpression(headers, "wordIdiom", 1)).WORDIDIOM;
    let total_words = wordIdiom?.total;
    let items = wordIdiom?.items;
    if (!items || items.length === 0 || Number(total_words) === 0) { total_words = 0; items = []; }
    const idiomList = [];
    for (const item of items) {
      const expEntry      = item?.expEntry.replace(/<\/?strong>/g, '').trim();
      const expKoreanPron = item?.expKoreanPron.replace(/<\/?strong>/g, '').trim();
      const meanList = [];
      for (const mean of item?.meansCollector[0].means)
        if (mean?.value) meanList.push('> ' + mean?.value.replace(/<\/?strong>/g, ''));
      idiomList.push(expEntry + " (" + expKoreanPron + ")\n" + meanList.join("\n"));
    }
    if (16 <= Number(total_words)) {
      wordIdiom = (await searchExpression(headers, "wordIdiom", 2)).WORDIDIOM;
      items = wordIdiom?.items || [];
      for (const item of items) {
        const expEntry      = item?.expEntry.replace(/<\/?strong>/g, '').trim();
        const expKoreanPron = item?.expKoreanPron.replace(/<\/?strong>/g, '').trim();
        const meanList = [];
        for (const mean of item?.meansCollector[0].means)
          if (mean?.value) meanList.push('> ' + mean?.value.replace(/<\/?strong>/g, ''));
        idiomList.push(expEntry + " (" + expKoreanPron + ")\n" + meanList.join("\n"));
      }
    }
    if (31 <= Number(total_words)) {
      wordIdiom = (await searchExpression(headers, "wordIdiom", 3)).WORDIDIOM;
      items = wordIdiom?.items || [];
      for (const item of items) {
        const expEntry      = item?.expEntry.replace(/<\/?strong>/g, '').trim();
        const expKoreanPron = item?.expKoreanPron.replace(/<\/?strong>/g, '').trim();
        const meanList = [];
        for (const mean of item?.meansCollector[0].means)
          if (mean?.value) meanList.push('> ' + mean?.value.replace(/<\/?strong>/g, ''));
        idiomList.push(expEntry + " (" + expKoreanPron + ")\n" + meanList.join("\n"));
      }
    }
    res.json({ success: true, data: { Words: wordList.join("\n\n"), Idioms: idiomList.join("\n\n") } });
  } catch (err) {
    console.error("서버 에러:", err);
    res.json({ success: false, error: "서버 처리 중 예외 발생" });
  }
});

app.post("/zChar", async (req, res) => {
  const { zChar } = req.body;
  try {
    const maxDownloads = 5;
    const response1 = await axios.get(`https://www.zdic.net/zd/zx/jg/${zChar}`, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko,en;q=0.9,en-US;q=0.8" } });
    const GAPsvgLinks = [];
    const divs1 = response1.data.match(/<div class="zy">.*?<\/div>/g);
    if (divs1) { let i = 0; divs1.forEach(div => { if (i >= maxDownloads) return; i++; const svgLink = div.match(/data-original="(.*?)"/)[1]; const filename = svgLink.split("/")[5]; const text = div.match(/<div class="zy">(.*?)<\/div>/)[1]; if (filename === ".svg") return; GAPsvgLinks.push({ svgLink, filename, text }); }); }
    const response2 = await axios.get(`https://www.zdic.net/zd/zx/jw/${zChar}`, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko,en;q=0.9,en-US;q=0.8" } });
    const GUMsvgLinks = [];
    const divs2 = response2.data.match(/<div class="zy">.*?<\/div>/g);
    if (divs2) { let i = 0; divs2.forEach(div => { if (i >= maxDownloads) return; i++; const svgLink = div.match(/data-original="(.*?)"/)[1]; const filename = svgLink.split("/")[5]; const text = div.match(/<div class="zy">(.*?)<\/div>/)[1]; if (filename === ".svg") return; GUMsvgLinks.push({ svgLink, filename, text }); }); }
    const response3 = await axios.get(`https://www.zdic.net/zd/zx/xz/${zChar}`, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko,en;q=0.9,en-US;q=0.8" } });
    const SOJsvgLinks = [];
    const divs3 = response3.data.match(/<div class="zy">.*?<\/div>/g);
    if (divs3) { let i = 0; divs3.forEach(div => { if (i >= maxDownloads) return; i++; const svgLink = div.match(/data-original="(.*?)"/)[1]; const filename = svgLink.split("/")[5]; const text = div.match(/<div class="zy">(.*?)<\/div>/)[1]; if (filename === ".svg") return; SOJsvgLinks.push({ svgLink, filename, text }); }); }
    const response4 = await axios.get(`https://www.zdic.net/hans/${zChar}`, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko,en;q=0.9,en-US;q=0.8" } });
    const HESsvgLinks = [];
    const divs4 = response4.data.match(/<div class="zx">.*?<\/div>/g);
    if (divs4) { let i = 0; divs4.forEach(div => { if (i >= maxDownloads) return; i++; const svgLink = div.match(/data-original="(.*?)"/)[1]; const filename = svgLink.split("/")[4] + "-" + svgLink.split("/")[5]; const text = div.match(/<div class="zx">(.*?)<\/div>/)[1]; if (filename === ".svg") return; HESsvgLinks.push({ svgLink, filename, text }); }); }
    const divs3_add = response4.data.match(/<div class="swnr">.*?<\/div>/gs);
    if (divs3_add) { let i = 0; divs3_add.forEach(div => { if (i + SOJsvgLinks.length >= maxDownloads) return; i++; const match = div.match(/data-original="(.*?)"/); if (!match) return; const svgLink = match[1]; const filename = svgLink.split("/")[3] + "-" + svgLink.split("/")[4]; const text = "설문해자 추가"; if (svgLink.indexOf("swxz") === -1) return; if (filename === ".svg") return; SOJsvgLinks.push({ svgLink, filename, text, "error": false }); }); }
    const downloadFiles = async (links, folder) => {
      for (let link of links) {
        try {
          const svgUrl = "https:" + link.svgLink;
          const filePath = path.join("./public/download", folder, link.filename);
          const writer = fs.createWriteStream(filePath);
          const response = await axios.get(svgUrl, { responseType: "stream" });
          response.data.pipe(writer);
        } catch (err) { console.log("Error while downloadFiles: ", link, folder); link.error = true; }
      }
    };
    await Promise.all([downloadFiles(GAPsvgLinks, "GAP"), downloadFiles(GUMsvgLinks, "GUM"), downloadFiles(SOJsvgLinks, "SOJ"), downloadFiles(HESsvgLinks, "HES")]);
    let svgDict = { "GAP": GAPsvgLinks, "GUM": GUMsvgLinks, "SOJ": SOJsvgLinks, "HES": HESsvgLinks };
    const baseDir = path.join('./public', 'download');
    const keys = ['GAP', 'GUM', 'SOJ', 'HES'];
    for (const key of keys) {
      const folderPath = path.join(baseDir, key);
      const items = svgDict[key];
      for (let i = 0; i < items.length; i++) {
        const fileData = items[i];
        if (fileData.error) continue;
        const oldFilename = fileData.filename;
        const svgPath = path.join(folderPath, oldFilename);
        const newFilename = oldFilename.replace(/\.svg$/i, '.png');
        const pngPath = path.join(folderPath, newFilename);
        try {
          const { data, info } = await sharp(svgPath).resize(1024, 1024).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
          const pixelCount = info.width * info.height;
          const newBuffer = Buffer.alloc(pixelCount * 4);
          for (let j = 0; j < pixelCount; j++) {
            const r = data[j*4+0], g = data[j*4+1], b = data[j*4+2], a = data[j*4+3];
            const isBlack = r < 25 && g < 25 && b < 25;
            if (!(isBlack && a > 25)) { newBuffer[j*4+0]=255; newBuffer[j*4+1]=255; newBuffer[j*4+2]=255; newBuffer[j*4+3]=0; }
            else { newBuffer[j*4+0]=0; newBuffer[j*4+1]=0; newBuffer[j*4+2]=0; newBuffer[j*4+3]=255; }
          }
          await sharp(newBuffer, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(pngPath);
          fs.unlinkSync(svgPath);
          fileData.filename = newFilename;
        } catch (err) { console.error(`Error processing ${svgPath}:`, err); return res.status(500).json({ error: `Failed to process ${oldFilename}` }); }
      }
    }
    res.json(svgDict);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "서버에서 처리하는 동안 오류가 발생했습니다." });
  }
});

try {
  app.listen(PORT, hostname, () => {
    console.log(`🚀 Server listening on http://${hostname}:${PORT}`);
  });
} catch (error) {
  console.error("Error starting the server:", error);
}
