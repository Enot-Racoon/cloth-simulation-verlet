import { PhysicsEngine } from './core/physics';
import { InputManager } from './core/input';
import { Renderer } from './core/renderer';
import { ObjectInitializer } from './core/initializers';
import { DebugManager } from './core/debug';
import { SETTINGS } from './core/settings';
import { SimulationManager } from './core/SimulationManager';
import { SoftBody, Chain } from './objects';

// ================================
// Main Application Class
// ================================
class ClothSimulationApp {
  private canvas: HTMLCanvasElement;
  private physics: PhysicsEngine;
  private input: InputManager;
  private renderer: Renderer;
  private initializer: ObjectInitializer;
  private debug: DebugManager;
  private simulationManager: SimulationManager;
  private animationId: number | null = null;

  constructor() {
    // Initialize canvas
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;

    // Initialize systems
    this.physics = new PhysicsEngine();
    this.input = new InputManager(this.canvas, this.physics);
    this.renderer = new Renderer(this.canvas, this.physics);
    this.initializer = new ObjectInitializer(this.physics);
    this.debug = new DebugManager();
    this.simulationManager = new SimulationManager(this.physics);

    // Setup canvas resizing
    this.setupCanvas();

    // Initialize simulation objects
    this.initializeObjects();

    // Start the main loop
    this.start();
  }

  private setupCanvas(): void {
    const resizeCanvas = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      SETTINGS.pointSpacing = Math.min(this.canvas.width, this.canvas.height) / 40;
      this.physics.updateFloor();
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
  }

  private initializeObjects(): void {
    const m = 1;
    // this.initializer.initCloth({
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
    const softBody = new SoftBody(
      window.innerWidth / 2,
      window.innerHeight / 3,
      50,
      12 * 2
    );
    this.simulationManager.addObject(softBody);

    // Add a chain object
    // const chain = new Chain(
    //   window.innerWidth / 3,
    //   100,
    //   40,
    //   16,
    //   0.8
    // );
    // this.simulationManager.addObject(chain);
  }

  private update = (): void => {
    // Apply forces
    const gravity = this.input.getGravity();
    this.physics.applyForces(gravity);

    // Handle mouse interaction
    this.input.applyMouseInteraction();

    // Update physics
    this.physics.update();

    // Update simulation objects
    this.simulationManager.update(1 / 60); // Assuming ~60fps

    // Update debug info
    this.debug.updateDebugData(
      this.physics.getPoints().length,
      this.physics.getConstraints().length,
      this.physics.getFaces().length
    );
  };

  private render = (): void => {
    // Clear and render scene
    this.renderer.render();

    // Render simulation objects
    const ctx = this.renderer.getContext(); // We need to add this method to Renderer
    if (ctx) {
      this.simulationManager.render(ctx);
    }

    // Render mouse interaction
    this.renderer.renderMouse(this.input.getMouse());

    // Update renderer FPS
    this.renderer.update();
  };

  private loop = (): void => {
    this.update();
    this.render();
    this.animationId = requestAnimationFrame(this.loop);
  };

  private start(): void {
    this.animationId = requestAnimationFrame(this.loop);
  }

  public destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// ================================
// Entry point
// ================================
let app: ClothSimulationApp | null = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init(): void {
  app = new ClothSimulationApp();
}
















































































































































































































