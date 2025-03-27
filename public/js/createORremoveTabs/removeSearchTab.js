
// html 요소(searchTab) 제거
export function remove_searchTab(sT_panel) {
  const main = document.getElementById("mainTabComponent");
  const tabContent = main.querySelector(".tab-content");
  const tabButtons = main.querySelector(".tab-buttons");

  tabContent.querySelectorAll('.tab-panel.active').forEach(panel => { panel.className = 'tab-panel'; });
  tabButtons.querySelectorAll('.tab-button.active').forEach(btn => { btn.className = 'tab-button'; });

  const tabALLPanels  = tabContent.querySelectorAll(".tab-panel");
  const tabALLButtons = tabButtons.querySelectorAll(".tab-button");

  if (Number(sT_panel.dataset.index) === 0) {
    Array.from(tabALLPanels).find(el => Number(el.dataset.index) === 1).className = "tab-panel active";
    Array.from(tabALLButtons).find(el => Number(el.dataset.index) === 1).className = "tab-button active";
  } else {
    const prev = Number(sT_panel.dataset.index) - 1;
    Array.from(tabALLPanels).find(el => Number(el.dataset.index) === prev).className = "tab-panel active";
    Array.from(tabALLButtons).find(el => Number(el.dataset.index) === prev).className = "tab-button active";
  }

  const count = [...tabALLPanels].filter(panel => panel.id === 'searchTab').length;
  if (count === 2) {
    tabALLPanels.forEach(tab => {
      if (tab.id !== "searchTab") return;
      const btn = tab.querySelector("#btnCancel");
      if (btn) btn.disabled = true;
    });
  }

  const curBtn = Array.from(tabALLButtons).find(el => Number(el.dataset.index) === Number(sT_panel.dataset.index));
  curBtn.remove();
  sT_panel.remove();

  let newId = 0;
  tabContent.querySelectorAll(".tab-panel").forEach(tab => { tab.dataset.index = newId++; });
  newId = 0;
  tabButtons.querySelectorAll(".tab-button").forEach(but => { but.dataset.index = newId++; });
}
