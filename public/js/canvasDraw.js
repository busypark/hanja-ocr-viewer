// js/canvasDraw.js
import { getCanvasMode, getStrokes, setStrokes } from "./state.js";
import { runOCR } from "./ocrProcessor.js";

export function setupCanvasDraw(canvas) {
  const ctx = canvas.getContext("2d");
  let drawing = false;
  let currentStroke = [];

  function getPos(e) {
    if (e.touches) {
      const rect = canvas.getBoundingClientRect();
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    } else {
      return { x: e.offsetX, y: e.offsetY };
    }
  }

  function startDraw(e) {
    if (getCanvasMode(canvas) !== "pen") return;
    drawing = true;
    currentStroke = [];
    const pos = getPos(e);
    currentStroke.push(pos);
    drawDot(ctx, pos);
    e.preventDefault();
  }

  function draw(e) {
    if (!drawing || getCanvasMode(canvas) !== "pen") return;
    const pos = getPos(e);
    const last = currentStroke[currentStroke.length - 1];
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    currentStroke.push(pos);
    e.preventDefault();
  }

  function endDraw(e) {
    if (!drawing || getCanvasMode(canvas) !== "pen") return;
    drawing = false;
    const strokes = [...getStrokes(canvas)];
    strokes.push(currentStroke);
    setStrokes(canvas, strokes);
    const ocrFormatted = strokes.map(stroke => ({
      length: stroke.length,
      points: stroke.map(p => [Math.floor(p.x), Math.floor(p.y)])
    }));
    runOCR(canvas.closest(".tab-panel"), ocrFormatted);
    currentStroke = [];
    e.preventDefault();
  }

  function drawDot(ctx, pos) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  canvas.addEventListener("mousedown",  startDraw);
  canvas.addEventListener("mousemove",  draw);
  canvas.addEventListener("mouseup",    endDraw);
  canvas.addEventListener("mouseleave", endDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove",  draw,      { passive: false });
  canvas.addEventListener("touchend",   endDraw);
}
