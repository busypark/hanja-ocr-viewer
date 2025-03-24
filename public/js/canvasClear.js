// js/canvasClear.js
import { runOCR } from "./ocrProcessor.js";
import { setStrokes } from "./state.js";

export function clearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setStrokes(canvas, []);
  runOCR(canvas.closest(".tab-panel"));
}
