import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

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

try {
  app.listen(PORT, hostname, () => {
    console.log(`Server listening on http://${hostname}:${PORT}`);
  });
} catch (error) {
  console.error('Error starting the server:', error);
}
