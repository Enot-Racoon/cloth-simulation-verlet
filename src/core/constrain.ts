import type { Constraint, ConstraintBehavior } from "../types";

export const RopeBehavior: ConstraintBehavior = {
  compliance: 0,
  breakStress: 0.3
}

export const RubberBehavior: ConstraintBehavior = {
  compliance: 0.01,
  damping: 0.2
}

export const ClothBehavior: ConstraintBehavior = {
  compliance: 0.002,
  damping: 0.1
}

abstract class BaseConstraint implements Constraint {
  protected enabled = true
  i1: number;
  i2: number;

  isEnabled(): boolean {
    return this.enabled;
  }

  constructor(i1: number, i2: number) {
    this.i1 = i1;
    this.i2 = i2;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  abstract solve(dt: number): void

  getStress?(): number
  onBreak?(): void
}

/*
Используется для:
  палок
  пружин
  сеток
  soft body
  мышц
*/
export class DistanceConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of distance constraint solving
    // ...
  }
}

/*
Используется для:
  веревка
  цепь
  контакт
  ограничитель
*/
export class MaxDistanceConstraint extends DistanceConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of max distance constraint solving
    // ...
  }
}

/*
Используется для:
  ограничение минимального расстояния между точками
  предотвращение схлопывания
  внутренние объемы
  отталкивание частиц
*/
export class MinDistanceConstraint extends DistanceConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of min distance constraint solving
    // ...
  }
}

/*
Используется для:
  угловых ограничений
  шарниров
  суставов
  ragdoll
  articulated bodies
*/
export class AngleConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of angle constraint solving
    // ...
  }
}

/*
Используется для:
  шарниров с одной степенью свободы
  локти
  двери
  рычаги
*/
export class HingeConstraint extends AngleConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of hinge constraint solving
    // ...
  }
}

/*
Используется для:
  сгибания тканей
  предотвращение чрезмерного изгиба
  поддержание формы
  ткани
  бумаги
  кожи
  мягких оболочек
*/
export class BendingConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of bending constraint solving
    // ...
  }
}

/*
Используется для:
  поддержание объема
  внутреннее давление
  мягкие тела
  шары
  подушки
  мягкие тела
  желе
  мышцы
  органы
*/
export class VolumeConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of volume constraint solving
    // ...
  }
}

/*
Используется для:
  фиксированных точек
  привязка к миру
  неподвижные объекты
  якорей
  закреплений
  подвешенных объектов
*/
export class FixedConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of fixed constraint solving
    // ...
  }
}

/*
Используется для:
  прикрепление объектов друг к другу
  соединения
  сцепки
  связки
  склейка
  шарниры
  родительские связи
*/
export class AttachmentConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of attachment constraint solving
    // ...
  }
}

/*
Используется для:
  обработка столкновений
  предотвращение проникновения
  откат при столкновении
  твердые тела
  физические взаимодействия
  столкновений
  земли
  стен
*/
export class ContactConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of contact constraint solving
    // ...
  }
}

export class ConstraintGroup extends BaseConstraint {
  private constraints: BaseConstraint[] = [];

  constructor(constraints: BaseConstraint[] = []) {
    super(-1, -1);
    this.constraints = constraints;
  }

  addConstraint(constraint: BaseConstraint): void {
    this.constraints.push(constraint);
  }

  removeConstraint(constraint: BaseConstraint): void {
    const index = this.constraints.indexOf(constraint);
    if (index > -1) {
      this.constraints.splice(index, 1);
    }
  }

  solve(dt: number): void {
    if (!this.enabled) return;

    for (const constraint of this.constraints) {
      constraint.solve(dt);
    }
  }
}

// ---- Auto-generated Clases ----

/*
Используется для:
  ограничение движения вдоль определенной оси
  направляющие
  рельсы
  линейные шарниры
  слайдеры
*/
export class AxisConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of axis constraint solving
    // ...
  }
}

/*
Используется для:
  поддержание формы
  предотвращение искажения
  структурные ограничения
  каркасные объекты
  твердые оболочки
*/
export class ShapeConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of shape constraint solving
    // ...
  }
}

/*
Используется для:
  симуляция трения между точками
  контроль скольжения
  поверхностные взаимодействия
  контактные силы
*/
export class FrictionConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of friction constraint solving
    // ...
  }
}

/*
Используется для:
  симуляция упругих столкновений
  отскок между точками
  реакция на столкновения
  динамические взаимодействия
*/
export class BounceConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of bounce constraint solving
    // ...
  }
}

/*
Используется для:
  симуляция вязких связей между точками
  демпфирование колебаний
  стабилизация движения
*/
export class DampingConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of damping constraint solving
    // ...
  }
}

/*
Используется для:
  симуляция магнитных или электрических сил между точками
  притяжение и отталкивание
  поля сил
*/
export class ForceFieldConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of force field constraint solving
    // ...
  }
}

/*
Используется для:
  симуляция ограничений скорости между точками
  контроль максимальной скорости
  стабилизация движения
*/
export class VelocityConstraint extends BaseConstraint {
  solve(dt: number): void {
    if (!this.enabled) return;

    // Implementation of velocity constraint solving
    // ...
  }
} 
