import { Point, Constraint, Face } from '../types';

// ================================
// Base interface and class for simulation objects
// ================================
export interface ISimulationObject {
  startIndex: number;
  pointCount: number;
  constraintCount: number;
  faceCount: number;
  visible: boolean;

  initPoints(): void;
  initConstraints(): void;
  initFaces(): void;
  render(ctx: CanvasRenderingContext2D): void;
  update(deltaTime: number): void;
}

export abstract class SimulationObject implements ISimulationObject {
  public startIndex: number = 0;
  public pointCount: number = 0;
  public constraintCount: number = 0;
  public faceCount: number = 0;
  public visible: boolean = true;

  constructor() { }

  abstract initPoints(): void;
  abstract initConstraints(): void;
  abstract initFaces(): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
  abstract update(deltaTime: number): void;
}