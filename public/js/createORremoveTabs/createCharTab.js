import { remove_charTab } from "./removeCharTab.js";

export function setEvent_charTab_panel(tabPanel) {
  const btn256  = tabPanel.querySelector("#btn256");
  const btn512  = tabPanel.querySelector("#btn512");
  const btn1024 = tabPanel.querySelector("#btn1024");

  btn256.addEventListener('click', () => { btn256.disabled=true;  btn512.disabled=false; btn1024.disabled=false; tabPanel.dataset.imageResolution=256;  });
  btn512.addEventListener('click', () => { btn256.disabled=false; btn512.disabled=true;  btn1024.disabled=false; tabPanel.dataset.imageResolution=512;  });
  btn1024.addEventListener('click',() => { btn256.disabled=false; btn512.disabled=false; btn1024.disabled=true;  tabPanel.dataset.imageResolution=1024; });

  tabPanel.querySelector("#btnCancel").addEventListener('click', () => remove_charTab(tabPanel));
}

export function create_charTab(el_tabContent, el_tabButtons, zChar, pngDict) {
  el_tabButtons.querySelectorAll('.tab-button.active').forEach(btn => { btn.className = 'tab-button'; });
  el_tabContent.querySelectorAll('.tab-panel.active').forEach(panel => { panel.className = 'tab-panel'; });

  const tabPanel = document.createElement('div');
  tabPanel.id = 'charTab';
  tabPanel.className = 'tab-panel active';
  tabPanel.dataset.index = el_tabContent.querySelectorAll(".tab-panel").length;
  tabPanel.dataset.imageResolution = 512;
  tabPanel.innerHTML = `
    <div id="typeChar" style="left:50px;">갑골문</div>
    <div id="typeChar" style="left:240px;">금문</div>
    <div id="typeChar" style="right:336px;">소전</div>
    <div id="typeChar" style="right:170px;">해서</div>
    <div style="position:absolute;left:38px;top:140px;width:662px;height:5px;background-color:#ccc;"></div>
    <button id="btn256"  style="left:400px;">256</button>
    <button id="btn512"  disabled style="left:540px;">512</button>
    <button id="btn1024" style="left:680px;">1024</button>
    <button id="btnCancel" style="position:absolute;top:20px;right:20px;width:100px;height:100px;">X</button>
  `;
  el_tabContent.appendChild(tabPanel);

  const tabButton = document.createElement('button');
  tabButton.className = 'tab-button active';
  tabButton.dataset.tab = 'charTab';
  tabButton.dataset.index = el_tabButtons.querySelectorAll(".tab-button").length;
  tabButton.innerText = zChar;
  el_tabButtons.appendChild(tabButton);

  tabButton.addEventListener('click', () => {
    el_tabButtons.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    el_tabContent.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    tabButton.classList.add('active');
    tabPanel.classList.add('active');
  });

  const categoryLeftMap = { "GAP": "38px", "GUM": "207px", "SOJ": "376px", "HES": "545px" };
  const keys = ["GAP", "GUM", "SOJ", "HES"];

  keys.forEach(key => {
    const itemList = pngDict[key];
    itemList.forEach((item, index) => {
      if (item.error) return;

      const canvas = document.createElement('canvas');
      canvas.id = 'charCanvas';
      canvas.width = 150; canvas.height = 150;
      canvas.style.position = 'absolute';
      canvas.style.left = categoryLeftMap[key];
      canvas.style.top = `${80 + 200 * index}px`;

      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, 150, 150);
      img.src = `./download/${key}/${item.filename}`;

      canvas.addEventListener("click", function () {
        const imageResolution = Number(this.closest("#charTab").dataset.imageResolution);
        const existingOverlay = document.querySelector(".preview-overlay");
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement("div");
        overlay.classList.add("preview-overlay");
        document.body.appendChild(overlay);

        const previewContainer = document.createElement("div");
        previewContainer.classList.add("preview-container");
        previewContainer.style.width  = `${imageResolution}px`;
        previewContainer.style.height = `${imageResolution}px`;
        previewContainer.style.left = `50px`;
        previewContainer.style.top  = `100px`;

        const previewImg = document.createElement("img");
        const originalImage = new Image();
        originalImage.src = img.src;
        originalImage.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = imageResolution; canvas.height = imageResolution;
          canvas.getContext("2d").drawImage(originalImage, 0, 0, imageResolution, imageResolution);
          previewImg.src = canvas.toDataURL("image/png");
          previewImg.style.width = "100%"; previewImg.style.height = "100%"; previewImg.style.objectFit = "cover";
          previewContainer.appendChild(previewImg);
        };
        overlay.appendChild(previewContainer);

        requestAnimationFrame(() => { overlay.classList.add("show"); previewContainer.classList.add("show"); });

        overlay.addEventListener("click", (e) => {
          if (!previewContainer.contains(e.target)) {
            overlay.classList.remove("show"); previewContainer.classList.remove("show");
            setTimeout(() => overlay.remove(), 300);
          }
        });
      });

      tabPanel.appendChild(canvas);

      const charLabel = document.createElement('div');
      charLabel.id = 'charLabel'; charLabel.width = 150;
      charLabel.innerHTML = item.text;
      charLabel.style.position = 'absolute';
      charLabel.style.left = categoryLeftMap[key];
      charLabel.style.top  = `${320 + 200 * index}px`;

      function checkInsideBrackets(s) {
        const start = s.indexOf('「'), end = s.indexOf('」');
        if (start !== -1 && end !== -1 && start < end) return (s.substring(start + 1, end) === zChar);
        return true;
      }
      charLabel.style.color = checkInsideBrackets(item.text) ? "#ffffff" : "#fff200";
      tabPanel.appendChild(charLabel);
    });
  });

  setEvent_charTab_panel(tabPanel);
  return tabPanel;
}
