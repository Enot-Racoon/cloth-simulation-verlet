export const clamp = (v: number, min = 0, max = 1): number =>
  Math.max(min, Math.min(max, v));

export const range = (n: number): number[] => [...Array(n).keys()];

export const rand = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

export const normalizeAngle = (angle: number): number => {
  let normalized = angle % (2 * Math.PI);

  if (normalized > Math.PI) {
    normalized -= 2 * Math.PI;
  } else if (normalized <= -Math.PI) {
    normalized += 2 * Math.PI;
  }

  return normalized;
};

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

export const getIntersection = (
  line1: [[number, number], [number, number]],
  line2: [[number, number], [number, number]],
): [number, number] | null => {
  const [[x1, y1], [x2, y2]] = line1;
  const [[x3, y3], [x4, y4]] = line2;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (denom === 0) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
};
