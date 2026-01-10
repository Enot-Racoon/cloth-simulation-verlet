import { PhysicsEngine } from './physics';
import { SimulationObject } from './SimulationObject';
import { SkeletonBase } from './SkeletonObject';

// ================================
// Manager for multiple simulation objects
// ================================
export class SimulationManager {
  private objects: (SimulationObject | SkeletonBase)[] = [];
  private physics: PhysicsEngine;

  constructor(physics: PhysicsEngine) {
    this.physics = physics;
  }

  addObject(obj: SimulationObject | SkeletonBase): void {
    this.objects.push(obj);

    // If it's a skeleton object, add its components to the physics engine
    if (obj instanceof SkeletonBase) {
      obj.addToPhysicsEngine(this.physics);
    }
  }

  removeObject(obj: SimulationObject | SkeletonBase): void {
    const index = this.objects.indexOf(obj);
    if (index !== -1) {
      this.objects.splice(index, 1);
    }
  }

  update(deltaTime: number): void {
    // Update all objects
    for (const obj of this.objects) {
      obj.update(deltaTime);

      // Apply custom physics for skeleton objects
      if (obj instanceof SkeletonBase) {
        obj.applyCustomPhysics();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render all visible objects
    for (const obj of this.objects) {
      if (obj.visible) {
        obj.render(ctx);
      }
    }
  }

  getAllObjects(): (SimulationObject | SkeletonBase)[] {
    return [...this.objects];
  }

  clear(): void {
    this.objects = [];
  }
}