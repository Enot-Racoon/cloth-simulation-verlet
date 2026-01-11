import { Mouse, AccelerometerData } from "../types";
import { PhysicsEngine, normalizeVector } from "./physics";
import { SETTINGS } from "./settings";

// ================================
// Input handling
// ================================
export class InputManager {
  private mouse: Mouse;
  private accelerometer: AccelerometerData;
  private physics: PhysicsEngine;
  private canvas: HTMLCanvasElement;

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

  private setupEventListeners(): void {
    // Touch events
    this.canvas.addEventListener("touchstart", (e: TouchEvent) => {
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

    this.canvas.addEventListener("touchmove", (e: TouchEvent) => {
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

    this.canvas.addEventListener("touchend", () => {
      this.mouse.down = false;

      if (this.mouse.point) {
        this.mouse.point.pinned = this.mouse.initialPinned;
        this.mouse.point = null;
      }
    });

    // Mouse events
    this.canvas.addEventListener("mousedown", (e: MouseEvent) => {
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

    this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
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

    this.canvas.addEventListener("mouseup", () => {
      this.mouse.down = false;

      if (this.mouse.point) {
        this.mouse.point.pinned = this.mouse.initialPinned;
        this.mouse.point = null;
      }
    });

    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === " " && this.mouse.point) {
        e.preventDefault();

        if (this.mouse.down) {
          this.mouse.initialPinned = !this.mouse.initialPinned;
        } else {
          this.mouse.point.pinned = !this.mouse.point.pinned;
        }
      }
    });

    // Accelerometer
    window.addEventListener("devicemotion", this.handleMotion.bind(this));
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
    const magnitude = Math.sqrt(
      this.accelerometer.filtered.x * this.accelerometer.filtered.x +
        this.accelerometer.filtered.y * this.accelerometer.filtered.y
    );

    const threshold = 1.0;
    if (magnitude > threshold) {
      this.accelerometer.normalized = normalizeVector(
        this.accelerometer.filtered
      );
    } else {
      this.accelerometer.normalized.z = this.accelerometer.filtered.z / 9.8;
    }
  }
}
