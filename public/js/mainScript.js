document.addEventListener("DOMContentLoaded", () => {
  console.log("mainScript.js loaded");

  const btnPen   = document.getElementById("btnPen");
  const btnErase = document.getElementById("btnErase");
  const btnClear = document.getElementById("btnClear");
  const ocrCanvas      = document.getElementById("ocrCanvas");
  const ctx            = ocrCanvas.getContext("2d");
  const searchText     = document.getElementById("searchText");
  const ocrResultTable = document.getElementById("ocrResultTable");
  const TA_1 = document.getElementById("TA_1");
  const TA_2 = document.getElementById("TA_2");

  let currentMode = "pen", isDrawing = false, currentStroke = [], strokes = [];

  btnPen.disabled = true; btnErase.disabled = false;

  function switchMode(mode) {
    currentMode = mode;
    btnPen.disabled = (mode === "pen"); btnErase.disabled = (mode === "erase");
  }
  btnPen.addEventListener("click",   () => switchMode("pen"));
  btnErase.addEventListener("click", () => switchMode("erase"));
  btnClear.addEventListener("click", () => {
    strokes = []; ctx.clearRect(0, 0, ocrCanvas.width, ocrCanvas.height); runOCR([]);
    if (currentMode === "erase") switchMode("pen");
  });

  function getMousePos(e) { const r = ocrCanvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function drawLine(pts) {
    if (pts.length < 2) return;
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
  function redraw() { ctx.clearRect(0, 0, ocrCanvas.width, ocrCanvas.height); strokes.forEach(s => drawLine(s)); }
  function distSeg(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    if (!dx && !dy) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }
  function eraseAt(pos) {
    for (let i = 0; i < strokes.length; i++)
      for (let j = 0; j < strokes[i].length - 1; j++)
        if (distSeg(pos, strokes[i][j], strokes[i][j+1]) <= 10) {
          strokes.splice(i, 1); redraw(); runOCR(strokes); return;
        }
  }
  ocrCanvas.addEventListener("mousedown", e => {
    const pos = getMousePos(e);
    if (currentMode === "pen") { isDrawing = true; currentStroke = [pos]; }
    else eraseAt(pos);
  });
  ocrCanvas.addEventListener("mousemove", e => {
    const pos = getMousePos(e);
    if (currentMode === "pen" && isDrawing) { currentStroke.push(pos); drawLine(currentStroke.slice(-2)); }
    else if (currentMode === "erase") eraseAt(pos);
  });
  function endStroke() {
    if (!isDrawing) return;
    if (currentStroke.length > 1) { strokes.push(currentStroke); runOCR(strokes); }
    isDrawing = false; currentStroke = [];
  }
  window.addEventListener("mouseup", endStroke);
  ocrCanvas.addEventListener("mouseleave", endStroke);

  function compress(raw) { return raw.map(s => ({ s: s.length, xy: s.map(p => [Math.floor(p.x*(283/399)), Math.floor(p.y*(283/399))]) })); }
  function buildStr(info) {
    let s = "%3DR%20" + info.length;
    info.forEach(stroke => { s += "%0A%3DS%20" + stroke.s + "%0A"; stroke.xy.forEach(([x,y]) => s += x + "%20" + y + "%20"); });
    return s;
  }
  async function runOCR(raw) {
    const cells = ocrResultTable.querySelectorAll("td");
    if (!raw || !raw.length) { cells.forEach(c => c.innerHTML = ""); return; }
    try {
      const res = await fetch("/api/ocr", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ inputStr: buildStr(compress(raw)) }) });
      const data = await res.json();
      const items = data.content.split(";").filter(Boolean);
      cells.forEach(c => c.innerHTML = "");
      let idx = 0;
      for (let i = 0; i < Math.min(items.length, 20); i++) {
        const [char, desc] = items[i].split(",");
        if (!desc) continue;
        cells[idx++].innerHTML = `<div style="font-size:40px;color:gold;text-align:center">${char}</div><div style="font-size:18px;text-align:center">${desc}</div>`;
      }
    } catch (err) { console.error("OCR 실패:", err); }
  }

  ocrResultTable.querySelectorAll("td").forEach(cell => {
    cell.addEventListener("click", () => {
      if (cell.innerHTML.trim()) { const d = cell.querySelectorAll("div"); if (d.length) searchText.value += d[0].textContent.trim(); }
    });
  });

  document.getElementById("btnTextEraseL").addEventListener("click", () => searchText.value = searchText.value.slice(1));
  document.getElementById("btnTextEraseR").addEventListener("click", () => searchText.value = searchText.value.slice(0, -1));
  document.getElementById("btnTextReset").addEventListener("click",  () => searchText.value = "");
  document.getElementById("btnCopyText").addEventListener("click",   () => { searchText.focus(); searchText.select(); document.execCommand("copy"); });

  document.getElementById("btnSearchN").addEventListener("click", () => {
    const q = searchText.value.trim();
    if (q) window.open("https://hanja.dict.naver.com/#/search?query=" + encodeURIComponent(q), "_blank");
  });

  document.getElementById("btnExtractMP").addEventListener("click", async () => {
    const sText = searchText.value.trim();
    if (!sText) { alert("검색어가 비어 있습니다."); return; }
    try {
      const res = await fetch("/api/ExtractMP", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: sText }) });
      const result = await res.json();
      const d = result["data"];
      TA_1.value = d["MP"];
      TA_2.value = JSON.parse(d["learningMoreList"]).join("\n\n");
    } catch (err) { alert("네트워크 오류: " + err.message); }
  });

  document.getElementById("btnExtractWords").addEventListener("click", async () => {
    const sText = searchText.value.trim();
    if (!sText) { alert("검색어가 비어 있습니다."); return; }
    try {
      const res = await fetch("/api/ExtractWords", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ text: sText }) });
      const result = await res.json();
      const d = result["data"];
      TA_1.value = d["Words"];
      TA_2.value = d["Idioms"];
    } catch (err) { alert("네트워크 오류: " + err.message); }
  });

  document.getElementById("btnCopyText1").addEventListener("click", () => { TA_1.focus(); TA_1.select(); document.execCommand("copy"); });
  document.getElementById("btnCopyText2").addEventListener("click", () => { TA_2.focus(); TA_2.select(); document.execCommand("copy"); });
});
