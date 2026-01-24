export const Dim = {
  X: 0,
  Y: 1,
  Z: 2,
  W: 3,
} as const;

export type Vec = readonly number[];
export type MutableVec = number[];

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];
export type Vec4 = readonly [number, number, number, number];

export type Position3 = Vec3;
export type Direction3 = Vec3;
export type Homogeneous = Vec4;

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

export interface ConstraintBehavior {
  compliance: number;
  damping?: number;
  plasticity?: number;
  breakStress?: number;
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

export interface FloorSegment {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
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

export interface UpdateFn {
  (dt: number): void;
}

export interface Updatable {
  update: UpdateFn;
}

export interface RenderFn {
  (ctx: CanvasRenderingContext2D): void;
}

export interface Renderable {
  render: RenderFn;
}
