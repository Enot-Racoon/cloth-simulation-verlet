import { SETTINGS } from "./core/settings";
import { Chain, SoftBody } from "./objects";
import { withKeyboardControl } from "./core/decorator";
import RuntimeContext from "./core/context";
import type { Settings } from "./types";
import Bike from "./objects/bike";
import Hose from "./objects/hose";

class App {
  private lastTime = 0;
  private running = false;
  private context: RuntimeContext;
  private animationId: number | null = null;

  constructor(settings: Settings) {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    this.context = new RuntimeContext(canvas, settings);

    this.setupScene();
    this.initializeObjects();

    this.start();
  }

  private setupScene(): void {
    this.context.settings.pointSpacing =
      Math.min(this.context.viewport.width, this.context.viewport.height) / 40;
    this.context.physics.generateFloor();
  }

  private initializeObjects(): void {
    // const m = 1;
    // this.context.initializer.initCloth({
    //   startX: 4 * SETTINGS.pointSpacing,
    //   startY: 2 * SETTINGS.pointSpacing,
    //   columns: Math.ceil(17 / m),
    //   rows: Math.ceil(24 / m),
    //   pinTop: false,
    //   pinTopLeft: true,
    //   pinTopRight: true,
    //   pinTopCenter: true,
    //   segmentLength: SETTINGS.pointSpacing * 2 * m,
    // });

    // Add a soft body object
    // const wheelA = new SoftBody(
    //   window.innerWidth / 3,
    //   (window.innerHeight / 5) * 3.3,
    //   50,
    //   13,
    // );
    // this.context.simulation.addObject(
    //   withKeyboardControl(this.context.input, this.context.debug)(wheelA),
    // );

    const bike = new Bike(
      this.context,
      window.innerWidth / 2,
      (window.innerHeight / 5) * 3.5,
    );
    // bike.wheelA = withKeyboardControl(
    //   this.context.input,
    //   this.context.debug,
    // )(bike.wheelA);
    bike.wheelB = withKeyboardControl(
      this.context.input,
      this.context.debug,
    )(bike.wheelB);
    this.context.simulation.addObject(bike);

    // const wheelB = new SoftBody(
    //   window.innerWidth / 2 + 100,
    //   (window.innerHeight / 5) * 3.3,
    //   40,
    //   13,
    // );
    // this.context.simulation.addObject(wheelB);
    // this.context.physics.createConstraint(
    //   wheelA.startIndex + wheelA.pointCount - 1,
    //   wheelB.startIndex + wheelB.pointCount - 1,
    //   100,
    //   0,
    // );

    // Add a chain object
    // const chain = new Chain(window.innerWidth / 3, 100, 40, 16, 0.8);
    this.context.simulation.addObject(
      new Hose(this.context, window.innerWidth / 3, 100, 60, 10),
    );
  }

  processInput(): void {
    this.context.input.applyMouseInteraction();
    if (this.context.input.isReleased("p")) {
      this.context.renderer.togglePostProcess();
    }
  }

  private update = (dt: number): void => {
    // Apply forces
    const gravity = this.context.input.getGravity();
    this.context.physics.applyForces(gravity); // todo: add dt

    // Handle mouse interaction
    this.processInput();

    // Update physics
    this.context.physics.update(); // todo: add dt

    // Update simulation objects
    this.context.simulation.update(dt);

    // Apply boundary conditions
    this.context.physics.applyBoundaryConditions();

    // Update debug info
    // this.context.debug.updateDebugData(
    //   this.context.physics.getPoints().length,
    //   this.context.physics.getConstraints().length,
    //   this.context.physics.getFaces().length,
    // );
  };

  private render = (): void => {
    // Clear and render scene
    this.context.renderer.render();

    // Render simulation objects
    const ctx = this.context.renderer.getContext();
    if (ctx) {
      this.context.simulation.render(ctx);
    }

    // Render mouse interaction
    this.context.renderer.renderMouse(this.context.input.getMouse());

    this.context.renderer.update();
  };

  private loop = (time: number): void => {
    if (!this.running) return;

    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(dt);
    this.render();
    this.context.renderer.postprocess(dt);

    this.animationId = requestAnimationFrame(this.loop);
  };

  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    if (!this.running) return;

    this.running = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// ================================
// Entry point
// ================================
function init(): void {
  app = new App(SETTINGS);
}

let app: App | null = null;

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
