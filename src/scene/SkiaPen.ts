import type { Canvas, CanvasKit, Color, Paint, PathBuilder, Shader } from "canvaskit-wasm";
import type { Pen, PenGradient } from "../tree/pen";

class Gradient implements PenGradient {
  readonly stops: { at: number; color: Color }[] = [];
  constructor(
    private readonly kit: CanvasKit,
    readonly make: (colors: Color[], positions: number[]) => Shader,
  ) {}
  addColorStop(at: number, color: string) {
    this.stops.push({ at, color: this.kit.parseColorString(color) });
  }
}

type State = Pick<Pen, "fillStyle" | "strokeStyle" | "lineWidth" | "lineCap" | "lineJoin" | "globalAlpha">;

/** The app's Skia Pen, adapted to CanvasKit's explicit WASM object ownership. */
export class SkiaPen implements Pen {
  fillStyle: string | object = "#000";
  strokeStyle: string | object = "#000";
  lineWidth = 1;
  lineCap: Pen["lineCap"] = "butt";
  lineJoin: Pen["lineJoin"] = "miter";
  globalAlpha = 1;
  private readonly stack: State[] = [];
  private readonly colors = new Map<string, Color>();
  private path: PathBuilder;
  private readonly paint: Paint;

  constructor(private readonly kit: CanvasKit, private readonly canvas: Canvas) {
    this.path = new kit.PathBuilder();
    this.paint = new kit.Paint();
    this.paint.setAntiAlias(true);
  }
  dispose() { this.path.delete(); this.paint.delete(); }
  save() {
    const { fillStyle, strokeStyle, lineWidth, lineCap, lineJoin, globalAlpha } = this;
    this.stack.push({ fillStyle, strokeStyle, lineWidth, lineCap, lineJoin, globalAlpha });
    this.canvas.save();
  }
  restore() {
    const state = this.stack.pop();
    if (state) Object.assign(this, state);
    this.canvas.restore();
  }
  translate(x: number, y: number) { this.canvas.translate(x, y); }
  rotate(angle: number) { this.canvas.rotate(angle * 180 / Math.PI, 0, 0); }
  scale(x: number, y: number) { this.canvas.scale(x, y); }
  beginPath() { this.path.delete(); this.path = new this.kit.PathBuilder(); }
  moveTo(x: number, y: number) { this.path.moveTo(x, y); }
  lineTo(x: number, y: number) { this.path.lineTo(x, y); }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) { this.path.quadTo(cx, cy, x, y); }
  closePath() { this.path.close(); }
  arc(x: number, y: number, r: number, start: number, end: number) {
    this.ellipse(x, y, r, r, 0, start, end);
  }
  ellipse(x: number, y: number, rx: number, ry: number, rotation: number, start: number, end: number) {
    const sub = new this.kit.PathBuilder();
    const oval = this.kit.XYWHRect(-rx, -ry, rx * 2, ry * 2);
    const degrees = 180 / Math.PI;
    const sweep = (end - start) * degrees;
    sub.arcToOval(oval, start * degrees, Math.min(180, sweep), true);
    if (sweep > 180) sub.arcToOval(oval, start * degrees + 180, sweep - 180, false);
    const c = Math.cos(rotation), s = Math.sin(rotation);
    sub.transform([c, -s, x, s, c, y, 0, 0, 1]);
    const path = sub.detach();
    this.path.addPath(path, true);
    path.delete();
    sub.delete();
  }
  private draw(style: string | object, stroke: boolean, draw: () => void) {
    const { kit, paint } = this;
    paint.setShader(null);
    paint.setStyle(stroke ? kit.PaintStyle.Stroke : kit.PaintStyle.Fill);
    paint.setStrokeWidth(this.lineWidth);
    paint.setStrokeCap({ butt: kit.StrokeCap.Butt, round: kit.StrokeCap.Round, square: kit.StrokeCap.Square }[this.lineCap]);
    paint.setStrokeJoin({ miter: kit.StrokeJoin.Miter, round: kit.StrokeJoin.Round, bevel: kit.StrokeJoin.Bevel }[this.lineJoin]);
    let shader: Shader | undefined;
    if (style instanceof Gradient) {
      shader = style.make(style.stops.map(s => s.color), style.stops.map(s => s.at));
      paint.setColor(kit.WHITE);
      paint.setShader(shader);
      paint.setAlphaf(this.globalAlpha);
    } else {
      if (typeof style !== "string") throw new Error("Unsupported tree paint.");
      let color = this.colors.get(style);
      if (!color) { color = kit.parseColorString(style); this.colors.set(style, color); }
      paint.setColor(color);
      paint.setAlphaf(color[3] * this.globalAlpha);
    }
    try { draw(); } finally { paint.setShader(null); shader?.delete(); }
  }
  fill() {
    const path = this.path.snapshot();
    try { this.draw(this.fillStyle, false, () => this.canvas.drawPath(path, this.paint)); }
    finally { path.delete(); }
  }
  stroke() {
    const path = this.path.snapshot();
    try { this.draw(this.strokeStyle, true, () => this.canvas.drawPath(path, this.paint)); }
    finally { path.delete(); }
  }
  fillRect(x: number, y: number, w: number, h: number) {
    this.draw(this.fillStyle, false, () => this.canvas.drawRect(this.kit.XYWHRect(x, y, w, h), this.paint));
  }
  clearRect() { /* Pictures are transparent; clearing would erase the scene beneath them. */ }
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    return new Gradient(this.kit, (colors, pos) =>
      this.kit.Shader.MakeLinearGradient([x0, y0], [x1, y1], colors, pos, this.kit.TileMode.Clamp));
  }
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) {
    return new Gradient(this.kit, (colors, pos) =>
      this.kit.Shader.MakeTwoPointConicalGradient([x0, y0], r0, [x1, y1], r1, colors, pos, this.kit.TileMode.Clamp));
  }
}
