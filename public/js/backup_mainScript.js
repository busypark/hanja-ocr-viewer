document.addEventListener("DOMContentLoaded", () => {
  console.log("📦 mainScript.js loaded");

  const btnPen = document.getElementById("btnPen");
  const btnErase = document.getElementById("btnErase");

  const ocrCanvas = document.getElementById("ocrCanvas");
  const ctx = ocrCanvas.getContext("2d");

  let currentMode = "pen";
  let isDrawing = false;
  let isErasing = false;
  let currentStroke = [];
  let strokes = [];

  btnPen.disabled = true;
  btnErase.disabled = false;

  function switchMode(mode) {
    currentMode = mode;
    btnPen.disabled = mode === "pen";
    btnErase.disabled = mode === "erase";
  }

  btnPen.addEventListener("click", () => {
    switchMode("pen");
    console.log("🖊 Pen mode activated");
  });

  btnErase.addEventListener("click", () => {
    switchMode("erase");
    console.log("🧼 Erase mode activated");
  });

  function getMousePos(e) {
    const rect = ocrCanvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function drawLine(points) {
    if (points.length < 2) return;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  function redrawCanvas() {
    ctx.clearRect(0, 0, ocrCanvas.width, ocrCanvas.height);
    for (const stroke of strokes) {
      drawLine(stroke);
    }
  }

  function isNearStroke(stroke, point, threshold = 10) {
    for (let i = 0; i < stroke.length - 1; i++) {
      const a = stroke[i];
      const b = stroke[i + 1];
      const dist = distanceToSegment(point, a, b);
      if (dist <= threshold) {
        return true;
      }
    }
    return false;
  }

  function distanceToSegment(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dx === 0 && dy === 0) {
      return Math.hypot(p.x - a.x, p.y - a.y);
    }

    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    const tClamped = Math.max(0, Math.min(1, t));
    const closest = {
      x: a.x + tClamped * dx,
      y: a.y + tClamped * dy,
    };
    return Math.hypot(p.x - closest.x, p.y - closest.y);
  }

  function eraseAt(pos) {
    for (let i = 0; i < strokes.length; i++) {
      if (isNearStroke(strokes[i], pos)) {
        strokes.splice(i, 1);
        redrawCanvas();
        break;
      }
    }
  }

  ocrCanvas.addEventListener("mousedown", (e) => {
    const pos = getMousePos(e);
    if (currentMode === "pen") {
      isDrawing = true;
      currentStroke = [pos];
    } else if (currentMode === "erase") {
      isErasing = true;
      eraseAt(pos);
    }
  });

  ocrCanvas.addEventListener("mousemove", (e) => {
    const pos = getMousePos(e);
    if (currentMode === "pen" && isDrawing) {
      currentStroke.push(pos);
      drawLine(currentStroke.slice(-2));
    } else if (currentMode === "erase" && isErasing) {
      eraseAt(pos);
    }
  });

  window.addEventListener("mouseup", () => {
    if (currentMode === "pen" && isDrawing) {
      if (currentStroke.length > 1) {
        strokes.push(currentStroke);
      }
      isDrawing = false;
      currentStroke = [];
    } else if (currentMode === "erase" && isErasing) {
      isErasing = false;
    }
  });

  ocrCanvas.addEventListener("mouseleave", () => {
    if (currentMode === "pen" && isDrawing) {
      if (currentStroke.length > 1) {
        strokes.push(currentStroke);
      }
      isDrawing = false;
      currentStroke = [];
    } else if (currentMode === "erase" && isErasing) {
      isErasing = false;
    }
  });
});
