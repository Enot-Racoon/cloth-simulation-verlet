import { Point, Constraint, Face, UV } from "../types";
import { SkeletonBase } from "../core/SkeletonObject";

// ================================
// Soft Body object implementation
// ================================
export class SoftBody extends SkeletonBase {
  private internalPressure: number = 0;
  private elasticity: number = 1.0;
  private centerX: number;
  private centerY: number;
  private radius: number;
  private segments: number;

  constructor(
    centerX: number,
    centerY: number,
    radius: number,
    segments: number
  ) {
    super();
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.segments = segments;
    this.createCircularBody();
  }

  private createCircularBody(): void {
    // Create points in a inner circle
    for (let i = 0; i < this.segments; i++) {
      const angle = (i / this.segments) * Math.PI * 2;
      const x = this.centerX + Math.cos(angle) * this.radius;
      const y = this.centerY + Math.sin(angle) * this.radius;
      this.addPoint(x, y);
    }

    // Create points in a outer circle
    // for (let i = 0; i < this.segments; i++) {
    //   const angle = (i / this.segments) * Math.PI * 2;
    //   const r = this.radius * 2;
    //   const x = this.centerX + Math.cos(angle) * r;
    //   const y = this.centerY + Math.sin(angle) * r;
    //   this.addPoint(x, y);
    // }

    // Create constraints between inner circle points
    for (let i = 0; i < this.segments; i++) {
      const nextIndex = (i + 1) % this.segments;
      const p1 = this.points[i];
      const p2 = this.points[nextIndex];
      const restLength = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
      );

      this.addConstraint(i, nextIndex, restLength, 0);
    }

    // Create constraints between outerouter circle points
    // for (let i = 0; i < this.segments; i++) {
    //   const nextIndex = (i + 1) % this.segments;
    //   const p1 = this.points[i + this.segments];
    //   const p2 = this.points[nextIndex + this.segments];
    //   const restLength = Math.sqrt(
    //     Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    //   );

    //   this.addConstraint(
    //     i + this.segments,
    //     nextIndex + this.segments,
    //     restLength,
    //     0
    //   );
    // }

    // Create constraints between inner and outer circle points
    // for (let i = 0; i < this.segments; i++) {
    //   const p1 = this.points[i];
    //   const p2 = this.points[i + this.segments];
    //   const restLength = Math.sqrt(
    //     Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    //   );

    //   this.addConstraint(i, i + this.segments, restLength, 0);

    //   this.addConstraint(
    //     i,
    //     ((i + 1) % this.segments) + this.segments,
    //     restLength,
    //     0
    //   );
    //   this.addConstraint(
    //     i,
    //     ((i + this.segments - 1) % this.segments) + this.segments,
    //     restLength,
    //     0
    //   );
    // }

    // Add internal structure for stability
    const centerIndex = this.points.length; // Index of the center point
    // Add center point if it doesn't exist yet
    this.addPoint(this.centerX, this.centerY, false);
    for (let i = 0; i < this.segments; i++) {
      // Connect each point to the center
      const p = this.points[i];
      const restLength = Math.sqrt(
        Math.pow(p.x - this.centerX, 2) + Math.pow(p.y - this.centerY, 2)
      );

      this.addConstraint(i, centerIndex, restLength, 0);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.points.length === 0) return;

    // Draw the outline of the soft body
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.segments; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.closePath();
    ctx.strokeStyle = "rgba(100, 150, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw internal structure
    ctx.beginPath();
    for (let i = 0; i < this.segments; i++) {
      const centerIndex = this.points.length - 1; // Last point is the center
      ctx.moveTo(this.points[i].x, this.points[i].y);
      ctx.lineTo(this.points[centerIndex].x, this.points[centerIndex].y);
    }
    ctx.strokeStyle = "rgba(100, 150, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  update(deltaTime: number): void {
    // Update position based on physics
    // In a real implementation, this would be handled by the physics engine
  }

  applyCustomPhysics(): void {
    return;
    // Apply internal pressure effect
    // if (this.internalPressure > 0 && this.points.length > 1) {
    if (this.points.length > 1) {
      const centerIndex = this.points.length - 1; // Last point is the center
      const center = this.points[centerIndex];

      for (let i = 0; i < this.segments; i++) {
        const point = this.points[i];
        const dx = point.x - center.x;
        const dy = point.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          // Apply pressure force away from center
          const forceX = (dx / distance) * this.internalPressure;
          const forceY = (dy / distance) * this.internalPressure;

          // Apply force by adjusting previous position (Verlet integration)
          point.prevX -= forceX;
          point.prevY -= forceY;
        }
      }
    }
  }

  setInternalPressure(pressure: number): void {
    this.internalPressure = pressure;
  }

  setElasticity(elasticity: number): void {
    this.elasticity = elasticity;
  }
}
