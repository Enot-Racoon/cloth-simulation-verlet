export default class Viewport {
  ctx: CanvasRenderingContext2D;
  canvasPost: HTMLCanvasElement;

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
    this.canvas.style.width = "100vw";
    this.canvas.style.height = "100svh";
    this.ctx = canvas.getContext("2d")!;

    this.canvasPost = document.createElement("canvas");
    this.canvasPost.width = canvas.width;
    this.canvasPost.height = canvas.height;
    this.canvasPost.style.position = "absolute";
    this.canvasPost.style.inset = "0";
    this.canvasPost.style.width = canvas.style.width;
    this.canvasPost.style.height = canvas.style.height;

    canvas.parentNode?.prepend(this.canvasPost);

    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
  }

  clear() {
    // clear by resize
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvasPost.width = this.canvas.width;
    this.canvasPost.height = this.canvas.height;
  }

  resize() {
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvasPost.width = this.canvas.width;
    this.canvasPost.height = this.canvas.height;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // this.ctxPost.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
}
