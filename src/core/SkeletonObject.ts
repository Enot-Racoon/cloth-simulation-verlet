import { Point, Constraint, Face } from '../types';
import { PhysicsEngine } from './physics';
import { SimulationObject } from './SimulationObject';

// ================================
// Interface and base class for skeleton-based objects
// ================================
export interface ISkeletonObject {
  points: Point[];
  constraints: Constraint[];
  faces?: Face[];

  render(ctx: CanvasRenderingContext2D): void;
  update(deltaTime: number): void;
  applyCustomPhysics(): void;
  getBounds(): { minX: number, minY: number, maxX: number, maxY: number };
}

export abstract class SkeletonBase extends SimulationObject implements ISkeletonObject {
  public points: Point[] = [];
  public constraints: Constraint[] = [];
  public faces?: Face[] = [];

  constructor() {
    super();
  }

  // Override base methods to work with internal arrays
  initPoints(): void {
    // Points are managed internally for skeleton objects
    // This method is overridden but intentionally left empty
    // Points should be added during object construction
  }

  initConstraints(): void {
    // Constraints are managed internally for skeleton objects
    // This method is overridden but intentionally left empty
    // Constraints should be added during object construction
  }

  initFaces(): void {
    // Faces are managed internally for skeleton objects (optional)
    // This method is overridden but intentionally left empty
    // Faces should be added during object construction
  }

  abstract render(ctx: CanvasRenderingContext2D): void;
  abstract update(deltaTime: number): void;
  abstract applyCustomPhysics(): void;

  getBounds(): { minX: number, minY: number, maxX: number, maxY: number } {
    if (this.points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = this.points[0].x;
    let minY = this.points[0].y;
    let maxX = this.points[0].x;
    let maxY = this.points[0].y;

    for (const point of this.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return { minX, minY, maxX, maxY };
  }

  // Methods to manage points, constraints, and faces
  protected addPoint(x: number, y: number, pinned: boolean = false): Point {
    const point: Point = { x, y, prevX: x, prevY: y, pinned };
    this.points.push(point);
    return point;
  }

  protected addConstraint(i1: number, i2: number, restLength: number, tearMultiplier: number): Constraint {
    // Adjust indices to account for the object's position in the global physics engine
    const constraint: Constraint = {
      i1,
      i2,
      restLength,
      tearLength: restLength * tearMultiplier,
    };
    this.constraints.push(constraint);
    return constraint;
  }

  protected addFace(i1: number, i2: number, i3: number, uv1: { u: number, v: number },
    uv2: { u: number, v: number }, uv3: { u: number, v: number }): Face {
    // Adjust indices to account for the object's position in the global physics engine
    const face: Face = {
      i1: i1 + this.startIndex,
      i2: i2 + this.startIndex,
      i3: i3 + this.startIndex,
      uv1, uv2, uv3
    };
    if (!this.faces) this.faces = [];
    this.faces.push(face);
    return face;
  }

  // Method to add this skeleton object's components to the physics engine
  public addToPhysicsEngine(engine: PhysicsEngine): void {
    // Add points to the physics engine and track the starting index
    this.startIndex = engine.getPoints().length;
    this.pointCount = this.points.length;
    for (const point of this.points) {
      engine.registerPoint(point);
    }

    // Add constraints to the physics engine
    for (const constraint of this.constraints) {
      constraint.i1 += this.startIndex;
      constraint.i2 += this.startIndex;
      // Note: The constraint indices were already adjusted when added to this.constraints
      engine.registerConstraint(constraint); // tearMultiplier
    }
    this.constraintCount = this.constraints.length;


    // Add faces to the physics engine if they exist
    if (0 && this.faces) {
      for (const face of this.faces) {
        // Note: The face indices were already adjusted when added to this.faces
        engine.registerFace(face);
      }
      this.faceCount = this.faces.length;
    }
  }
}