import { Point, Constraint } from '../types';
import { SkeletonBase } from '../core/SkeletonObject';

// ================================
// Chain object implementation
// ================================
export class Chain extends SkeletonBase {
  private segmentCount: number;
  private segmentLength: number;
  private flexibility: number;

  constructor(startX: number, startY: number, segmentLength: number, segmentCount: number, flexibility: number = 1.0) {
    super();
    this.segmentLength = segmentLength;
    this.segmentCount = segmentCount;
    this.flexibility = flexibility;
    this.createChain(startX, startY);
  }

  private createChain(startX: number, startY: number): void {
    // Create points for the chain
    for (let i = 0; i < this.segmentCount + 1; i++) {
      const x = startX + i * this.segmentLength / 2;
      const y = startY + i * this.segmentLength / 2;
      this.addPoint(x, y, i === 0); // Pin the first point
    }

    // Create constraints between adjacent points
    for (let i = 0; i < this.segmentCount; i++) {
      this.addConstraint(i, i + 1, this.segmentLength, 2.0);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible || this.points.length < 2) return;

    // Draw the chain links
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    ctx.strokeStyle = 'rgba(180, 180, 180, 0.8)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Draw connection points
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? 'red' : 'rgba(100, 100, 100, 0.8)';
      ctx.fill();
    }
  }

  update(deltaTime: number): void {
    // Update position based on physics
    // In a real implementation, this would be handled by the physics engine
  }

  applyCustomPhysics(): void {
    // Apply custom physics for chain flexibility
    // This could include additional constraints or forces based on the flexibility parameter
    if (this.flexibility < 1.0) {
      // Apply additional constraints to make the chain more rigid
      for (let i = 0; i < this.points.length - 2; i++) {
        // Create secondary constraints to increase rigidity
        const dx = this.points[i + 2].x - this.points[i].x;
        const dy = this.points[i + 2].y - this.points[i].y;

        const distance2 = dx * dx + dy * dy;
        const restLength = this.segmentLength * 2 * this.flexibility;
        const restLength2 = restLength * restLength;

        if (distance2 > restLength2) {
          // Apply corrective force to make chain more rigid
          const correction = (distance2 - restLength2) / distance2;
          const cx = dx * correction * (1 - this.flexibility) * 0.1;
          const cy = dy * correction * (1 - this.flexibility) * 0.1;

          // Apply correction to the middle point
          if (i + 1 < this.points.length && !this.points[i + 1].pinned) {
            this.points[i + 1].x -= cx * 0.5;
            this.points[i + 1].y -= cy * 0.5;
          }
        }
      }
    }
  }

  setFlexibility(flexibility: number): void {
    this.flexibility = flexibility;
  }

  getFlexibility(): number {
    return this.flexibility;
  }
}