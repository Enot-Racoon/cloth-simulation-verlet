import { Chain } from "./Chain";
import RuntimeContext from "../core/context";

export default class Hose extends Chain {
  constructor(
    private ctx: RuntimeContext,
    startX: number,
    startY: number,
    segmentLength: number,
    segmentCount: number,
  ) {
    super(startX, startY, segmentLength, segmentCount);

    const lastPoint = this.points[this.points.length - 1];
    lastPoint.y = this.points[0].y;
    lastPoint.pinned = true;
  }

  cross(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const radius = this.segmentLength / 2;

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

  render(ctx: CanvasRenderingContext2D): void {
    // super.render(ctx);
    if (this.points.length < 2) return;

    // for (const point of this.points) {
    //   this.cross(ctx, point.x, point.y);
    // }

    ctx.beginPath();
    for (const point of this.points) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();

    const radius = this.segmentLength / 2;
    ctx.fillStyle = "rgba(100, 100, 100, 0.8)";
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    //

    const angles: number[] = [];
    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      const prev = this.points[i - 1];
      angles.push(Math.atan2(point.y - prev.y, point.x - prev.x));
    }

    this.ctx.debug.setDebugData(
      "Angles",
      angles
        // .map((angle) => ((angle * 180) / Math.PI + 360) % 360)
        .map((angle) => angle.toFixed(2).padStart(6, " ")),
    );
    this.ctx.debug.setDebugData(
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

    // start cap
    ctx.beginPath();
    ctx.arc(
      this.points[0].x,
      this.points[0].y,
      radius,
      angles[0] + Math.PI / 2,
      angles[0] - Math.PI / 2,
    );

    // right side
    for (let i = 1; i <= angles.length; i++) {
      const angle = angles[i];
      const prevAngle = angles[i - 1];
      const diffAngle = angle - prevAngle;

      // if(Math.abs(diffAngle) > 0) {

      // }

      ctx.lineTo(
        this.points[i - 1].x - Math.cos(angle + Math.PI / 2) * radius,
        this.points[i - 1].y - Math.sin(angle + Math.PI / 2) * radius,
      );
      ctx.lineTo(
        this.points[i].x - Math.cos(angle + Math.PI / 2) * radius,
        this.points[i].y - Math.sin(angle + Math.PI / 2) * radius,
      );
    }

    // end cap
    ctx.arc(
      this.points[this.points.length - 1].x,
      this.points[this.points.length - 1].y,
      radius,
      angles[angles.length - 1] - Math.PI / 2,
      angles[angles.length - 1] + Math.PI / 2,
    );

    // left side
    for (let i = angles.length - 1; i >= 0; i--) {
      const angle = angles[i];

      ctx.lineTo(
        this.points[i].x - Math.cos(angle - Math.PI / 2) * radius,
        this.points[i].y - Math.sin(angle - Math.PI / 2) * radius,
      );
    }

    ctx.stroke();
  }
}
