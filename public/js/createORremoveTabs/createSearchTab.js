import { remove_searchTab } from "./removeSearchTab.js";

function setEvent_searchTab_panel(el_tabContent, el_tabButtons, sT_panel) {
  //// Canvas 관련 기능 (inline - 모듈화 이전)
  const btnPen    = sT_panel.querySelector("#btnPen");
  const btnErase  = sT_panel.querySelector("#btnErase");
  const btnClear  = sT_panel.querySelector("#btnClear");
  const ocrCanvas = sT_panel.querySelector("#ocrCanvas");
  const ctx       = ocrCanvas.getContext("2d");

  let drawing = false, currentStroke = [], strokes = [], canvasMode = "pen";

  btnPen.disabled = true; btnErase.disabled = false;

  btnPen.addEventListener("click", () => { canvasMode = "pen";   btnPen.disabled = true;  btnErase.disabled = false; });
  btnErase.addEventListener("click", () => { canvasMode = "erase"; btnPen.disabled = false; btnErase.disabled = true;  });
  btnClear.addEventListener("click", () => {
    strokes = []; ctx.clearRect(0, 0, ocrCanvas.width, ocrCanvas.height); runOCR([]);
    if (canvasMode === "erase") { canvasMode = "pen"; btnPen.disabled = true; btnErase.disabled = false; }
  });

  function getPos(e) {
    if (e.touches) { const r = ocrCanvas.getBoundingClientRect(); return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }; }
    return { x: e.offsetX, y: e.offsetY };
  }
  function redraw() {
    ctx.clearRect(0, 0, ocrCanvas.width, ocrCanvas.height);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; ctx.lineCap = "round";
    for (const s of strokes) {
      if (s.length < 2) continue;
      ctx.beginPath(); ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    }
  }
  function distSeg(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    if (!dx && !dy) return Math.hypot(p.x - a.x, p.y - a.y);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }
  function eraseAt(pos) {
    for (let i = 0; i < strokes.length; i++)
      for (let j = 0; j < strokes[i].length - 1; j++)
        if (distSeg(pos, strokes[i][j], strokes[i][j + 1]) <= 10) { strokes.splice(i, 1); redraw(); runOCR(strokes); return; }
  }

  function startDraw(e) {
    if (canvasMode !== "pen") return;
    drawing = true; currentStroke = [getPos(e)];
    ctx.fillStyle = "#ffffff"; const p = currentStroke[0]; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
    e.preventDefault();
  }
  function moveDraw(e) {
    if (canvasMode === "erase") { eraseAt(getPos(e)); e.preventDefault(); return; }
    if (!drawing || canvasMode !== "pen") return;
    const pos = getPos(e);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
    currentStroke.push(pos); e.preventDefault();
  }
  function endDraw(e) {
    if (!drawing || canvasMode !== "pen") return;
    drawing = false;
    if (currentStroke.length > 1) { strokes.push(currentStroke); runOCR(strokes); }
    currentStroke = []; e.preventDefault();
  }

  ocrCanvas.addEventListener("mousedown",  startDraw);
  ocrCanvas.addEventListener("mousemove",  moveDraw);
  ocrCanvas.addEventListener("mouseup",    endDraw);
  ocrCanvas.addEventListener("mouseleave", endDraw);
  ocrCanvas.addEventListener("touchstart", startDraw, { passive: false });
  ocrCanvas.addEventListener("touchmove",  moveDraw,  { passive: false });
  ocrCanvas.addEventListener("touchend",   endDraw);

  //// OCR
  function compress(raw) { return raw.map(s => ({ s: s.length, xy: s.map(p => [Math.floor(p.x * (283 / 399)), Math.floor(p.y * (283 / 399))]) })); }
  function buildStr(info) {
    let s = "%3DR%20" + info.length;
    info.forEach(stroke => { s += "%0A%3DS%20" + stroke.s + "%0A"; stroke.xy.forEach(([x, y]) => s += x + "%20" + y + "%20"); });
    return s;
  }

  const ocrResultTable = sT_panel.querySelector("#ocrResultTable");

  async function runOCR(raw) {
    const cells = ocrResultTable.querySelectorAll("td");
    if (!raw || !raw.length) { cells.forEach(c => c.innerHTML = ""); return; }
    try {
      const res = await fetch("/api/ocr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inputStr: buildStr(compress(raw)) }) });
      const data = await res.json();
      const items = data.content.split(";").filter(Boolean);
      cells.forEach(c => c.innerHTML = ""); let idx = 0;
      for (let i = 0; i < Math.min(items.length, 20); i++) {
        const [char, desc] = items[i].split(","); if (!desc) continue;
        cells[idx++].innerHTML = `<div style="font-size:40px;color:gold;text-align:center">${char}</div><div style="font-size:18px;text-align:center">${desc}</div>`;
      }
    } catch (err) { console.error("OCR 요청 실패:", err); }
  }

  //// Table 관련 기능
  const searchText = sT_panel.querySelector("#searchText");

  ocrResultTable.querySelectorAll("td").forEach(cell => {
    cell.addEventListener("click", () => { if (cell.innerHTML.trim()) { const d = cell.querySelectorAll("div"); if (d.length) searchText.value += d[0].textContent.trim(); } });
    cell.addEventListener("touchstart", e => { if (cell.innerHTML.trim()) { const d = cell.querySelectorAll("div"); if (d.length) searchText.value += d[0].textContent.trim(); } e.preventDefault(); }, { passive: false });
  });

  sT_panel.querySelector("#btnTextEraseL").addEventListener("click", () => searchText.value = searchText.value.slice(1));
  sT_panel.querySelector("#btnTextEraseR").addEventListener("click", () => searchText.value = searchText.value.slice(0, -1));
  sT_panel.querySelector("#btnTextReset").addEventListener("click",  () => searchText.value = "");
  sT_panel.querySelector("#btnCopyText").addEventListener("click", async () => { searchText.focus(); searchText.select(); return new Promise((res, rej) => { document.execCommand('copy') ? res() : rej(); }); });

  sT_panel.querySelector("#btnSearchN").addEventListener("click", () => {
    const q = searchText.value.trim();
    if (q) window.open("https://hanja.dict.naver.com/#/search?query=" + encodeURIComponent(q), "_blank");
  });

  // Zdic: char 탭 미구현 — 서버 요청 결과만 콘솔 확인
  sT_panel.querySelector("#btnSearchZ").addEventListener("click", async () => {
    const t = searchText.value.trim(); if (!t) return;
    const zChar = t[t.length - 1];
    try {
      const response = await fetch('/zChar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zChar }) });
      if (!response.ok) throw new Error("서버 요청에 실패했습니다.");
      const pngDict = await response.json();
      console.log(pngDict);
    } catch (error) { alert(error.message); }
  });

  const TA_1 = sT_panel.querySelector("#TA_1");
  const TA_2 = sT_panel.querySelector("#TA_2");

  sT_panel.querySelector("#btnExtractMP").addEventListener("click", async () => {
    const sText = searchText.value.trim(); if (!sText) { alert("검색어가 비어 있습니다."); return; }
    try {
      const res = await fetch("/api/ExtractMP", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: sText }) });
      const result = await res.json(); const d = result["data"];
      TA_1.value = d["MP"]; TA_2.value = JSON.parse(d["learningMoreList"]).join("\n\n");
    } catch (err) { alert("❌ 네트워크 오류: " + err.message); }
  });

  sT_panel.querySelector("#btnExtractWords").addEventListener("click", async () => {
    const sText = searchText.value.trim(); if (!sText) { alert("검색어가 비어 있습니다."); return; }
    try {
      const res = await fetch("/api/ExtractWords", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: sText }) });
      const result = await res.json(); const d = result["data"];
      TA_1.value = d["Words"]; TA_2.value = d["Idioms"];
    } catch (err) { alert("❌ 네트워크 오류: " + err.message); }
  });

  sT_panel.querySelector("#btnCopyText1").addEventListener("click", async () => { TA_1.focus(); TA_1.select(); return new Promise((res, rej) => { document.execCommand('copy') ? res() : rej(); }); });
  sT_panel.querySelector("#btnCopyText2").addEventListener("click", async () => { TA_2.focus(); TA_2.select(); return new Promise((res, rej) => { document.execCommand('copy') ? res() : rej(); }); });

  const main = document.getElementById("mainTabComponent");
  const tabContent = main.querySelector(".tab-content");
  const tabButtons = main.querySelector(".tab-buttons");
  sT_panel.querySelector("#btnReplicate").addEventListener("click", () => create_searchTab(tabContent, tabButtons));
  sT_panel.querySelector("#btnCancel").addEventListener("click", () => remove_searchTab(sT_panel));
}

export function create_searchTab(el_tabContent, el_tabButtons) {
  el_tabButtons.querySelectorAll('.tab-button.active').forEach(btn => { btn.className = 'tab-button'; });
  el_tabContent.querySelectorAll('.tab-panel.active').forEach(panel => { panel.className = 'tab-panel'; });

  const tabPanel = document.createElement('div');
  tabPanel.id = 'searchTab';
  tabPanel.className = 'tab-panel active';
  tabPanel.dataset.index = el_tabContent.querySelectorAll(".tab-panel").length;
  tabPanel.innerHTML = `
    <canvas id="ocrCanvas" width="400" height="400" data-canvas-mode="pen" data-strokes="[]"></canvas>

    <button id="btnPen"   style="position:absolute;left:214px;top:480px;width:130px;height:100px;margin:45px auto auto 0">Pen</button>
    <button id="btnErase" style="position:absolute;left:344px;top:480px;width:130px;height:100px;margin:45px auto auto auto">Erase</button>
    <button id="btnClear" style="position:absolute;left:474px;top:480px;width:130px;height:100px;margin:45px auto auto auto">Clear</button>

    <table id="ocrResultTable" style="position:absolute;bottom:100px;left:50px;">
      <tbody>
        <tr><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td></td><td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>

    <button id="btnTextEraseL" style="position:absolute;bottom:450px;right:260px;width:70px;height:50px;">&gt;</button>
    <button id="btnTextReset"  style="position:absolute;bottom:450px;right:120px;width:140px;height:50px;">reset</button>
    <button id="btnTextEraseR" style="position:absolute;bottom:450px;right:50px;width:70px;height:50px;">&lt;</button>

    <input type="text" id="searchText" style="position:absolute;bottom:350px;right:50px;width:280px;height:100px;" />
    <button id="btnCopyText" style="position:absolute;bottom:312.5px;right:50px;width:280px;height:37.5px;font-size:25px;">Copy text</button>
    <button id="btnSearchN"  style="position:absolute;bottom:212.5px;right:190px;width:140px;height:100px;">Naver</button>
    <button id="btnSearchZ"  style="position:absolute;bottom:212.5px;right:50px;width:140px;height:100px;">Zdic</button>

    <button id="btnExtractMP"    style="position:absolute;bottom:156.25px;right:190px;width:140px;height:56.25px;font-size:20px;">extract MP/D</button>
    <button id="btnCopyText1"    style="position:absolute;bottom:100px;right:190px;width:140px;height:56.25px;font-size:25px;line-height:20px">Copy 1</button>
    <button id="btnExtractWords" style="position:absolute;bottom:156.25px;right:50px;width:140px;height:56.25px;font-size:20px;">extract Words</button>
    <button id="btnCopyText2"    style="position:absolute;bottom:100px;right:50px;width:140px;height:56.25px;font-size:25px;line-height:20px">Copy 2</button>

    <textarea id="TA_1" style="position:absolute;bottom:30px;left:49px;width:345px;height:50px;font-size:15px;line-height:1.2;"></textarea>
    <textarea id="TA_2" style="position:absolute;bottom:30px;left:419px;width:345px;height:50px;font-size:15px;line-height:1.2;"></textarea>

    <button id="btnReplicate" style="position:absolute;top:20px;left:20px;width:100px;height:100px;">R</button>
    <button id="btnCancel" disabled style="position:absolute;top:20px;right:20px;width:100px;height:100px;">X</button>
  `;
  el_tabContent.appendChild(tabPanel);

  const tabButton = document.createElement('button');
  tabButton.className = 'tab-button active';
  tabButton.dataset.tab = 'searchTab';
  tabButton.dataset.index = el_tabButtons.querySelectorAll(".tab-button").length;
  tabButton.innerText = 'Search';
  el_tabButtons.appendChild(tabButton);

  tabButton.addEventListener('click', () => {
    el_tabButtons.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    el_tabContent.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    tabButton.classList.add('active');
    tabPanel.classList.add('active');
  });

  const tabPanels = el_tabContent.querySelectorAll(".tab-panel");
  const count = [...tabPanels].filter(panel => panel.id === 'searchTab').length;
  if (count >= 2) {
    tabPanels.forEach(tab => {
      if (tab.id !== "searchTab") return;
      const btn = tab.querySelector("#btnCancel");
      if (btn) btn.disabled = false;
    });
  }

  setEvent_searchTab_panel(el_tabContent, el_tabButtons, tabPanel);
}
