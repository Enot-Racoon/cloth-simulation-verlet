import { V } from "./vec";
import type { V3Type } from "./vec3";
import type { Vec4 } from "../../types";

export interface V4Type extends V3Type {
  [3]: number;
  w: number;
  a: number;
}

export class V4 extends V<Vec4> implements V4Type {
  private _val: Vec4;

  constructor(vec: Vec4 | V4Type) {
    super();
    this._val = [vec[0], vec[1], vec[2], vec[3]];
  }

  get val(): Vec4 {
    return this._val;
  }

  get length(): 4 {
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

  // [3]

  get [3](): number {
    return this._val[3];
  }

  set [3](v: number) {
    this._val[3] = v;
  }

  get w(): number {
    return this._val[3];
  }

  set w(v: number) {
    this._val[3] = v;
  }

  get a(): number {
    return this._val[3];
  }

  set a(v: number) {
    this._val[3] = v;
  }
}

export const vec4 = (x = 0, y = 0, z = 0, w = 0): Vec4 => [x, y, z, w];

export const v4 = (x = 0, y = 0, z = 0, w = 0): V4 => new V4([x, y, z, w]);
