import { SoftBody } from "./SoftBody";
import type { Constraint, Updatable, Renderable } from "../types";
import RuntimeContext from "../core/context";
import { SkeletonBase } from "../core/SkeletonObject";
import { PhysicsEngine } from "../core/physics";

export default class Bike
  extends SkeletonBase
  implements Updatable, Renderable
{
  public wheelA: SoftBody;
  public wheelB: SoftBody;
  public frame: Constraint[];

  constructor(
    private ctx: RuntimeContext,
    x: number,
    y: number,
  ) {
    super();
    this.frame = [];

    this.wheelA = new SoftBody(x, y, 50, 13);
    this.wheelB = new SoftBody(x + 100, y, 40, 13);

    // this.frame.push(ctx.physics.createConstraint(-1, 0, 100, 0));
  }

  update(dt: number): void {
    this.wheelA.update(dt);
    this.wheelB.update(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.lineWidth = 8;
    this.wheelA.render(ctx);
    ctx.lineWidth = 8;
    this.wheelB.render(ctx);

    ctx.beginPath();
    ctx.moveTo(this.wheelA.center.x, this.wheelA.center.y);
    ctx.lineTo(this.wheelB.center.x, this.wheelB.center.y);
    ctx.closePath();
    ctx.strokeStyle = "hsla(221, 70%, 30%, 0.80)";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  applyCustomPhysics(): void {}

  addToPhysicsEngine(physics: PhysicsEngine): void {
    this.wheelA.addToPhysicsEngine(physics);
    this.wheelB.addToPhysicsEngine(physics);

    physics.createConstraint(
      this.wheelA.startIndex + this.wheelA.pointCount - 1,
      this.wheelB.startIndex + this.wheelB.pointCount - 1,
      100,
      0,
    );
  }
}
