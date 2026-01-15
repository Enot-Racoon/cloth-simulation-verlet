import { Mouse, AccelerometerData } from "../types";
import { PhysicsEngine, normalizeVector } from "./physics";
import { SETTINGS } from "./settings";

// ================================
// Input handling
// ================================
export class InputManager implements Disposable {
  private pressedKeys = new Set<string>();
  private releasedKeys = new Set<string>();
  private mouse: Mouse;
  private accelerometer: AccelerometerData;
  private physics: PhysicsEngine;
  private canvas: HTMLCanvasElement;
  private toDispose: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement, physics: PhysicsEngine) {
    this.canvas = canvas;
    this.physics = physics;
    this.mouse = {
      x: 0,
      y: 0,
      down: false,
      point: null,
      initialPinned: false,
      radius: SETTINGS.mouseRadius,
    };
    this.accelerometer = {
      raw: { x: 0, y: 9.8, z: 0 },
      filtered: { x: 0, y: 9.8, z: 0 },
      normalized: { x: 0, y: 1, z: 0 },
    };

    this.setupEventListeners();
  }

  [Symbol.dispose](): void {
    this.toDispose.forEach((dispose) => dispose());
  }

  getMouse(): Mouse {
    return this.mouse;
  }
  getAccelerometer(): AccelerometerData {
    return this.accelerometer;
  }

  getGravity(): { x: number; y: number } {
    return {
      x: -this.accelerometer.normalized.x * SETTINGS.gravity,
      y: this.accelerometer.normalized.y * SETTINGS.gravity,
    };
  }

  applyMouseInteraction(): void {
    if (!this.mouse.down || !this.mouse.point) return;

    this.mouse.point.x = this.mouse.x;
    this.mouse.point.y = this.mouse.y;
    this.mouse.point.prevX = this.mouse.x;
    this.mouse.point.prevY = this.mouse.y;

    if (SETTINGS.showFloor) {
      const floorY = this.physics.getFloorYAt(this.mouse.x);
      if (this.mouse.y >= floorY) {
        this.mouse.point.y = floorY;
        this.mouse.point.prevY = floorY;
      }
    }
  }

  isPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  isReleased(key: string): boolean {
    const isReleased = this.releasedKeys.has(key);
    this.releasedKeys.delete(key);
    return isReleased;
  }

  private addWindowEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    window.addEventListener(type, listener, options);
    this.toDispose.push(() =>
      window.removeEventListener(type, listener, options)
    );
  }

  private addCanvasEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLCanvasElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.canvas.addEventListener(type, listener, options);
    this.toDispose.push(() =>
      this.canvas.removeEventListener(type, listener, options)
    );
  }

  private setupEventListeners(): void {
    // Touch events
    this.addCanvasEventListener("touchstart", (e: TouchEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.touches[0].clientX - rect.left;
      this.mouse.y = e.touches[0].clientY - rect.top;
      this.mouse.down = true;

      this.mouse.point = this.physics.findNearestPoint(
        this.mouse.x,
        this.mouse.y,
        this.mouse.radius
      );

      if (this.mouse.point) {
        this.mouse.initialPinned = this.mouse.point.pinned;
        this.mouse.point.pinned = true;
      }
    });

    this.addCanvasEventListener("touchmove", (e: TouchEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const smoothing = 0.2;
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      this.mouse.x += (x - this.mouse.x) * smoothing;
      this.mouse.y += (y - this.mouse.y) * smoothing;

      if (!this.mouse.down) {
        this.mouse.point = this.physics.findNearestPoint(
          x,
          y,
          this.mouse.radius
        );
      }
    });

    this.addCanvasEventListener("touchend", () => {
      this.mouse.down = false;

      if (this.mouse.point) {
        this.mouse.point.pinned = this.mouse.initialPinned;
        this.mouse.point = null;
      }
    });

    // Mouse events
    this.addCanvasEventListener("mousedown", (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      this.mouse.down = true;

      this.mouse.point = this.physics.findNearestPoint(
        this.mouse.x,
        this.mouse.y,
        this.mouse.radius
      );

      if (this.mouse.point) {
        this.mouse.initialPinned = !!this.mouse.point.pinned;
        this.mouse.point.pinned = true;
      }
    });

    this.addCanvasEventListener("mousemove", (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const smoothing = 0.2;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.mouse.x += (x - this.mouse.x) * smoothing;
      this.mouse.y += (y - this.mouse.y) * smoothing;

      if (!this.mouse.down) {
        this.mouse.point = this.physics.findNearestPoint(
          x,
          y,
          this.mouse.radius
        );
      }
    });

    this.addCanvasEventListener("mouseup", () => {
      this.mouse.down = false;

      if (this.mouse.point) {
        this.mouse.point.pinned = this.mouse.initialPinned;
        this.mouse.point = null;
      }
    });

    // Keyboard events
    this.addWindowEventListener("keydown", (e: KeyboardEvent) => {
      this.pressedKeys.add(e.key);

      if (e.key === " " && this.mouse.point) {
        e.preventDefault();

        if (this.mouse.down) {
          this.mouse.initialPinned = !this.mouse.initialPinned;
        } else {
          this.mouse.point.pinned = !this.mouse.point.pinned;
        }
      }
    });

    this.addWindowEventListener("keyup", (e: KeyboardEvent) => {
      this.pressedKeys.delete(e.key);
      this.releasedKeys.add(e.key);
    });

    // Accelerometer
    this.addWindowEventListener("devicemotion", this.handleMotion.bind(this));
  }

  private handleMotion(event: DeviceMotionEvent): void {
    const smoothing = 0.2;
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const x = acceleration.x ?? 0;
    const y = acceleration.y ?? 0;
    const z = acceleration.z ?? 0;

    // Update raw data
    this.accelerometer.raw = { x, y, z };

    // Low pass filter
    this.accelerometer.filtered.x +=
      (x - this.accelerometer.filtered.x) * smoothing;
    this.accelerometer.filtered.y +=
      (y - this.accelerometer.filtered.y) * smoothing;
    this.accelerometer.filtered.z +=
      (z - this.accelerometer.filtered.z) * smoothing;

    // Normalize
    // optimize math sqrt
    const magnitude2 =
      this.accelerometer.filtered.x * this.accelerometer.filtered.x +
      this.accelerometer.filtered.y * this.accelerometer.filtered.y;

    const threshold = 1.0;
    if (magnitude2 > threshold * threshold) {
      this.accelerometer.normalized = normalizeVector(
        this.accelerometer.filtered
      );
    } else {
      this.accelerometer.normalized.z = this.accelerometer.filtered.z / 9.8;
    }
  }
}
