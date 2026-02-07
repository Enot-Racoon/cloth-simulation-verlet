import { getIntersection, normalizeAngle, radToDeg } from "../utils";
import RuntimeContext from "../core/context";
import { Chain } from "./Chain";

type Circle = { x: number; y: number; r: number };

class HoseRenderer {
  constructor(private hose: Hose) {}

  get debug() {
    return this.hose.ctx.debug;
  }

  get circles() {
    const radius = this.hose.segmentLength / 2;
    return this.hose.points.map((p, i) => ({
      x: p.x,
      y: p.y,
      r: radius + i * 10,
    }));
  }

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

    this.renderSkeletonLine(ctx);
    // this.renderCrossPoints(ctx);
    // this.renderCircles(ctx);
    this.renderDebug(ctx);
  }

  private renderDebugAngles() {
    const angles: number[] = [];
    for (let i = 1; i < this.hose.points.length; i++) {
      const point = this.hose.points[i];
      const prev = this.hose.points[i - 1];
      const angle = Math.atan2(point.y - prev.y, point.x - prev.x);
      angles.push(normalizeAngle(angle));
    }

    this.hose.ctx.debug.setDebugData(
      "Angles",
      angles.map(radToDeg).map((angle) => angle.toFixed(2).padStart(6, " ")),
    );
    this.hose.ctx.debug.setDebugData(
      "Diffs",
      angles
        .reduce((acc, angle, i, angles) => {
          if (i === 0) return [];
          const diff = angle - angles[i - 1];
          acc.push(normalizeAngle(diff));
          return acc;
        }, [] as number[])
        .map(radToDeg)
        .map((angle) => angle.toFixed(2).padStart(6, " ")),
    );
  }

  private renderDebug(ctx: CanvasRenderingContext2D) {
    this.renderDebugAngles();

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
    color = "red",
  ) {
    const prevColor = ctx.fillStyle;
    ctx.fillStyle = color;
    const p = new Path2D();
    p.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill(p);
    ctx.fillStyle = prevColor;
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

    const ecs = 1e-9;

    if (angle < -0.1 + ecs) {
      // spike
    } else if (angle > 0.1 + ecs) {
      // arc
      // ctx.save();
      // ctx.fillStyle = "magenta";
      // ctx.beginPath();
      // ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      // ctx.stroke();
      // ctx.closePath();
      // ctx.restore();
    }
  }

  private renderTangentPoints3(ctx: CanvasRenderingContext2D, i: number) {
    const radius = this.hose.segmentLength / 2;
    const points = this.hose.points;
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];

    if (!prev || !current) return;

    const a = { x: prev.x, y: prev.y, r: radius };
    const b = { x: current.x, y: current.y, r: radius };
    const [p1, p2, p3, p4] = this.getCircleTangents(a, b);

    //

    // left
    ctx.strokeStyle = "darkgreen";
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.closePath();

    // join
    if (next) {
      const prevAngle = Math.atan2(current.y - prev.y, current.x - prev.x);
      const nextAngle = Math.atan2(next.y - current.y, next.x - current.x);
      const angleDiff = normalizeAngle(nextAngle - prevAngle);

      const c = { x: next.x, y: next.y, r: radius };
      const [n1, n2, n3, n4] = this.getCircleTangents(b, c);

      const threshold = 1e-3;

      ctx.beginPath();
      if (angleDiff < -threshold) {
        // left
        ctx.arc(
          b.x,
          b.y,
          b.r,
          nextAngle + Math.PI / 2,
          prevAngle + Math.PI / 2,
        );

        const [ix, iy] =
          getIntersection(
            [
              [p1.x, p1.y],
              [p2.x, p2.y],
            ],
            [
              [n1.x, n1.y],
              [n2.x, n2.y],
            ],
          ) ?? [];
        if (ix && iy) {
          this.renderPoint(ctx, ix, iy, 6, "magenta");

          if (i === Math.floor(points.length / 2)) {
            ctx.fillStyle = "red";
            ctx.strokeStyle = "red";
            const l = Math.sqrt((ix - b.x) ** 2 + (iy - b.y) ** 2);
            this.debug.setDebugData("Mitter ratio", (l / radius).toFixed(2));

            const paths = [
              { p: new Path2D(), c: "white" },
              { p: new Path2D(), c: "lime" },
              { p: new Path2D(), c: "orange" },
              { p: new Path2D(), c: "fuchsia" },
            ];
            const [mitterCircle, limitCircle, limitCircle2, limitCircle3] =
              paths;

            mitterCircle.p.arc(b.x, b.y, l, 0, Math.PI * 2);
            limitCircle.p.arc(b.x, b.y, radius, 0, Math.PI * 2);
            limitCircle2.p.arc(b.x, b.y, radius * 2, 0, Math.PI * 2);
            limitCircle3.p.arc(b.x, b.y, radius * 3, 0, Math.PI * 2);

            ctx.save();
            ctx.lineWidth = 1;
            paths.forEach(({ p, c }) => {
              ctx.strokeStyle = c;
              ctx.stroke(p);
            });
            ctx.restore();
          }
        }
      } else if (angleDiff > threshold) {
        // right
        ctx.arc(
          b.x,
          b.y,
          b.r,
          prevAngle - Math.PI / 2,
          nextAngle - Math.PI / 2,
        );

        const [ix, iy] =
          getIntersection(
            [
              [p3.x, p3.y],
              [p4.x, p4.y],
            ],
            [
              [n3.x, n3.y],
              [n4.x, n4.y],
            ],
          ) ?? [];
        if (ix && iy) this.renderPoint(ctx, ix, iy, 6, "cyan");
      }
      ctx.stroke();
      ctx.closePath();
    }

    // right
    ctx.strokeStyle = "darkgreen";
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.stroke();
    ctx.closePath();
  }

  private renderTangentLines(ctx: CanvasRenderingContext2D) {
    // const radius = this.hose.segmentLength / 2;

    for (let i = 1; i < this.hose.points.length; i++) {
      // const currentPoint = this.hose.points[i];
      // const prevPoint = this.hose.points[i - 1];

      this.renderTangentPoints3(ctx, i);
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
