import { Point, Constraint, Face, Vector2D, Vector3D } from '../types';
import { SETTINGS } from './settings';

// ================================
// Physics Engine
// ================================
export class PhysicsEngine {
  private points: Point[] = [];
  private constraints: Constraint[] = [];
  private faces: Face[] = [];
  private floorY = 0;

  constructor() {
    this.updateFloor();
  }

  // Data access
  getPoints(): Point[] { return this.points; }
  getConstraints(): Constraint[] { return this.constraints; }
  getFaces(): Face[] { return this.faces; }

  // Floor management
  updateFloor(): void {
    if (!SETTINGS.showFloor) return;
    this.floorY = window.innerHeight - (window.innerHeight * SETTINGS.floorOffset) / 100;
  }

  getFloorY(): number { return this.floorY; }

  // Point management
  createPoint(x: number, y: number, pinned = false): Point {
    const point: Point = { x, y, prevX: x, prevY: y, pinned };
    this.points.push(point);
    return point;
  }

  registerPoint(point: Point): Point {
    this.points.push(point);
    return point;
  }


  unregisterPoint(point: Point): void {
    const index = this.points.indexOf(point);
    if (index > -1) {
      this.points.splice(index, 1);
    }
  }

  findNearestPoint(x: number, y: number, radius: number): Point | null {
    let nearest: Point | null = null;
    let minDist = radius * radius;

    for (const p of this.points) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = dx * dx + dy * dy;

      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    }

    return nearest;
  }

  // Constraint management
  createConstraint(i1: number, i2: number, restLength: number, tearMultiplier: number): Constraint {
    const constraint: Constraint = {
      i1,
      i2,
      restLength,
      tearLength: restLength * tearMultiplier,
    };
    this.constraints.push(constraint);
    return constraint;
  }

  registerConstraint(constraint: Constraint): Constraint {
    this.constraints.push(constraint);
    return constraint;
  }

  unregisterConstraint(constraint: Constraint): void {
    const index = this.constraints.indexOf(constraint);
    if (index > -1) {
      this.constraints.splice(index, 1);
    }
  }

  // Face management
  createFace(i1: number, i2: number, i3: number, uv1: { u: number, v: number }, uv2: { u: number, v: number }, uv3: { u: number, v: number }): Face {
    const face: Face = { i1, i2, i3, uv1, uv2, uv3 };
    this.faces.push(face);
    return face;
  }

  registerFace(face: Face): Face {
    this.faces.push(face);
    return face;
  }

  unregisterFace(face: Face): void {
    const index = this.faces.indexOf(face);
    if (index > -1) {
      this.faces.splice(index, 1);
    }
  }

  // Physics simulation
  applyForces(gravity: Vector2D): void {
    this.points.forEach((p) => {
      // Lock pinned points
      if (p.pinned) {
        p.prevX = p.x;
        p.prevY = p.y;
        return;
      }

      // Apply gravity
      p.x += gravity.x;
      p.y += gravity.y;

      // Floor collision
      if (SETTINGS.showFloor && p.y >= this.floorY) {
        p.y = this.floorY;
        p.prevY = this.floorY;
      }
    });
  }

  integrate(): void {
    for (const p of this.points) {
      if (p.pinned) continue;

      // Apply friction (Verlet integration)
      const vx = (p.x - p.prevX) * SETTINGS.friction;
      const vy = (p.y - p.prevY) * SETTINGS.friction;

      p.prevX = p.x;
      p.prevY = p.y;

      p.x += vx;
      p.y += vy;
    }
  }

  satisfyConstraints(): void {
    // Repeat several times for stability
    for (let i = 0; i < SETTINGS.constraintIterations; i++) {
      // For each constraint
      for (let k = 0; k < this.constraints.length; k++) {
        const c = this.constraints[k];

        const p1 = this.points[c.i1];
        const p2 = this.points[c.i2];

        // Compute distance and tear if too long
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;

        // Tear constraint
        if (!!c.tearLength && dist > c.tearLength) {
          // Remove faces that use this constraint
          const tearFaces = this.faces.filter((f) =>
            [c.i1, c.i2].every((i) => [f.i1, f.i2, f.i3].includes(i)),
          );
          tearFaces.forEach((face) => {
            const index = this.faces.indexOf(face);
            if (index > -1) this.faces.splice(index, 1);
          });

          // Remove constraint
          this.constraints.splice(k, 1);
          k--;
          continue;
        }

        if (!c.tearLength && dist <= c.restLength) continue;

        // Compute correction based on pin state
        let stiffness;
        if (dist > c.restLength) {
          // Strong correction for stretching
          const stretch = dist / c.restLength;
          stiffness = Math.max(0.7, Math.min(1.1, 1.0 - (stretch - 1.0) * 0.3));
        } else {
          // Weak correction for compression
          stiffness = 0.1;
        }

        const correction = (dist - c.restLength) / dist;
        const cx = dx * correction * stiffness;
        const cy = dy * correction * stiffness;

        // Apply correction
        if (!p1.pinned && !p2.pinned) {
          p1.x += cx * 0.5;
          p1.y += cy * 0.5;
          p2.x -= cx * 0.5;
          p2.y -= cy * 0.5;
        } else if (p1.pinned && !p2.pinned) {
          p2.x -= cx
          p2.y -= cy;
        } else if (!p1.pinned && p2.pinned) {
          p1.x += cx;
          p1.y += cy;
        }
      }
    }
  }

  update(): void {
    this.integrate();
    this.satisfyConstraints();
  }
}

// ================================
// Utility functions
// ================================
export function normalizeVector(v: Vector3D): Vector3D {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

export const clamp = (v: number, min = 0, max = 1): number =>
  Math.max(min, Math.min(max, v));

export const range = (n: number): number[] =>
  [...Array(n).keys()];