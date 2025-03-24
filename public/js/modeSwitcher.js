// js/modeSwitcher.js
import { setCanvasMode, getCanvasMode } from "./state.js";
import { clearCanvas } from "./canvasClear.js";

export function setupModeSwitcher(ocrCanvas, btnPen, btnErase, btnClear) {
  btnPen.disabled = true;
  btnErase.disabled = false;
  setCanvasMode(ocrCanvas, "pen");

  btnPen.addEventListener("click", () => {
    btnPen.disabled = true;
    btnErase.disabled = false;
    setCanvasMode(ocrCanvas, "pen");
  });

  btnErase.addEventListener("click", () => {
    btnPen.disabled = false;
    btnErase.disabled = true;
    setCanvasMode(ocrCanvas, "erase");
  });

  btnClear.addEventListener("click", () => {
    clearCanvas(ocrCanvas);
    if (getCanvasMode(ocrCanvas) === "erase") {
      btnPen.disabled = true;
      btnErase.disabled = false;
      setCanvasMode(ocrCanvas, "pen");
    }
  });
}
