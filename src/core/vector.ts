import type { Vec, Vec2, Vec3, Vec4 } from "../types";

export const vec2 = (x = 0, y = 0): Vec2 => [x, y];
export const vec3 = (x = 0, y = 0, z = 0): Vec3 => [x, y, z];
export const vec4 = (x = 0, y = 0, z = 0, w = 1): Vec4 => [x, y, z, w];

export const add = <T extends Vec>(a: T, b: T): T =>
  a.map((v, i) => v + b[i]) as unknown as T;

export const sub = <T extends Vec>(a: T, b: T): T =>
  a.map((v, i) => v - b[i]) as unknown as T;

export const scale = <T extends Vec>(v: T, s: number): T =>
  v.map((x) => x * s) as unknown as T;

export const dot = (a: Vec, b: Vec): number =>
  a.reduce((sum, v, i) => sum + v * b[i], 0);

export const length = <T extends Vec>(v: T): number => Math.sqrt(dot(v, v));

export const normalize = <T extends Vec>(v: T): T => {
  const len = length(v);
  return len === 0 ? v : scale(v, 1 / len);
};
