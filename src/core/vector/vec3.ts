import { V } from "./vec";
import type { V2Type } from "./vec2";
import type { Vec3 } from "../../types";

export interface V3Type extends V2Type {
  [2]: number;
  z: number;

  r: number;
  g: number;
  b: number;
}

export class V3 extends V<Vec3> implements V3Type {
  private _val: Vec3;

  constructor(vec: Vec3 | V3Type) {
    super();
    this._val = [vec[0], vec[1], vec[2]];
  }

  get val(): Vec3 {
    return this._val;
  }

  get length(): 3 {
    return this._val.length;
  }

  // [0]

  get [0](): number {
    return this._val[0];
  }

  set [0](v: number) {
    this._val[0] = v;
  }

  get x(): number {
    return this._val[0];
  }

  set x(v: number) {
    this._val[0] = v;
  }

  get r(): number {
    return this._val[0];
  }

  set r(v: number) {
    this._val[0] = v;
  }

  // [1]

  get [1](): number {
    return this._val[1];
  }

  set [1](v: number) {
    this._val[1] = v;
  }

  get y(): number {
    return this._val[1];
  }

  set y(v: number) {
    this._val[1] = v;
  }

  get g(): number {
    return this._val[1];
  }

  set g(v: number) {
    this._val[1] = v;
  }

  // [2]

  get [2](): number {
    return this._val[2];
  }

  set [2](v: number) {
    this._val[2] = v;
  }

  get z(): number {
    return this._val[2];
  }

  set z(v: number) {
    this._val[2] = v;
  }

  get b(): number {
    return this._val[2];
  }

  set b(v: number) {
    this._val[2] = v;
  }
}

export const vec3 = (x = 0, y = 0, z = 0): Vec3 => [x, y, z];

export const v3 = (x = 0, y = 0, z = 0): V3 => new V3([x, y, z]);
