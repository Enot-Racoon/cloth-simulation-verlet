import type { VType } from "./types";

type Vec = readonly number[];

export const add = <T extends Vec>(a: T, b: T): T =>
  a.map((v, i) => v + b[i]) as unknown as T;

export const sub = <T extends Vec>(a: T, b: T): T =>
  a.map((v, i) => v - b[i]) as unknown as T;

export const mul = <T extends Vec>(a: T, b: T): T =>
  a.map((v, i) => v * b[i]) as unknown as T;

export const div = <T extends Vec>(a: T, b: T): T =>
  a.map((v, i) => v / b[i]) as unknown as T;

export const neg = <T extends Vec>(a: T): T => a.map((v) => -v) as unknown as T;

export const scale = <T extends Vec>(v: T, s: number): T =>
  v.map((x) => x * s) as unknown as T;

export const dot = (a: Vec, b: Vec): number =>
  a.reduce((sum, v, i) => sum + v * b[i], 0);

export const mod = <T extends Vec>(v: T): number => Math.sqrt(dot(v, v));

export const norm = <T extends Vec>(v: T): T => {
  const len = mod(v);
  return len === 0 ? v : scale(v, 1 / len);
};

//

export abstract class V<T extends readonly number[]> implements VType {
  abstract val: T;
  abstract length: T["length"];

  [Symbol.iterator](): IterableIterator<number> {
    return this.val[Symbol.iterator]() as IterableIterator<number>;
  }

  //

  add(b: T | this): this {
    this.val.map((v, i) => v + (b as T)[i]);
    return this;
  }

  sub(b: T | this): this {
    this.val.map((v, i) => v - (b as T)[i]);
    return this;
  }

  mul(b: T | this): this {
    this.val.map((v, i) => v * (b as T)[i]);
    return this;
  }

  div(b: T | this): this {
    this.val.map((v, i) => v / (b as T)[i]);
    return this;
  }

  neg(): this {
    this.val.map((v) => -v);
    return this;
  }

  scale(s: number): this {
    this.val.map((v) => v * s);
    return this;
  }

  norm(): this {
    const len = this.mod();
    this.val.map((v) => v / len);
    return this;
  }

  //

  dot(b: T | this): number {
    return dot(this.val, b as T);
  }

  mod(): number {
    return mod(this.val);
  }
}
