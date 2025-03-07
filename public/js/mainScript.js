document.addEventListener("DOMContentLoaded", () => {
  console.log("mainScript.js loaded");

  const btnPen   = document.getElementById("btnPen");
  const btnErase = document.getElementById("btnErase");
  const btnClear = document.getElementById("btnClear");
  const ocrCanvas = document.getElementById("ocrCanvas");
  const ctx = ocrCanvas.getContext("2d");

  let currentMode = "pen";
  let isDrawing   = false;
  let currentStroke = [];
  let strokes = [];

  btnPen.disabled  = true;
  btnErase.disabled = false;

  function switchMode(mode) {
    currentMode = mode;
    btnPen.disabled   = (mode === "pen");
    btnErase.disabled = (mode === "erase");
  }

  btnPen.addEventListener("click",   () => switchMode("pen"));
  btnErase.addEventListener("click", () => switchMode("erase"));
  btnClear.addEventListener("click", () => {
    strokes = [];
    ctx.clearRect(0, 0, ocrCanvas.width, ocrCanvas.height);
    runOCR([]);
    if (currentMode === "erase") switchMode("pen");
  });

  function getMousePos(e) {
    const rect = ocrCanvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function drawLine(points) {
    if (points.length < 2) return;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 5;
    ctx.lineCap     = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }

  function redrawCanvas() {
    ctx.clearRect(0, 0, ocrCanvas.width, ocrCanvas.height);
    for (const stroke of strokes) drawLine(stroke);
  }

  function distanceToSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    if (dx === 0 && dy === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  function eraseAt(pos) {
    for (let i = 0; i < strokes.length; i++) {
      for (let j = 0; j < strokes[i].length - 1; j++) {
        if (distanceToSegment(pos, strokes[i][j], strokes[i][j + 1]) <= 10) {
          strokes.splice(i, 1);
          redrawCanvas();
          runOCR(strokes);
          return;
        }
      }
    }
  }

  ocrCanvas.addEventListener("mousedown", e => {
    const pos = getMousePos(e);
    if (currentMode === "pen") { isDrawing = true; currentStroke = [pos]; }
    else if (currentMode === "erase") eraseAt(pos);
  });

  ocrCanvas.addEventListener("mousemove", e => {
    const pos = getMousePos(e);
    if (currentMode === "pen" && isDrawing) {
      currentStroke.push(pos);
      drawLine(currentStroke.slice(-2));
    } else if (currentMode === "erase") {
      eraseAt(pos);
    }
  });

  function endStroke() {
    if (!isDrawing) return;
    if (currentStroke.length > 1) {
      strokes.push(currentStroke);
      runOCR(strokes);
    }
    isDrawing = false;
    currentStroke = [];
  }

  window.addEventListener("mouseup", endStroke);
  ocrCanvas.addEventListener("mouseleave", endStroke);

  // OCR
  function compressStrokes(rawStrokes) {
    return rawStrokes.map(stroke => ({
      s: stroke.length,
      xy: stroke.map(p => [Math.floor(p.x * (283 / 399)), Math.floor(p.y * (283 / 399))])
    }));
  }

  function buildInputStr(infoStroke) {
    let s = "%3DR%20" + infoStroke.length;
    infoStroke.forEach(stroke => {
      s += "%0A%3DS%20" + stroke.s + "%0A";
      stroke.xy.forEach(([x, y]) => s += x + "%20" + y + "%20");
    });
    return s;
  }

  const ocrResultTable = document.getElementById("ocrResultTable");

  async function runOCR(rawStrokes) {
    const cells = ocrResultTable.querySelectorAll("td");

    if (!rawStrokes || rawStrokes.length === 0) {
      cells.forEach(c => c.innerHTML = "");
      return;
    }

    const inputStr = buildInputStr(compressStrokes(rawStrokes));

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputStr })
      });
      const data = await res.json();
      const items = data.content.split(";").filter(Boolean);

      cells.forEach(c => c.innerHTML = "");
      let idx = 0;
      for (let i = 0; i < Math.min(items.length, 20); i++) {
        const [char, desc] = items[i].split(",");
        if (!desc) continue;
        cells[idx].innerHTML = `<div style="font-size:40px;color:gold;text-align:center">${char}</div><div style="font-size:18px;text-align:center">${desc}</div>`;
        idx++;
      }
    } catch (err) {
      console.error("OCR 요청 실패:", err);
    }
  }
});
