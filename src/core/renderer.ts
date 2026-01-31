import type {
  Point,
  Constraint,
  Face,
  Mouse,
  FPSMeter,
  Settings,
} from "../types";
import { clamp } from "../utils";
import { PhysicsEngine } from "./physics";
import Viewport from "./viewport";
import { createCRTPass, CRTPass } from "./postprocess";

// ================================
// Rendering system
// ================================
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private fpsMeter: FPSMeter;
  private isTextureLoaded = false;
  private textureImage: HTMLImageElement;
  private textureData: Uint8ClampedArray;
  private renderPoints = false;
  private renderConstraints = false;
  private crtPass: CRTPass;
  private postProcess = false;

  constructor(
    private viewport: Viewport,
    private physics: PhysicsEngine,
    private settings: Settings,
  ) {
    this.ctx = viewport.canvas.getContext("2d")!;
    this.crtPass = createCRTPass(viewport.canvasPost);

    this.fpsMeter = {
      v: 0,
      lastTime: performance.now(),
      frames: 0,
      update() {
        const now = performance.now();
        this.frames++;
        if (now > this.lastTime + 1000) {
          this.v = Math.round((this.frames * 1000) / (now - this.lastTime));
          this.lastTime = now;
          this.frames = 0;
        }
      },
      render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.font = "14px monospace";
        ctx.fillStyle = "rgba(128, 128, 128, 0.8)";
        ctx.textAlign = "right";
        ctx.fillText(`${this.v} FPS`, viewport.canvas.width / 2 - 10, 20);
        ctx.restore();
      },
    };

    this.textureImage = new Image();
    this.textureData = new Uint8ClampedArray();
    this.loadTexture();
  }

  private async loadTexture(): Promise<void> {
    try {
      const response = await fetch(this.settings.textureImage);
      if (!response.ok) throw new Error("Failed to load texture");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      this.textureImage.onload = () => {
        this.isTextureLoaded = true;
        URL.revokeObjectURL(objectUrl);
      };

      this.textureImage.src = objectUrl;
    } catch (error) {
      console.warn("Texture loading failed, continuing without texture");
    }
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  render(): void {
    // Clear canvas
    this.ctx.clearRect(
      0,
      0,
      this.viewport.canvas.width,
      this.viewport.canvas.height,
    );

    // border
    // this.ctx.save();
    // this.ctx.strokeStyle = "#ff0000d8";
    // this.ctx.lineWidth = 4;
    // this.ctx.rect(4, 4, this.viewport.width - 8, this.viewport.height - 8);
    // this.ctx.stroke();
    // this.ctx.restore();

    // Render floor if enabled
    if (this.settings.showFloor) {
      this.renderFloor();
    }

    // Render textured faces
    this.renderFaces();

    // Render physics (constraints and points)
    this.renderSimulation();

    // Render FPS counter
    this.fpsMeter.render(this.ctx);
  }

  private renderFloor(): void {
    const segments = this.physics.getFloorSegments();

    // Draw floor segments with terrain coloring
    for (const seg of segments) {
      const height = this.physics.getFloorYAt(seg.x1);
      // const depth = height - this.canvas.height;

      // Color based on depth (pits are darker)
      const darkness = Math.min(
        200,
        32 + (this.viewport.canvas.height - height) * 0.5,
      );
      this.ctx.fillStyle = `rgb(${darkness}, ${darkness}, ${darkness + 10})`;

      this.ctx.beginPath();
      this.ctx.moveTo(seg.x1, seg.y1);
      this.ctx.lineTo(seg.x2, seg.y2);
      this.ctx.lineTo(seg.x2, this.viewport.canvas.height);
      this.ctx.lineTo(seg.x1, this.viewport.canvas.height);
      this.ctx.closePath();
      this.ctx.fill();

      // Draw Viewport line
      // this.ctx.lineJoin = "round";
      this.ctx.strokeStyle = "#888";
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(seg.x1, seg.y1);
      this.ctx.lineTo(seg.x2, seg.y2);
      this.ctx.stroke();
    }
  }

  private renderFaces(): void {
    if (!this.isTextureLoaded) return;

    this.ctx.save();
    const faces = this.physics.getFaces();
    const points = this.physics.getPoints();

    for (const f of faces) {
      const p1 = points[f.i1];
      const p2 = points[f.i2];
      const p3 = points[f.i3];

      // Calculate UV coordinates in pixels
      const u1 = f.uv1.u * this.textureImage.width;
      const v1 = f.uv1.v * this.textureImage.height;
      const u2 = f.uv2.u * this.textureImage.width;
      const v2 = f.uv2.v * this.textureImage.height;
      const u3 = f.uv3.u * this.textureImage.width;
      const v3 = f.uv3.v * this.textureImage.height;

      // Create clipping path
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.lineTo(p3.x, p3.y);
      this.ctx.closePath();
      this.ctx.clip();

      // Calculate affine transformation
      const denom = (u1 - u3) * (v2 - v3) - (u2 - u3) * (v1 - v3);
      if (Math.abs(denom) > 0.0001) {
        const m11 =
          ((p1.x - p3.x) * (v2 - v3) - (p2.x - p3.x) * (v1 - v3)) / denom;
        const m12 =
          ((p1.y - p3.y) * (v2 - v3) - (p2.y - p3.y) * (v1 - v3)) / denom;
        const m21 =
          ((u1 - u3) * (p2.x - p3.x) - (u2 - u3) * (p1.x - p3.x)) / denom;
        const m22 =
          ((u1 - u3) * (p2.y - p3.y) - (u2 - u3) * (p1.y - p3.y)) / denom;
        const dx = p3.x - m11 * u3 - m21 * v3;
        const dy = p3.y - m12 * u3 - m22 * v3;

        this.ctx.transform(m11, m12, m21, m22, dx, dy);
        this.ctx.drawImage(this.textureImage, 0, 0);
      }

      this.ctx.restore();
    }

    this.ctx.restore();
  }

  private renderSimulation(): void {
    const constraints = this.physics.getConstraints();
    const points = this.physics.getPoints();

    // Render constraints with stress colors
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = "round";

    for (const c of constraints) {
      const p1 = points[c.i1];
      const p2 = points[c.i2];

      // Calculate distance and stress
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;

      // optimize math sqrt
      const dist2 = dx * dx + dy * dy;
      const restLength2 = c.restLength * c.restLength;
      const tearLength2 = c.tearLength * c.tearLength;

      const t = clamp((dist2 - restLength2) / (tearLength2 - restLength2));

      if (t < (this.renderConstraints ? 0 : 0.3)) continue;

      this.ctx.strokeStyle = this.stressColor(t);

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }

    // Render pinned points
    for (const p of points) {
      if (p.pinned) {
        this.ctx.fillStyle = "#002ffb";
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, this.ctx.lineWidth + 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (this.renderPoints) {
        this.ctx.fillStyle = "#ff06b9";
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, this.ctx.lineWidth + 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  renderMouse(mouse: Mouse): void {
    if (!mouse.point) return;

    if (mouse.down) {
      // Draw active grab point
      this.ctx.fillStyle = "lime";
      this.ctx.beginPath();
      this.ctx.arc(mouse.point.x, mouse.point.y, 8, 0, Math.PI * 2);
      this.ctx.fill();

      // Draw original pin state indicator
      if (mouse.initialPinned) {
        this.ctx.fillStyle = "#002ffb";
        this.ctx.beginPath();
        this.ctx.arc(
          mouse.point.x,
          mouse.point.y,
          this.ctx.lineWidth,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
      }
    }

    // Draw interaction radius
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.beginPath();
    this.ctx.arc(mouse.point.x, mouse.point.y, mouse.radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private stressColor(t: number): string {
    const r = Math.floor(255 * t);
    const g = Math.floor(200 * (1 - t));
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }

  update(): void {
    this.fpsMeter.update();
  }

  togglePostProcess(): void {
    this.postProcess = !this.postProcess;
  }

  postprocess(dt: number): void {
    if (!this.postProcess) {
      this.viewport.canvasPost.style.display = "none";
      return;
    } else if (this.viewport.canvasPost.style.display === "none") {
      this.viewport.canvasPost.style.display = "block";
    }

    this.crtPass.render(this.ctx.canvas, dt, {
      curvature: 0.05,
      rgbSplit: 0.001,
      scanline: 0.4,
      wobble: 0.0005,
      noise: 0.04,
      vignette: 0.8,
    });
  }
}
