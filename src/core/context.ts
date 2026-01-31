import type { Settings } from "../types";
import { DebugManager } from "./debug";
import { ObjectInitializer } from "./initializers";
import { InputManager } from "./input";
import { PhysicsEngine } from "./physics";
import { Renderer } from "./renderer";
import { SimulationManager } from "./SimulationManager";
import Viewport from "./viewport";

class RuntimeContext {
  settings: Settings;
  viewport: Viewport;
  physics: PhysicsEngine;
  input: InputManager;
  renderer: Renderer;
  initializer: ObjectInitializer;
  debug: DebugManager;
  simulation: SimulationManager;

  constructor(canvas: HTMLCanvasElement, settings: Settings) {
    this.settings = settings;
    this.viewport = new Viewport(canvas);
    this.physics = new PhysicsEngine();
    this.input = new InputManager(this.viewport.canvasPost, this.physics);
    this.renderer = new Renderer(this.viewport, this.physics, settings);
    this.initializer = new ObjectInitializer(this.physics);
    this.debug = new DebugManager();
    this.simulation = new SimulationManager(this.physics);
  }
}

export default RuntimeContext;
