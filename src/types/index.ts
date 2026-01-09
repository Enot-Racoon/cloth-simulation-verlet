// ================================
// Type definitions for cloth simulation
// ================================

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D extends Vector2D {
  z: number;
}

export interface Point {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  pinned: boolean;
}

export interface Constraint {
  i1: number;
  i2: number;
  restLength: number;
  tearLength: number;
}

export interface UV {
  u: number;
  v: number;
}

export interface Face {
  i1: number;
  i2: number;
  i3: number;
  uv1: UV;
  uv2: UV;
  uv3: UV;
}

export interface Material {
  tearMultiplier: number;
}

export interface Materials {
  cloth: Material;
  rope: Material;
  rubber: Material;
}

export interface Settings {
  gravity: number;
  friction: number;
  constraintIterations: number;
  pointSpacing: number;
  showFloor: boolean;
  floorOffset: number;
  mouseRadius: number;
  textureImage: string;
}

export interface Mouse {
  x: number;
  y: number;
  down: boolean;
  point: Point | null;
  initialPinned: boolean;
  radius: number;
}

export interface AccelerometerData {
  raw: Vector3D;
  filtered: Vector3D;
  normalized: Vector3D;
}

export interface DebugData {
  showDebug: boolean;
  debugData: Record<string, any>;
  element: HTMLElement;
  setDebugText(data: any): void;
  clear(): void;
  update(): void;
  setDebugData(key: string, value: any): void;
}

export interface FPSMeter {
  v: number;
  lastTime: number;
  frames: number;
  update(): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export interface RopeOptions {
  startX: number;
  startY: number;
  segmentLength: number;
  segmentCount: number;
  pinFirst?: boolean;
  pinLast?: boolean;
  horizontal?: boolean;
}

export interface ClothOptions {
  startX: number;
  startY: number;
  rows: number;
  columns: number;
  segmentLength: number;
  pinTop?: boolean;
  pinTopLeft?: boolean;
  pinTopRight?: boolean;
  pinTopCenter?: boolean;
}