import { V } from "./vec";
import type { VType, Vec2 } from "../../types";

export interface V2Type extends VType {
  [0]: number;
  x: number;

  [1]: number;
  y: number;
}

export class V2 extends V<Vec2> implements V2Type {
  private _val: Vec2;

  constructor(vec: Vec2 | V2Type) {
    super();
    this._val = [vec[0], vec[1]];
  }

  get val(): Vec2 {
    return this._val;
  }

  get length(): 2 {
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
}

export const vec2 = (x = 0, y = 0): Vec2 => [x, y];

export const v2 = (x = 0, y = 0): V2 => new V2([x, y]);
