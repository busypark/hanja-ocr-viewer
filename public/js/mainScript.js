import { create_searchTab } from "./createORremoveTabs/createSearchTab.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("📦 mainScript.js loaded");
  const main = document.getElementById("mainTabComponent");
  const tabContent = main.querySelector(".tab-content");
  const tabButtons = main.querySelector(".tab-buttons");

  create_searchTab(tabContent, tabButtons);
});
