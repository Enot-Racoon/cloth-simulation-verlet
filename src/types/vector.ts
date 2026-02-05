export const Dim = {
  X: 0,
  Y: 1,
  Z: 2,
  W: 3,
} as const;

export type Vec<T extends 2 | 3 | 4> = T extends 2
  ? [number, number]
  : T extends 3
    ? [number, number, number]
    : T extends 4
      ? [number, number, number, number]
      : never;

export type Vec2 = Vec<2>;
export type Vec3 = Vec<3>;
export type Vec4 = Vec<4>;

export interface VType {
  readonly length: number;
}

//

export type Pos2 = Vec2;
export type Pos3 = Vec3;

export type Dir2 = Vec2;
export type Dir3 = Vec3;

export type Homo = Vec4;
export type Quat = Vec4;

//

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D extends Vector2D {
  z: number;
}
