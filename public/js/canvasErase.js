// js/canvasErase.js
import { getCanvasMode, getStrokes, setStrokes } from "./state.js";
import { runOCR } from "./ocrProcessor.js";

export function setupCanvasErase(canvas) {
  const ctx = canvas.getContext("2d");
  const eraseRadius = 10;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    } else {
      return { x: e.offsetX, y: e.offsetY };
    }
  }

  function eraseAt(pos) {
    const strokes = getStrokes(canvas);
    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      for (const point of stroke) {
        const dx = point.x - pos.x;
        const dy = point.y - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < eraseRadius) {
          strokes.splice(i, 1);
          setStrokes(canvas, strokes);
          redraw(ctx, strokes);
          const ocrFormatted = strokes.map(stroke => ({
            length: stroke.length,
            points: stroke.map(p => [Math.floor(p.x), Math.floor(p.y)])
          }));
          runOCR(canvas.closest(".tab-panel"), ocrFormatted);
          return;
        }
      }
    }
  }

  function handleMove(e) {
    if (getCanvasMode(canvas) !== "erase") return;
    eraseAt(getPos(e));
    e.preventDefault();
  }

  function redraw(ctx, strokes) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      ctx.stroke();
    }
  }

  canvas.addEventListener("mousemove", handleMove);
  canvas.addEventListener("touchmove", handleMove, { passive: false });
}
