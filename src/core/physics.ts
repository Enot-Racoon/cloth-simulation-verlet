import { Point, Constraint, Face, Vector2D, Vector3D } from "../types";
import { SETTINGS } from "./settings";

// ================================
// Floor segment definition
// ================================
export interface FloorSegment {
  x1: number; // Left x coordinate
  x2: number; // Right x coordinate
  y1: number; // Y height at left
  y2: number; // Y height at right (for sloped segments)
}

// ================================
// Physics Engine
// ================================
export class PhysicsEngine {
  private points: Point[] = [];
  private constraints: Constraint[] = [];
  private faces: Face[] = [];
  private floorSegments: FloorSegment[] = [];

  constructor() {
    this.generateFloor();
  }

  // Data access
  getPoints(): Point[] {
    return this.points;
  }
  getConstraints(): Constraint[] {
    return this.constraints;
  }
  getFaces(): Face[] {
    return this.faces;
  }

  // Floor management
  generateFloor(): void {
    if (!SETTINGS.showFloor) return;

    const canvasWidth = window.innerWidth;
    const baseY =
      window.innerHeight - (window.innerHeight * SETTINGS.floorOffset) / 100;
    const segmentWidth = 100;

    this.floorSegments = [];

    // Height bounds for the floor
    const maxY = baseY - 50; // Highest point (lowest y value)
    const minY = baseY - 250; // Lowest point (highest y value)

    // Track current y position for continuous floor
    let currentY = baseY - 150;
    let x = 0;

    while (x < canvasWidth) {
      const rand = Math.random();
      const segmentLength = segmentWidth + Math.random() * 100;
      const nextX = Math.min(x + segmentLength, canvasWidth);

      if (rand < 0.25) {
        // Step up/down - change height gradually
        const heightChange = (Math.random() - 0.5) * 60;
        currentY = Math.max(maxY, Math.min(minY, currentY + heightChange));
        this.floorSegments.push({
          x1: x,
          x2: nextX,
          y1: currentY,
          y2: currentY,
        });
      } else if (rand < 0.45) {
        // Sloped section (ramp)
        const heightChange = (Math.random() - 0.5) * 80;
        const startY = currentY;
        currentY = Math.max(maxY, Math.min(minY, currentY + heightChange));
        this.floorSegments.push({
          x1: x,
          x2: nextX,
          y1: startY,
          y2: currentY,
        });
      } else if (rand < 0.6) {
        // Pit/hole - creates a gap in the floor
        const pitWidth = 60 + Math.random() * 100;
        const pitX = x + Math.random() * (nextX - x - pitWidth);

        // Left side of pit (continuous with previous)
        this.floorSegments.push({
          x1: x,
          x2: pitX,
          y1: currentY,
          y2: currentY,
        });

        // Right side of pit (after the gap)
        const rightX = pitX + pitWidth;
        if (rightX < nextX) {
          this.floorSegments.push({
            x1: rightX,
            x2: nextX,
            y1: currentY,
            y2: currentY,
          });
        }
        x = nextX;
        continue;
      } else {
        // Flat section
        this.floorSegments.push({
          x1: x,
          x2: nextX,
          y1: currentY,
          y2: currentY,
        });
      }

      x = nextX;
    }
  }

  getFloorSegments(): FloorSegment[] {
    return this.floorSegments;
  }

  getFloorYAt(x: number): number {
    for (const seg of this.floorSegments) {
      if (x >= seg.x1 && x <= seg.x2) {
        // Linear interpolation for sloped segments
        const t = (x - seg.x1) / (seg.x2 - seg.x1);
        return seg.y1 + (seg.y2 - seg.y1) * t;
      }
    }
    const baseY =
      window.innerHeight - (window.innerHeight * SETTINGS.floorOffset) / 100;
    return baseY;
  }

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
  createConstraint(
    i1: number,
    i2: number,
    restLength: number,
    tearMultiplier: number
  ): Constraint {
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
  createFace(
    i1: number,
    i2: number,
    i3: number,
    uv1: { u: number; v: number },
    uv2: { u: number; v: number },
    uv3: { u: number; v: number }
  ): Face {
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
      // Apply gravity
      if (!p.pinned) {
        p.x += gravity.x;
        p.y += gravity.y;
      }
    });
  }

  integrate(): void {
    for (const p of this.points) {
      if (p.pinned) continue;

      // Apply base friction (Verlet integration)
      const vx = (p.x - p.prevX) * (1 - SETTINGS.friction / 64);
      const vy = (p.y - p.prevY) * (1 - SETTINGS.friction / 64);

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
        const dist2 = dx * dx + dy * dy;
        const restLength2 = c.restLength * c.restLength;
        const tearLength2 = c.tearLength * c.tearLength;
        if (dist2 === 0) continue;

        // Tear constraint
        if (!!c.tearLength && dist2 > tearLength2) {
          // Remove faces that use this constraint
          const tearFaces = this.faces.filter((f) =>
            [c.i1, c.i2].every((i) => [f.i1, f.i2, f.i3].includes(i))
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

        if (!!c.tearLength && dist2 <= restLength2) continue;

        // Compute correction based on pin state
        let stiffness;
        if (dist2 > restLength2) {
          // Strong correction for stretching
          const stretch = dist2 / restLength2;
          stiffness = Math.max(0.7, Math.min(1.1, 1.0 - (stretch - 1.0) * 0.3));
        } else {
          // Weak correction for compression
          stiffness = 0.1;
        }

        const correction = (dist2 - restLength2) / dist2;
        const cx = dx * correction * stiffness;
        const cy = dy * correction * stiffness;

        // Apply correction
        if (!p1.pinned && !p2.pinned) {
          p1.x += cx * 0.5;
          p1.y += cy * 0.5;
          p2.x -= cx * 0.5;
          p2.y -= cy * 0.5;
        } else if (p1.pinned && !p2.pinned) {
          p2.x -= cx;
          p2.y -= cy;
        } else if (!p1.pinned && p2.pinned) {
          p1.x += cx;
          p1.y += cy;
        }
      }
    }
  }

  applyBoundaryConditions(): void {
    this.points.forEach((p) => {
      if (p.pinned) return;

      const floorY = this.getFloorYAt(p.x);
      if (p.y >= floorY) {
        p.y = floorY;
        p.prevY = floorY;

        p.x += -SETTINGS.friction * (p.x - p.prevX);
      }
    });
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

export const range = (n: number): number[] => [...Array(n).keys()];
