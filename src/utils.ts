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

export const angleOf = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

export const angleBetween = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
): number => {
  const a1 = angleOf(p1, p2);
  const a2 = angleOf(p2, p3);
  return normalizeAngle(a2 - a1);
};

export const angleDiff = (a1: number, a2: number): number => {
  return normalizeAngle(a2 - a1);
};

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

export const getIntersection = (
  a1: { x: number; y: number },
  a2: { x: number; y: number },
  b1: { x: number; y: number },
  b2: { x: number; y: number },
): { x: number; y: number } | null => {
  const denom = (a1.x - a2.x) * (b1.y - b2.y) - (a1.y - a2.y) * (b1.x - b2.x);

  if (denom === 0) return null;

  const t =
    ((a1.x - b1.x) * (b1.y - b2.y) - (a1.y - b1.y) * (b1.x - b2.x)) / denom;

  return {
    x: a1.x + t * (a2.x - a1.x),
    y: a1.y + t * (a2.y - a1.y),
  };
};

// Fluently

type Fluent<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? FluentMethod<T, T[K]>
    : T[K];
} & SetterKeys<T> & {
    $$: T;
  };

type FluentMethod<T, F> = F extends {
  (...args: infer A1): infer R1;
  (...args: infer A2): infer R2;
  (...args: infer A3): infer R3;
  (...args: infer A4): infer R4;
}
  ? ((...args: A1) => R1 extends void | undefined ? Fluent<T> : R1) &
      ((...args: A2) => R2 extends void | undefined ? Fluent<T> : R2) &
      ((...args: A3) => R3 extends void | undefined ? Fluent<T> : R3) &
      ((...args: A4) => R4 extends void | undefined ? Fluent<T> : R4)
  : F extends {
        (...args: infer A1): infer R1;
        (...args: infer A2): infer R2;
        (...args: infer A3): infer R3;
      }
    ? ((...args: A1) => R1 extends void | undefined ? Fluent<T> : R1) &
        ((...args: A2) => R2 extends void | undefined ? Fluent<T> : R2) &
        ((...args: A3) => R3 extends void | undefined ? Fluent<T> : R3)
    : F extends {
          (...args: infer A1): infer R1;
          (...args: infer A2): infer R2;
        }
      ? ((...args: A1) => R1 extends void | undefined ? Fluent<T> : R1) &
          ((...args: A2) => R2 extends void | undefined ? Fluent<T> : R2)
      : F extends (...args: infer A) => infer R
        ? (...args: A) => R extends void | undefined ? Fluent<T> : R
        : F;

type SetterKeys<T> = {
  [K in keyof T as K extends string ? `set${Capitalize<K>}` : never]: (
    value: T[K],
  ) => Fluent<T>;
};

export const fluently = <T extends object>(target: T): Fluent<T> => {
  const proxy = new Proxy(target, {
    get(target, prop, receiver) {
      if (prop === "$$") {
        return target;
      }

      // check if it is a setter
      if (typeof prop === "string" && prop.startsWith("set")) {
        const fieldName = prop.slice(3); // убираем 'set'
        const actualFieldName =
          fieldName.charAt(0).toLowerCase() + fieldName.slice(1);

        // check if the field exists
        if (actualFieldName in target) {
          return (value: any) => {
            (target as any)[actualFieldName] = value;
            return receiver; // return wrapper for chaining
          };
        }
      }

      const value = Reflect.get(target, prop, target);

      if (typeof value === "function") {
        return (...args: any[]) => {
          const result = value.apply(target, args);
          return result === undefined ? receiver : result;
        };
      }

      return value;
    },

    set(target, prop, value) {
      if (prop === "$$") {
        throw new TypeError("Cannot modify $$ property");
      }
      return Reflect.set(target, prop, value, target);
    },
  });

  return proxy as Fluent<T>;
};
