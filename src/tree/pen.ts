// The Canvas2D subset the painters use. A browser CanvasRenderingContext2D satisfies it as is;
// the app supplies a Skia implementation.
export interface PenGradient {
  addColorStop(offset: number, color: string): void;
}

export interface Pen {
  fillStyle: string | object;
  strokeStyle: string | object;
  lineWidth: number;
  lineCap: "butt" | "round" | "square";
  lineJoin: "round" | "bevel" | "miter";
  globalAlpha: number;
  reset?(): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  scale(x: number, y: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  arc(x: number, y: number, r: number, start: number, end: number): void;
  ellipse(x: number, y: number, rx: number, ry: number, rotation: number, start: number, end: number): void;
  closePath(): void;
  fill(): void;
  stroke(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): PenGradient;
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): PenGradient;
}
