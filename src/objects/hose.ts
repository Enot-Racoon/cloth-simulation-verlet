import { Chain } from "./Chain";

export default class Hose extends Chain {
  constructor(
    startX: number,
    startY: number,
    segmentLength: number,
    segmentCount: number,
  ) {
    super(startX, startY, segmentLength, segmentCount);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // super.render(ctx);
    if (this.points.length < 2) return;

    const radius = this.segmentLength / 2;
    ctx.fillStyle = "rgba(100, 100, 100, 0.8)";
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    //

    const angles = [];
    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      const prev = this.points[i - 1];
      angles.push(Math.atan2(point.y - prev.y, point.x - prev.x));
    }

    ctx.beginPath();
    ctx.arc(
      this.points[0].x,
      this.points[0].y,
      radius,
      angles[0] + Math.PI / 2,
      angles[0] - Math.PI / 2,
    );

    for (let i = 1; i <= angles.length; i++) {
      const angle = angles[i];

      ctx.lineTo(
        this.points[i].x - Math.cos(angle + Math.PI / 2) * radius,
        this.points[i].y - Math.sin(angle + Math.PI / 2) * radius,
      );
    }

    ctx.arc(
      this.points[this.points.length - 1].x,
      this.points[this.points.length - 1].y,
      radius,
      angles[angles.length - 1] - Math.PI / 2,
      angles[angles.length - 1] + Math.PI / 2,
    );

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
