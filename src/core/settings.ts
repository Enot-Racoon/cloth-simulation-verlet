import { Settings } from "../types";

// ================================
// Simulation parameters
// ================================
export const SETTINGS: Settings = {
  gravity: 0.5,
  friction: 0.5,
  constraintIterations: 8,
  pointSpacing: 20,
  showFloor: true,
  floorOffset: 10, // percent of the canvas height
  mouseRadius: 20,
  textureImage: "towelie.png",
  crt: {
    curvature: 0.05,
    rgbSplit: 0.001,
    scanline: 0.2,
    wobble: 0.0005,
    noise: 0.04,
    vignette: 0.8,
  },
};

// ================================
// Material parameters
// ================================
export const MATERIALS = {
  cloth: { tearMultiplier: 2.0 },
  rope: { tearMultiplier: 3.0 },
  rubber: { tearMultiplier: 6.0 },
};
