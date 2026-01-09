import { DebugData } from '../types';

// ================================
// Debug system
// ================================
export class DebugManager {
  private debug: DebugData;

  constructor() {
    const debugElement = document.getElementById("debug") as HTMLElement;

    this.debug = {
      showDebug: false,
      debugData: {},
      element: debugElement,
      setDebugText: (data: any) => {
        if (!this.debug.showDebug) return;
        this.debug.element.textContent = JSON.stringify(data, null, 2);
      },
      clear: () => {
        this.debug.debugData = {};
        this.debug.setDebugText(this.debug.debugData);
      },
      update: () => {
        this.debug.setDebugText(this.debug.debugData);
      },
      setDebugData: (key: string, value: any) => {
        this.debug.debugData[key] = value;
        this.debug.setDebugText(this.debug.debugData);
      },
    };
  }

  getDebug(): DebugData {
    return this.debug;
  }

  updateDebugData(pointsCount: number, constraintsCount: number, facesCount: number): void {
    this.debug.setDebugData("points", pointsCount);
    this.debug.setDebugData("constraints", constraintsCount);
    this.debug.setDebugData("faces", facesCount);
  }

  setDebugData(key: string, value: any): void {
    this.debug.setDebugData(key, value);
  }

  clear(): void {
    this.debug.clear();
  }
}