// createSearchTab.js
import { setupModeSwitcher } from "../modeSwitcher.js";
import { setupCanvasDraw } from "../canvasDraw.js";
import { setupCanvasErase } from "../canvasErase.js";
import { remove_searchTab } from "./removeSearchTab.js";
import { create_charTab } from "./createCharTab.js";

function setEvent_searchTab_panel(el_tabContent, el_tabButtons, sT_panel) {
  //// Canvas 관련 기능
  const btnPen    = sT_panel.querySelector("#btnPen");
  const btnErase  = sT_panel.querySelector("#btnErase");
  const btnClear  = sT_panel.querySelector("#btnClear");
  const ocrCanvas = sT_panel.querySelector("#ocrCanvas");

  setupModeSwitcher(ocrCanvas, btnPen, btnErase, btnClear);
  setupCanvasDraw(ocrCanvas);
  setupCanvasErase(ocrCanvas);

  //// Table 관련 기능
  const ocrResultTable = sT_panel.querySelector("#ocrResultTable");
  const searchText     = sT_panel.querySelector("#searchText");

  function handleCellTap(cell) {
    if (cell.innerHTML.trim() !== "") {
      const divs = cell.querySelectorAll("div");
      if (divs.length > 0) {
        const firstLine = divs[0].textContent.trim();
        searchText.value += firstLine;
      }
    }
  }

  ocrResultTable.querySelectorAll("td").forEach((cell) => {
    cell.addEventListener("click", () => handleCellTap(cell));
    cell.addEventListener("touchstart", (e) => { handleCellTap(cell); e.preventDefault(); }, { passive: false });
  });

  const btnTextEraseLeft  = sT_panel.querySelector("#btnTextEraseL");
  const btnTextEraseRight = sT_panel.querySelector("#btnTextEraseR");
  const btnTextReset      = sT_panel.querySelector("#btnTextReset");

  btnTextEraseLeft.addEventListener("click",  () => searchText.value = searchText.value.slice(1));
  btnTextEraseRight.addEventListener("click", () => searchText.value = searchText.value.slice(0, -1));
  btnTextReset.addEventListener("click",      () => searchText.value = "");

  sT_panel.querySelector("#btnCopyText").addEventListener("click", async () => {
    searchText.focus(); searchText.select();
    return new Promise((res, rej) => { document.execCommand('copy') ? res() : rej(); });
  });

  sT_panel.querySelector("#btnSearchN").addEventListener("click", () => {
    const query = searchText.value.trim();
    if (query) {
      const url = "https://hanja.dict.naver.com/#/search?query=" + encodeURIComponent(query);
      window.open(url, "_blank");
    }
  });

  sT_panel.querySelector("#btnSearchZ").addEventListener("click", async () => {
    const t = searchText.value.trim();
    if (!t) return;
    const zChar = t[t.length - 1];
    try {
      const response = await fetch('/zChar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zChar }),
      });
      if (!response.ok) throw new Error("서버 요청에 실패했습니다.");
      const pngDict = await response.json();
      console.log(pngDict);
      create_charTab(el_tabContent, el_tabButtons, zChar, pngDict);
    } catch (error) { alert(error.message); }
  });

  const TA_1 = sT_panel.querySelector("#TA_1");
  const TA_2 = sT_panel.querySelector("#TA_2");

  sT_panel.querySelector("#btnExtractMP").addEventListener("click", async () => {
    const sText = searchText.value.trim();
    if (!sText) { alert("검색어가 비어 있습니다."); return; }
    try {
      const res = await fetch("/api/ExtractMP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sText })
      });
      const result = await res.json();
      const parseResult = result["data"];
      TA_1.value = parseResult["MP"];
      TA_2.value = JSON.parse(parseResult["learningMoreList"]).join("\n\n");
    } catch (err) { alert("❌ 네트워크 오류: " + err.message); }
  });

  sT_panel.querySelector("#btnExtractWords").addEventListener("click", async () => {
    const sText = searchText.value.trim();
    if (!sText) { alert("검색어가 비어 있습니다."); return; }
    try {
      const res = await fetch("/api/ExtractWords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sText })
      });
      const result = await res.json();
      const parseResult = result["data"];
      TA_1.value = parseResult["Words"];
      TA_2.value = parseResult["Idioms"];
    } catch (err) { alert("❌ 네트워크 오류: " + err.message); }
  });

  sT_panel.querySelector("#btnCopyText1").addEventListener("click", async () => { TA_1.focus(); TA_1.select(); return new Promise((res, rej) => { document.execCommand('copy') ? res() : rej(); }); });
  sT_panel.querySelector("#btnCopyText2").addEventListener("click", async () => { TA_2.focus(); TA_2.select(); return new Promise((res, rej) => { document.execCommand('copy') ? res() : rej(); }); });

  const main = document.getElementById("mainTabComponent");
  const tabContent = main.querySelector(".tab-content");
  const tabButtons = main.querySelector(".tab-buttons");
  sT_panel.querySelector("#btnReplicate").addEventListener("click", () => create_searchTab(tabContent, tabButtons));
  sT_panel.querySelector("#btnCancel").addEventListener("click",    () => remove_searchTab(sT_panel));
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

    <button id="btnPen"   style="position: absolute; left: 214px; top: 480px; width: 130px; height: 100px; margin: 45px auto auto 0">Pen</button>
    <button id="btnErase" style="position: absolute; left: 344px; top: 480px; width: 130px; height: 100px; margin: 45px auto auto auto">Erase</button>
    <button id="btnClear" style="position: absolute; left: 474px; top: 480px; width: 130px; height: 100px; margin: 45px auto auto auto">Clear</button>

    <table id="ocrResultTable" style="position: absolute; bottom: 100px; left: 50px;">
      <tbody>
        <tr><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td></td><td></td><td></td><td></td><td></td></tr>
        <tr><td></td><td></td><td></td><td></td><td></td></tr>
      </tbody>
    </table>

    <button id="btnTextEraseL" style="position: absolute; bottom: 450px; right: 260px; width: 70px; height: 50px;">&gt;</button>
    <button id="btnTextReset"  style="position: absolute; bottom: 450px; right: 120px; width: 140px; height: 50px;">reset</button>
    <button id="btnTextEraseR" style="position: absolute; bottom: 450px; right: 50px; width: 70px; height: 50px;">&lt;</button>

    <input type="text" id="searchText" style="position: absolute; bottom: 350px; right: 50px; width: 280px; height: 100px;" />

    <button id="btnCopyText" style="position: absolute; bottom: 312.5px; right: 50px; width: 280px; height: 37.5px; font-size: 25px;">Copy text</button>
    <button id="btnSearchN"  style="position: absolute; bottom: 212.5px; right: 190px; width: 140px; height: 100px;">Naver</button>
    <button id="btnSearchZ"  style="position: absolute; bottom: 212.5px; right: 50px; width: 140px; height: 100px;">Zdic</button>

    <button id="btnExtractMP"    style="position: absolute; bottom: 156.25px; right: 190px; width: 140px; height: 56.25px; font-size: 20px;">extract MP/D</button>
    <button id="btnCopyText1"    style="position: absolute; bottom: 100px; right: 190px; width: 140px; height: 56.25px; font-size: 25px; line-height: 20px">Copy 1</button>

    <button id="btnExtractWords" style="position: absolute; bottom: 156.25px; right: 50px; width: 140px; height: 56.25px; font-size: 20px;">extract Words</button>
    <button id="btnCopyText2"    style="position: absolute; bottom: 100px; right: 50px; width: 140px; height: 56.25px; font-size: 25px; line-height: 20px">Copy 2</button>

    <textarea id="TA_1" style="position: absolute; bottom: 30px; left: 49px; width: 345px; height: 50px; font-size: 15px; line-height: 1.2;"></textarea>
    <textarea id="TA_2" style="position: absolute; bottom: 30px; left: 419px; width: 345px; height: 50px; font-size: 15px; line-height: 1.2;"></textarea>

    <button id="btnReplicate" style="position: absolute; top: 20px; left: 20px; width: 100px; height: 100px;">R</button>
    <button id="btnCancel" disabled style="position: absolute; top: 20px; right: 20px; width: 100px; height: 100px;">X</button>
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
