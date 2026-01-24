export const clamp = (v: number, min = 0, max = 1): number =>
  Math.max(min, Math.min(max, v));

export const range = (n: number): number[] => [...Array(n).keys()];

export const rand = (min: number, max: number): number =>
  Math.random() * (max - min) + min;
