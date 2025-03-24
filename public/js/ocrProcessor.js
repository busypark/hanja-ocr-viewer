// js/ocrProcessor.js

function compressStrokes(rawStrokes) {
  return rawStrokes.map(stroke => {
    const compressed = {
      s: stroke.length,
      xy: stroke.points.map(([x, y]) => [
        Math.floor(x * (283 / 399)),
        Math.floor(y * (283 / 399)),
      ]),
    };
    return compressed;
  });
}

function buildInputStr(infoStroke) {
  let inputStr = "%3DR%20" + infoStroke.length;
  infoStroke.forEach(stroke => {
    inputStr += "%0A%3DS%20" + stroke.s + "%0A";
    stroke.xy.forEach(([x, y]) => {
      inputStr += x + "%20" + y + "%20";
    });
  });
  return inputStr;
}

export async function runOCR(tabPanel, strokes) {
  if (!strokes || strokes.length === 0) {
    const cells = tabPanel.querySelector("#ocrResultTable").querySelectorAll("td");
    for (let i = 0; i < 20; i++) cells[i].innerHTML = "";
    return;
  }

  const infoStroke = compressStrokes(strokes);
  const inputStr   = buildInputStr(infoStroke);

  try {
    const response = await fetch("/api/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "inputStr": inputStr })
    });

    const data    = await response.json();
    const content = data.content;
    const items   = content.split(";").filter(Boolean);
    const maxItems = Math.min(items.length, 20);

    const table = tabPanel.querySelector("#ocrResultTable");
    const cells = table.querySelectorAll("td");

    let idx = 0;
    for (let i = 0; i < maxItems; i++) {
      const [char, desc] = items[i].split(",");
      if (desc === undefined) continue;
      cells[idx].innerHTML = `
      <div style="font-size: 40px; color: gold; text-align: center;">${char}</div>
      <div style="font-size: 18px; text-align: center;">${desc}</div>
      `;
      idx++;
    }
    for (let i = maxItems; i < 20; i++) cells[i].innerHTML = "";
  } catch (err) {
    console.error("🛑 OCR 요청 실패:", err);
  }
}
