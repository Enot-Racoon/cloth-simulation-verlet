export default class Viewport {
  ctx: CanvasRenderingContext2D;

  get dpr() {
    return window.devicePixelRatio || 1;
  }

  get width() {
    return window.innerWidth;
  }

  get height() {
    return window.innerHeight;
  }

  constructor(public canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
  }

  clear() {
    // clear by resize
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
  }

  resize() {
    this.canvas.style.width = "100vw";
    this.canvas.style.height = "100svh";
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
}
