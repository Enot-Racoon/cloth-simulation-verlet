import { SoftBody } from "../objects/SoftBody";
import { DebugManager } from "./debug";
import { InputManager } from "./input";

export const withKeyboardControl =
  (input: InputManager, debug: DebugManager) =>
  (node: SoftBody, maxSpeed: number = 200) => {
    const baseUpdate = node.update;

    const maxRotateSpeed = 1;
    const rotateAcceleration = 0.01;
    const rotateDeacceleration = 0.1;
    let rotateSpeed = 0;

    node.update = (dt: number) => {
      if (input.isPressed("ArrowLeft") || input.isPressed("a"))
        node.x -= maxSpeed * dt;
      if (input.isPressed("ArrowRight") || input.isPressed("d"))
        node.x += maxSpeed * dt;

      if (input.isPressed("ArrowUp") || input.isPressed("w"))
        node.y -= maxSpeed * dt * 3;
      if (input.isPressed("ArrowDown") || input.isPressed("s"))
        node.y += maxSpeed * dt;

      const rotateInc = input.isPressed("q");
      const rotateDec = input.isPressed("e");
      if (rotateInc || rotateDec) {
        if (rotateInc) {
          rotateSpeed -= rotateAcceleration * dt;

          if (rotateSpeed < -maxRotateSpeed) rotateSpeed = -maxRotateSpeed;
        }

        if (rotateDec) {
          rotateSpeed += rotateAcceleration * dt;

          if (rotateSpeed > maxRotateSpeed) rotateSpeed = maxRotateSpeed;
        }
      } else {
        if (rotateSpeed > 0) {
          rotateSpeed -= rotateDeacceleration * dt;
          if (rotateSpeed < 0) rotateSpeed = 0;
        }
        if (rotateSpeed < 0) {
          rotateSpeed += rotateDeacceleration * dt;
          if (rotateSpeed > 0) rotateSpeed = 0;
        }
      }

      if (rotateSpeed !== 0) node.rotate(rotateSpeed);

      debug.setDebugData(
        "rotateSpeed",
        rotateSpeed.toFixed(4).padStart(7, " ")
      );

      baseUpdate(dt);
    };

    return node;
  };
