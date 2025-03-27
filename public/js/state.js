// js/state.js

export function setCanvasMode(canvas, mode) {
  canvas.dataset.canvasMode = mode;
}

export function getCanvasMode(canvas) {
  return canvas.dataset.canvasMode;
}

export function setStrokes(canvas, newStrokes) {
  canvas.dataset.strokes = JSON.stringify(newStrokes);
}

export function getStrokes(canvas) {
  return JSON.parse(canvas.dataset.strokes);
}
