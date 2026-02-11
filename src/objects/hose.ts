import {
  fluently as $,
  angleOf,
  getIntersection,
  normalizeAngle,
  radToDeg,
} from "../utils";
import RuntimeContext from "../core/context";
import { Chain } from "./Chain";

type Circle = { x: number; y: number; r: number };

type Tangent = [
  { x: number; y: number },
  { x: number; y: number },
  { x: number; y: number },
  { x: number; y: number },
];

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
    const $ctx = $(ctx);

    $ctx.save().beginPath().setLineWidth(1).setStrokeStyle("dotted");
    this.hose.points.forEach((p) => $ctx.lineTo(p.x, p.y));
    $ctx.stroke().closePath().restore();
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
    this.renderOutline(ctx);
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
  }

  private renderOutline(ctx: CanvasRenderingContext2D) {
    this.renderStarCap(ctx);
    this.renderEndCap(ctx);
    this.renderTangentLines(ctx);
  }

  private renderStarCap(ctx: CanvasRenderingContext2D) {
    const radius = this.hose.segmentLength / 2;
    const point = this.hose.points[1];
    const prev = this.hose.points[0];
    const angle = Math.atan2(point.y - prev.y, point.x - prev.x);

    $(ctx)
      .save()
      .setLineWidth(1)
      .setStrokeStyle("dotted")
      .beginPath()
      .arc(
        this.hose.points[0].x,
        this.hose.points[0].y,
        radius,
        angle + Math.PI / 2,
        angle - Math.PI / 2,
      )
      .stroke()
      .closePath()
      .restore();
  }

  private renderEndCap(ctx: CanvasRenderingContext2D) {
    const radius = this.hose.segmentLength / 2;
    const point = this.hose.points[this.hose.points.length - 1];
    const prev = this.hose.points[this.hose.points.length - 2];
    const angle = Math.atan2(point.y - prev.y, point.x - prev.x);

    $(ctx)
      .save()
      .setLineWidth(1)
      .setStrokeStyle("dotted")
      .beginPath()
      .arc(
        this.hose.points[this.hose.points.length - 1].x,
        this.hose.points[this.hose.points.length - 1].y,
        radius,
        angle - Math.PI / 2,
        angle + Math.PI / 2,
      )
      .stroke()
      .closePath()
      .restore();
  }

  private renderPoint(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius = 4,
    color = "red",
  ) {
    $(ctx)
      .save()
      .setFillStyle(color)
      .beginPath()
      .arc(x, y, radius, 0, Math.PI * 2)
      .fill()
      .closePath()
      .restore();
  }

  private getCircleTangents(a: Circle, b: Circle): Tangent {
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

  private renderTangentLines(ctx: CanvasRenderingContext2D) {
    const threshold = 1e-4;
    const points = this.hose.points;
    const radius = this.hose.segmentLength / 2;

    const $ctx = $(ctx);
    const $outline = $(new Path2D());

    // calculate tangents
    const tangents: Tangent[] = [];
    {
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const current = points[i];
        const a = { x: prev.x, y: prev.y, r: radius };
        const b = { x: current.x, y: current.y, r: radius };
        tangents.push(this.getCircleTangents(a, b));
      }
    }

    // debug tangents
    {
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const current = points[i];
        const next = points[i + 1];

        if (!prev || !current) return;

        const b = { x: current.x, y: current.y, r: radius };
        const [p1, p2, p3, p4] = tangents[i - 1];

        // tetrahedron p1-p2-p3-p4-p1
        $ctx
          .save()
          .setLineWidth(1)
          .setStrokeStyle("dotted")
          .beginPath()
          .moveTo(p1.x, p1.y)
          .lineTo(p2.x, p2.y)
          .lineTo(p3.x, p3.y)
          .lineTo(p4.x, p4.y)
          .closePath()
          .stroke()
          .restore();

        // join
        if (next) {
          const prevAngle = angleOf(prev, current);
          const nextAngle = angleOf(current, next);
          const angleDiff = normalizeAngle(nextAngle - prevAngle);

          const [n1, n2, n3, n4] = tangents[i];

          if (0 && angleDiff < -threshold) {
            // right arc
            0 &&
              $(ctx)
                .save()
                .setLineWidth(4)
                .setStrokeStyle("lime")
                .beginPath()
                .arc(
                  b.x,
                  b.y,
                  b.r,
                  nextAngle + Math.PI / 2,
                  prevAngle + Math.PI / 2,
                )
                .stroke()
                .closePath()
                .restore();

            // left  spike
            const intersection = getIntersection(p1, p2, n1, n2);
            if (intersection) {
              this.renderPoint(
                ctx,
                intersection.x,
                intersection.y,
                4,
                "magenta",
              );

              const mitterLength2 =
                (intersection.x - b.x) ** 2 + (intersection.y - b.y) ** 2;

              // $ctx
              //   .save()
              //   .beginPath()
              //   .setLineWidth(4)
              //   .setStrokeStyle("yellow")
              //   .moveTo(p1.x, p1.y)
              //   .lineTo(ix, iy)
              //   // .lineTo(n1.x, n1.y)
              //   .stroke()
              //   .closePath()
              //   .restore();
              // $(ctx)
              //   .save()
              //   .setLineWidth(2)
              //   .setStrokeStyle("yellow")
              //   .beginPath()
              //   .moveTo(p1.x, p1.y)
              //   .lineTo(ix, iy)
              //   .lineTo(n1.x, n1.y)
              //   .stroke()
              //   .closePath()
              //   .restore();
              // if (mitterLength2 < radius * radius * 2) {
              //   ctx.lineTo(ix, iy);
              // }

              // const maxMitterLength = radius * 2;
              // if(mitterLength > maxMitterLength){
              // }
            }
          } else if (0 && angleDiff > threshold) {
            // left arc
            0 &&
              $ctx
                .save()
                .setLineWidth(4)
                .setStrokeStyle("green")
                .beginPath()
                .arc(
                  b.x,
                  b.y,
                  b.r,
                  prevAngle - Math.PI / 2,
                  nextAngle - Math.PI / 2,
                )
                .stroke()
                .closePath()
                .restore();

            // right spike
            const intersection = getIntersection(p3, p4, n3, n4);
            if (intersection) {
              this.renderPoint(ctx, intersection.x, intersection.y, 4, "cyan");
            }
          }
          // ctx.stroke();
          // ctx.closePath();
        }

        // right
        // $(ctx)
        //   .save()
        //   .setStrokeStyle("darkgreen")
        //   .beginPath()
        //   .moveTo(p3.x, p3.y)
        //   .lineTo(p4.x, p4.y)
        //   .stroke()
        //   .closePath()
        //   .restore();
      }
    }

    // start cap
    {
      const first = points[0];
      const second = points[1];
      const angle = Math.atan2(second.y - first.y, second.x - first.x);
      $outline.arc(
        first.x,
        first.y,
        radius,
        angle + Math.PI / 2,
        angle - Math.PI / 2,
      );
    }

    // left side - forward
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];

      if (!prev || !current || !next) continue;

      const angle = angleOf(prev, current);
      const nextAngle = angleOf(current, next);
      const angleDiff = normalizeAngle(nextAngle - angle);
      const [p1, p2] = tangents[i - 1];

      if (Math.abs(angleDiff) < threshold) {
        // Almost straight
        $outline.lineTo(p1.x, p1.y).lineTo(p2.x, p2.y);
      } else {
        if (angleDiff < 0) {
          // left turn - mitter
          $outline.lineTo(p1.x, p1.y).lineTo(p2.x, p2.y);

          // const [n1, n2] = tangents[i];
          // const intersection = getIntersection(p1, p2, n1, n2);
          // $outline.lineTo(p1.x, p1.y).lineTo(p2.x, p2.y);

          // if (intersection) {
          //   this.renderPoint(ctx, intersection.x, intersection.y, 4, "cyan");
          //   //   const mitterLength2 =
          //   //     (intersection.x - current.x) ** 2 +
          //   //     (intersection.y - current.y) ** 2;

          //   //   // debug center
          //   //   {
          //   //     if (i === Math.floor(points.length / 2)) {
          //   //       this.debug.setDebugData(
          //   //         "mitterLength",
          //   //         Math.sqrt(mitterLength2).toFixed(2),
          //   //       );
          //   //     }
          //   //   }

          //   //   if (mitterLength2 > radius * 3) {
          //   //     $outline.lineTo(p1.x, p1.y).lineTo(p2.x, p2.y);
          //   //   } else {
          //   //     $outline.lineTo(intersection.x, intersection.y);
          //   //   }
          // } else {
          //   $outline.lineTo(p1.x, p1.y).lineTo(p2.x, p2.y);
          // }
        } else {
          // right turn - arc
          $outline.arc(
            current.x,
            current.y,
            radius,
            angle - Math.PI / 2,
            nextAngle - Math.PI / 2,
          );
        }
      }
    }

    // end cap
    {
      const last = points[points.length - 1];
      const penult = points[points.length - 2];
      const angle = angleOf(penult, last);
      $outline.arc(
        last.x,
        last.y,
        radius,
        angle - Math.PI / 2,
        angle + Math.PI / 2,
      );
    }

    // right side - reverse
    for (let i = points.length - 2; i >= 0; i--) {
      const prev = points[i + 1];
      const current = points[i];
      const next = points[i - 1];

      if (!prev || !current || !next) continue;

      const angle = angleOf(prev, current);
      const nextAngle = angleOf(current, next);
      const angleDiff = normalizeAngle(nextAngle - angle);
      const [, , p3, p4] = tangents[i];

      if (Math.abs(angleDiff) < threshold) {
        // Almost straight
        $outline.lineTo(p3.x, p3.y).lineTo(p4.x, p4.y);
      } else {
        if (angleDiff < 0) {
          // left turn - mitter
          $outline.lineTo(p3.x, p3.y).lineTo(p4.x, p4.y);
        } else {
          // right turn - arc
          $outline.arc(
            current.x,
            current.y,
            radius,
            angle - Math.PI / 2,
            nextAngle - Math.PI / 2,
          );
        }
      }
    }

    // fill outline
    {
      $outline.closePath();
      $ctx
        .save()
        .setLineWidth(4)
        .setFillStyle("#33cc0080")
        .setStrokeStyle("#33cc0080")
        .fill($outline.$$)
        .stroke($outline.$$)
        .restore();
    }
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
