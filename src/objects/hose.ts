import { Chain } from "./Chain";
import RuntimeContext from "../core/context";

type Circle = { x: number; y: number; r: number };

class HoseRenderer {
  constructor(private hose: Hose) {}

  private renderSkeletonLine(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    for (const point of this.hose.points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
  }

  private renderCrossPointsUnit(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
  ) {
    const radius = this.hose.segmentLength / 2;

    const cross = {
      c: { x, y },
      t: { x: x + radius, y },
      b: { x: x - radius, y },
      l: { x, y: y + radius },
      r: { x, y: y - radius },
    };

    ctx.save();
    ctx.strokeStyle = "rgba(219, 16, 185, 0.8)";
    for (const p of Object.values(cross)) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderCrossPoints(ctx: CanvasRenderingContext2D) {
    for (const point of this.hose.points) {
      this.renderCrossPointsUnit(ctx, point.x, point.y);
    }
  }

  private buildOutlinePath(): Path2D {
    const path = new Path2D();
    return path;
  }

  private renderCircles(ctx: CanvasRenderingContext2D) {
    const radius = this.hose.segmentLength / 2;
    ctx.fillStyle = "rgba(100, 100, 100, 0.8)";
    for (let i = 0; i < this.hose.points.length; i++) {
      const point = this.hose.points[i];
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    if (this.hose.points.length < 2) return;

    // this.renderSkeletonLine(ctx);
    // this.renderCrossPoints(ctx);
    // this.renderCircles(ctx);
    this.renderDebug(ctx);
  }

  private renderAngles() {
    const angles: number[] = [];
    for (let i = 1; i < this.hose.points.length; i++) {
      const point = this.hose.points[i];
      const prev = this.hose.points[i - 1];
      angles.push(Math.atan2(point.y - prev.y, point.x - prev.x));
    }

    this.hose.ctx.debug.setDebugData(
      "Angles",
      angles
        // .map((angle) => ((angle * 180) / Math.PI + 360) % 360)
        .map((angle) => angle.toFixed(2).padStart(6, " ")),
    );
    this.hose.ctx.debug.setDebugData(
      "Diffs",
      angles
        // .map((angle) => ((angle * 180) / Math.PI + 360) % 360)

        .reduce((acc, angle, i, angles) => {
          if (i === 0) return [];
          const diff = angle - angles[i - 1];
          acc.push(diff);
          return acc;
        }, [] as number[])
        .map((angle) => angle.toFixed(2).padStart(6, " ")),
    );
  }

  private renderDebug(ctx: CanvasRenderingContext2D) {
    this.renderAngles();

    this.renderStarCap(ctx);
    this.renderEndCap(ctx);
    this.renderTangentLines(ctx);
  }

  private renderStarCap(ctx: CanvasRenderingContext2D) {
    const radius = this.hose.segmentLength / 2;
    const point = this.hose.points[1];
    const prev = this.hose.points[0];
    const angle = Math.atan2(point.y - prev.y, point.x - prev.x);

    const startCap = new Path2D();
    startCap.arc(
      this.hose.points[0].x,
      this.hose.points[0].y,
      radius,
      angle + Math.PI / 2,
      angle - Math.PI / 2,
    );

    ctx.stroke(startCap);
  }

  private renderEndCap(ctx: CanvasRenderingContext2D) {
    const radius = this.hose.segmentLength / 2;
    const point = this.hose.points[this.hose.points.length - 1];
    const prev = this.hose.points[this.hose.points.length - 2];
    const angle = Math.atan2(point.y - prev.y, point.x - prev.x);

    const endCap = new Path2D();
    endCap.arc(
      this.hose.points[this.hose.points.length - 1].x,
      this.hose.points[this.hose.points.length - 1].y,
      radius,
      angle - Math.PI / 2,
      angle + Math.PI / 2,
    );

    ctx.stroke(endCap);
  }

  private renderPoint(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius = 4,
  ) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  private renderTangentPoints(
    ctx: CanvasRenderingContext2D,
    current: { x: number; y: number },
    prev: { x: number; y: number },
    radius: number,
  ) {
    const angle = Math.atan2(current.y - prev.y, current.x - prev.x);

    type P = { x: number; y: number };

    const l1: P = {
      x: prev.x + Math.sin(angle) * radius,
      y: prev.y - Math.cos(angle) * radius,
    };

    const r1: P = {
      x: prev.x - Math.sin(angle) * radius,
      y: prev.y + Math.cos(angle) * radius,
    };

    const l2: P = {
      x: current.x + Math.sin(angle) * radius,
      y: current.y - Math.cos(angle) * radius,
    };

    const r2: P = {
      x: current.x - Math.sin(angle) * radius,
      y: current.y + Math.cos(angle) * radius,
    };

    // ctx.save();

    // ctx.fillStyle = "red";
    // this.renderPoint(ctx, l1.x, l1.y);
    // ctx.fillStyle = "green";
    // this.renderPoint(ctx, l2.x, l2.y);

    // ctx.fillStyle = "darkred";
    // this.renderPoint(ctx, r1.x, r1.y);
    // ctx.fillStyle = "darkgreen";
    // this.renderPoint(ctx, r2.x, r2.y);

    // ctx.restore();

    ctx.beginPath;
    ctx.moveTo(l1.x, l1.y);
    ctx.lineTo(l2.x, l2.y);
    ctx.stroke();

    ctx.beginPath;
    ctx.moveTo(r1.x, r1.y);
    ctx.lineTo(r2.x, r2.y);
    ctx.stroke();

    const ecs = 1e-10;

    if (angle < ecs) {
    } else if (angle > ecs) {
    }
  }

  private getCircleTangents(
    a: Circle,
    b: Circle,
  ): Array<{ x: number; y: number }> {
    const angle = Math.atan2(b.y - a.y, b.x - a.x);

    return [
      {
        x: a.x + Math.sin(angle) * a.r,
        y: a.y - Math.cos(angle) * a.r,
      },
      {
        x: b.x + Math.sin(angle) * b.r,
        y: b.y - Math.cos(angle) * b.r,
      },
      {
        x: b.x - Math.sin(angle) * b.r,
        y: b.y + Math.cos(angle) * b.r,
      },
      {
        x: a.x - Math.sin(angle) * a.r,
        y: a.y + Math.cos(angle) * a.r,
      },
    ];
  }

  private renderTangentPoints2(ctx: CanvasRenderingContext2D, i: number) {
    const radius = this.hose.segmentLength / 2;

    const prev = this.hose.points[i - 1];
    const current = this.hose.points[i];

    if (!prev || !current) return;

    const a = { x: prev.x, y: prev.y, r: radius };
    const b = { x: current.x, y: current.y, r: radius };
    const [p1, p2, p3, p4] = this.getCircleTangents(a, b);

    const angle = Math.atan2(current.y - prev.y, current.x - prev.x);

    //

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.stroke();

    //

    ctx.save();
    ctx.fillStyle = "red";
    this.renderPoint(ctx, p1.x, p1.y);
    ctx.fillStyle = "green";
    this.renderPoint(ctx, p2.x, p2.y);
    ctx.fillStyle = "darkred";
    this.renderPoint(ctx, p3.x, p3.y);
    ctx.fillStyle = "darkgreen";
    this.renderPoint(ctx, p4.x, p4.y);
    ctx.restore();

    const ecs = 1e-10;

    if (angle < ecs) {
    } else if (angle > ecs) {
    }
  }

  private renderTangentLines(ctx: CanvasRenderingContext2D) {
    // const radius = this.hose.segmentLength / 2;

    for (let i = 1; i < this.hose.points.length; i++) {
      // const currentPoint = this.hose.points[i];
      // const prevPoint = this.hose.points[i - 1];

      this.renderTangentPoints2(ctx, i);
    }
  }

  private renderOutline(ctx: CanvasRenderingContext2D) {
    const path = this.buildOutlinePath();
    ctx.stroke(path);
  }
}

export default class Hose extends Chain {
  private renderer: HoseRenderer;

  constructor(
    public ctx: RuntimeContext,
    startX: number,
    startY: number,
    segmentLength: number,
    segmentCount: number,
  ) {
    super(startX, startY, segmentLength, segmentCount);

    const firstPoint = this.points[0];
    const lastPoint = this.points[this.points.length - 1];
    lastPoint.x = (lastPoint.x - firstPoint.x) / 2 + firstPoint.x;
    lastPoint.y = firstPoint.y;
    lastPoint.pinned = true;

    this.renderer = new HoseRenderer(this);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // super.render(ctx);

    return this.renderer.render(ctx);
  }
}
