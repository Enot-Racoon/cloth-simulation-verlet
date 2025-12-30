// ================================
// Simulation parameters
// ================================
const SETTINGS = {
  gravity: 0.4,
  friction: 0.97,
  constraintIterations: 8,
  pointSpacing: 20,
  showFloor: false,
  floorOffset: 10, // percent of the canvas height

  mouseRadius: 20,

  textureImage: "texture-1099399_1280.jpg",
};

// ================================
// Material parameters
// ================================
const MATERIALS = {
  cloth: { tearMultiplier: 2.0 },
  rope: { tearMultiplier: 3.0 },
  rubber: { tearMultiplier: 6.0 },
};

// ================================
// Debug
// ================================
const debug = {
  showDebug: true,
  debugData: {},
  element: document.getElementById("debug"),
  setDebugText(data) {
    if (!this.showDebug) return;
    this.element.textContent = JSON.stringify(data, null, 2);
  },
  clear() {
    this.debugData = {};
    this.update();
  },
  update() {
    this.setDebugText(this.debugData);
  },
  setDebugData(key, value) {
    this.debugData[key] = value;
    this.update();
  },
};

// ================================
// FPS Meter
// ================================
const fpsMeter = {
  v: 0,
  lastTime: performance.now(),
  frames: 0,
  update() {
    const now = performance.now();
    this.frames++;
    if (now > this.lastTime + 1000) {
      this.v = Math.round((this.frames * 1000) / (now - this.lastTime));
      this.lastTime = now;
      this.frames = 0;
    }
  },
  render(ctx) {
    ctx.save();
    ctx.font = "14px monospace";
    ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
    ctx.textAlign = "right";
    ctx.fillText(`${this.v} FPS`, canvas.width - 20, 30);
    ctx.restore();
  },
};

// ================================
// Floor
// ================================
let floorY = 0;

// ================================
// Canvas setup
// ================================
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  SETTINGS.pointSpacing = Math.min(canvas.width, canvas.height) / 40;

  if (!SETTINGS.showFloor) return;
  floorY = canvas.height - (canvas.height * SETTINGS.floorOffset) / 100;

  if (typeof updateOffscreenSize === "function") updateOffscreenSize();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
const offscreenCtx = offscreenCanvas.getContext("2d");
let targetImgData = offscreenCtx.createImageData(canvas.width, canvas.height);

function updateOffscreenSize() {
  offscreenCanvas.width = canvas.width;
  offscreenCanvas.height = canvas.height;
  offscreenCtx.imageSmoothingEnabled = false;
  targetImgData = offscreenCtx.createImageData(canvas.width, canvas.height);
}

// ================================
// Texture
// ================================
/**
 * Converts an HTMLImageElement to an ImageData object.
 * @param {HTMLImageElement} image The image element to convert.
 * @returns {Promise<ImageData>} A promise that resolves with the ImageData object.
 */
function imgToImageData(image) {
  return new Promise((resolve, reject) => {
    // If the image is not yet loaded, wait for the 'load' event
    if (!image.complete) {
      image.onload = () => processImage();
      image.onerror = () => reject(new Error("Image failed to load"));
    } else {
      processImage();
    }

    function processImage() {
      const { naturalWidth: width, naturalHeight: height } = image;

      // Create a temporary canvas (OffscreenCanvas is better for performance if available)
      const canvas = new OffscreenCanvas(width, height);
      // Get the 2D rendering context
      const ctx = canvas.getContext("2d");

      // Draw the image onto the canvas
      ctx.drawImage(image, 0, 0, width, height);

      // Get the ImageData object
      const imageData = ctx.getImageData(0, 0, width, height);
      resolve(imageData);
    }
  });
}

let isTextureImageLoaded = false;
let textureData = new Uint8ClampedArray([]);

const textureImage = new Image();
textureImage.src = SETTINGS.textureImage;

imgToImageData(textureImage).then((imageData) => {
  textureData = imageData;
  isTextureImageLoaded = true;
});

// ================================
// Accelerometer
// ================================
const accelerometer = {
  raw: { x: 0, y: 9.8, z: 0 },
  filtered: { x: 0, y: 9.8, z: 0 },
  normalized: { x: 0, y: 1, z: 0 },
};

function handleMotion(event) {
  const smoothing = 0.2;
  const { x = 0, y = 0, z = 0 } = event.accelerationIncludingGravity;

  // 1. Update Raw Data
  accelerometer.raw = { x, y, z };

  // 2. Low Pass Filter
  accelerometer.filtered.x += (x - accelerometer.filtered.x) * smoothing;
  accelerometer.filtered.y += (y - accelerometer.filtered.y) * smoothing;
  accelerometer.filtered.z += (z - accelerometer.filtered.z) * smoothing;

  // 3. Normalize
  // Handle Singularity: If device is lying flat (Gravity is all Z), X and Y are ~0.
  // This causes atan2(0,0) which is unstable/undefined behavior for horizon calculation.
  // We check if the XY magnitude is significant enough to determine orientation.
  const magnitude = Math.sqrt(
    accelerometer.filtered.x * accelerometer.filtered.x +
      accelerometer.filtered.y * accelerometer.filtered.y,
  );

  const threshold = 1.0; // ~0.1g on XY plane required to update horizon

  if (magnitude > threshold) {
    accelerometer.normalized = normalizeVector(accelerometer.filtered);
  } else {
    // If flat, keep previous normalized vector to prevent "vertical rod" snapping
    // We do update Z though for debugging
    accelerometer.normalized.z = accelerometer.filtered.z / 9.8;
  }
}

window.addEventListener("devicemotion", handleMotion);

// ================================
// Mouse
// ================================
const mouse = {
  x: 0,
  y: 0,
  down: false,
  point: null,
  initialPinned: false,
  radius: SETTINGS.mouseRadius,
};

// Touch events
canvas.addEventListener("touchstart", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.touches[0].clientX - rect.left;
  mouse.y = e.touches[0].clientY - rect.top;
  mouse.down = true;

  mouse.point = findNearestPoint(mouse.x, mouse.y, mouse.radius);

  if (mouse.point) {
    mouse.initialPinned = mouse.point.pinned;
    mouse.point.pinned = true;
  }
});
canvas.addEventListener("touchmove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const smoothing = 0.2;
  const x = e.touches[0].clientX - rect.left;
  const y = e.touches[0].clientY - rect.top;
  mouse.x += (x - mouse.x) * smoothing;
  mouse.y += (y - mouse.y) * smoothing;

  if (!mouse.down) {
    mouse.point = findNearestPoint(x, y, mouse.radius);
  }
});
canvas.addEventListener("touchend", () => {
  mouse.down = false;

  if (mouse.point) {
    mouse.point.pinned = mouse.initialPinned;
    mouse.point = null;
  }
});

// Mouse events
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  mouse.down = true;

  mouse.point = findNearestPoint(mouse.x, mouse.y, mouse.radius);

  if (mouse.point) {
    mouse.initialPinned = !!mouse.point.pinned;
    mouse.point.pinned = true;
  }
});
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const smoothing = 0.2;
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  mouse.x += (x - mouse.x) * smoothing;
  mouse.y += (y - mouse.y) * smoothing;

  if (!mouse.down) {
    mouse.point = findNearestPoint(x, y, mouse.radius);
  }
});
canvas.addEventListener("mouseup", () => {
  mouse.down = false;

  if (mouse.point) {
    mouse.point.pinned = mouse.initialPinned;
    mouse.point = null;
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === " " && mouse.point) {
    e.preventDefault();

    if (mouse.down) {
      mouse.initialPinned = !mouse.initialPinned;
    } else {
      mouse.point.pinned = !mouse.point.pinned;
    }
  }
});

// ================================
// Data containers
// ================================
const points = [];
const constraints = [];
const faces = [];

// ================================
// Helper functions
// ================================
function createPoint(x, y, pinned = false) {
  return {
    x,
    y,
    prevX: x,
    prevY: y,
    pinned,
  };
}

function createConstraint(i1, i2, restLength, tearMultiplier) {
  return {
    i1,
    i2,
    restLength,
    tearLength: restLength * tearMultiplier,
  };
}

function createFace(i1, i2, i3, uv1, uv2, uv3) {
  return {
    i1,
    i2,
    i3,
    uv1,
    uv2,
    uv3,
  };
}

function findNearestPoint(x, y, radius) {
  let nearest = null;
  let minDist = radius * radius;

  for (const p of points) {
    const dx = p.x - x;
    const dy = p.y - y;
    const dist = dx * dx + dy * dy;

    if (dist < minDist) {
      minDist = dist;
      nearest = p;
    }
  }

  return nearest;
}

const range = (n) => [...Array(n).keys()];

const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));

function edge(ax, ay, bx, by, px, py) {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

function drawTriangle(ctx, p0, p1, p2) {
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.closePath();
  ctx.fill();
}

function drawTexturedTriangle(
  targetImgData,
  srcImgData,
  p0,
  p1,
  p2,
  uv0,
  uv1,
  uv2,
) {
  // Sort vertices by y coordinate
  let points = [
    { x: Math.floor(p0.x), y: Math.floor(p0.y), u: uv0.u, v: uv0.v },
    { x: Math.floor(p1.x), y: Math.floor(p1.y), u: uv1.u, v: uv1.v },
    { x: Math.floor(p2.x), y: Math.floor(p2.y), u: uv2.u, v: uv2.v },
  ].sort((a, b) => a.y - b.y);

  const [top, mid, bot] = points;

  // Draw top half (flat bottom)
  if (mid.y > top.y) {
    fillFlatBottomTriangle(targetImgData, srcImgData, top, mid, bot);
  }

  // Draw bottom half (flat top)
  if (bot.y > mid.y) {
    fillFlatTopTriangle(targetImgData, srcImgData, top, mid, bot);
  }
}

function fillFlatBottomTriangle(targetImgData, srcImgData, top, mid, bot) {
  const invSlope1 = (mid.x - top.x) / (mid.y - top.y);
  const invSlope2 = (bot.x - top.x) / (bot.y - top.y);

  let x1 = top.x,
    x2 = top.x;

  for (let y = Math.ceil(top.y); y <= Math.floor(mid.y); y++) {
    const t1 = (y - top.y) / (mid.y - top.y);
    const t2 = (y - top.y) / (bot.y - top.y);

    const u1 = top.u + (mid.u - top.u) * t1;
    const v1 = top.v + (mid.v - top.v) * t1;
    const u2 = top.u + (bot.u - top.u) * t2;
    const v2 = top.v + (bot.v - top.v) * t2;

    drawScanline(
      targetImgData,
      srcImgData,
      Math.ceil(x1),
      Math.ceil(x2),
      y,
      u1,
      v1,
      u2,
      v2,
    );

    x1 += invSlope1;
    x2 += invSlope2;
  }
}

function fillFlatTopTriangle(targetImgData, srcImgData, top, mid, bot) {
  const invSlope1 = (bot.x - top.x) / (bot.y - top.y);
  const invSlope2 = (bot.x - mid.x) / (bot.y - mid.y);

  let x1 = bot.x,
    x2 = bot.x;

  for (let y = Math.floor(bot.y); y > Math.ceil(mid.y); y--) {
    const t1 = (bot.y - y) / (bot.y - top.y);
    const t2 = (bot.y - y) / (bot.y - mid.y);

    const u1 = bot.u + (top.u - bot.u) * t1;
    const v1 = bot.v + (top.v - bot.v) * t1;
    const u2 = bot.u + (mid.u - bot.u) * t2;
    const v2 = bot.v + (mid.v - bot.v) * t2;

    drawScanline(
      targetImgData,
      srcImgData,
      Math.ceil(x1),
      Math.ceil(x2),
      y,
      u1,
      v1,
      u2,
      v2,
    );

    x1 -= invSlope1;
    x2 -= invSlope2;
  }
}

function drawScanline(targetImgData, srcImgData, x1, x2, y, u1, v1, u2, v2) {
  if (y < 0 || y >= targetImgData.height) return;

  if (x1 > x2) {
    [x1, x2] = [x2, x1];
    [u1, u2] = [u2, u1];
    [v1, v2] = [v2, v1];
  }

  const width = x2 - x1;
  if (width === 0) return;

  for (let x = x1; x <= x2; x++) {
    if (x < 0 || x >= targetImgData.width) continue;

    const t = (x - x1) / width;
    const u = u1 + (u2 - u1) * t;
    const v = v1 + (v2 - v1) * t;

    const tx = Math.floor(u * (srcImgData.width - 1));
    const ty = Math.floor(v * (srcImgData.height - 1));
    const srcIdx = (ty * srcImgData.width + tx) * 4;

    const r = srcImgData.data[srcIdx];
    const g = srcImgData.data[srcIdx + 1];
    const b = srcImgData.data[srcIdx + 2];
    const a = srcImgData.data[srcIdx + 3];

    // render through canvas imagedata
    const targetIdx = (y * targetImgData.width + x) * 4;

    targetImgData.data[targetIdx] = r;
    targetImgData.data[targetIdx + 1] = g;
    targetImgData.data[targetIdx + 2] = b;
    targetImgData.data[targetIdx + 3] = a;
  }
}

/**
 * Requests permission to use DeviceMotionEvent.
 * Handles the iOS 13+ specific promise-based API and standard implementations.
 */
// async function requestMotionPermission() {
//   try {
//     // 1. Check if the environment supports DeviceMotionEvent
//     if (typeof DeviceMotionEvent === 'undefined') {
//       console.warn('DeviceMotionEvent is not supported on this device.');
//       return 'denied';
//     }

//     // 2. Check for iOS 13+ permission API
//     // iOS 13+ requires a user gesture (click) to trigger this.
//     if (typeof DeviceMotionEvent.requestPermission === 'function') {
//       const permission = await DeviceMotionEvent.requestPermission();
//       return permission === 'granted' ? 'granted' : 'denied';
//     }

//     // 3. Non-iOS devices (Android/Desktop)
//     // Usually do not require explicit permission requests, or handle them via browser prompts.
//     // We assume 'granted' if the API exists.
//     return 'granted';
//   } catch (error) {
//     console.error('Error requesting motion permission:', error);
//     return 'denied';
//   }
// }

// function requestAccess() {
//   requestMotionPermission().then(permission => {
//     if (permission === 'granted') {
//       console.log('Motion permission granted');
//     } else {
//       console.log('Motion permission denied');
//     }
//   });
// }

/**
 * Normalizes a vector {x, y, z} to length 1.
 * Useful for getting pure direction regardless of gravity magnitude.
 */
function normalizeVector(v) {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

  // Prevent division by zero
  if (length === 0) return { x: 0, y: 0, z: 0 };

  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length,
  };
}

// ================================
// Rope initialization
// ================================
function initRope({
  startX,
  startY,
  segmentLength,
  segmentCount,
  pinFirst = true,
  pinLast = false,
  horizontal = false,
}) {
  const baseIndex = points.length;

  const ropePoints = range(segmentCount).map((i) =>
    createPoint(
      startX + (horizontal ? i * segmentLength : 0),
      startY + (horizontal ? 0 : i * segmentLength),
      (pinFirst && i === 0) || (pinLast && i === segmentCount - 1),
    ),
  );

  const ropeConstraints = range(segmentCount - 1).map((i) =>
    createConstraint(
      baseIndex + i,
      baseIndex + i + 1,
      segmentLength,
      MATERIALS.rope.tearMultiplier,
    ),
  );

  points.push(...ropePoints);
  constraints.push(...ropeConstraints);
}

// ================================
// Cloth initialization
// ================================
function initCloth({
  startX,
  startY,
  rows,
  columns,
  segmentLength,
  pinTop = true,
  pinTopLeft = false,
  pinTopRight = false,
  pinTopCenter = false,
}) {
  const baseIndex = points.length;

  const clothPoints = range(rows).map((i) =>
    range(columns).map((j) => {
      let pinned = false;
      if (pinTop && i === 0) pinned = true;
      if (pinTopLeft && i === 0 && j === 0) pinned = true;
      if (pinTopRight && i === 0 && j === columns - 1) pinned = true;
      if (pinTopCenter && i === 0 && j === Math.floor(columns / 2))
        pinned = true;

      return createPoint(
        startX + j * segmentLength,
        startY + i * segmentLength,
        pinned,
      );
    }),
  );

  const clothFaces = range(rows - 1).map((i) =>
    range(columns - 1).map((j) => [
      createFace(
        baseIndex + i * columns + j,
        baseIndex + i * columns + j + 1,
        baseIndex + (i + 1) * columns + j + 1,
        { u: j / (columns - 1), v: i / (rows - 1) },
        { u: (j + 1) / (columns - 1), v: i / (rows - 1) },
        { u: (j + 1) / (columns - 1), v: (i + 1) / (rows - 1) },
      ),
      createFace(
        baseIndex + (i + 1) * columns + j + 1,
        baseIndex + (i + 1) * columns + j,
        baseIndex + i * columns + j,
        { u: (j + 1) / (columns - 1), v: (i + 1) / (rows - 1) },
        { u: j / (columns - 1), v: (i + 1) / (rows - 1) },
        { u: j / (columns - 1), v: i / (rows - 1) },
      ),
    ]),
  );

  const horizontalConstraints = range(rows).map((i) =>
    range(columns - 1).map((j) =>
      createConstraint(
        baseIndex + i * columns + j,
        baseIndex + i * columns + j + 1,
        segmentLength,
        MATERIALS.cloth.tearMultiplier,
      ),
    ),
  );

  const verticalConstraints = range(rows - 1).map((i) =>
    range(columns).map((j) =>
      createConstraint(
        baseIndex + i * columns + j,
        baseIndex + (i + 1) * columns + j,
        segmentLength,
        MATERIALS.cloth.tearMultiplier,
      ),
    ),
  );

  faces.push(...clothFaces.flat(2));
  points.push(...clothPoints.flat());
  constraints.push(
    ...horizontalConstraints.flat(),
    ...verticalConstraints.flat(),
  );
}

// ================================
// Physics
// ================================
function getGravity() {
  // if (requestMotionPermission() !== 'granted') {
  //   return { x: 0.1, y: SETTINGS.gravity }
  // }

  return {
    x: -accelerometer.normalized.x * SETTINGS.gravity,
    y: accelerometer.normalized.y * SETTINGS.gravity,
  };
}

function applyForces() {
  points.forEach((p) => {
    // Lock pinned
    if (p.pinned) {
      p.prevX = p.x;
      p.prevY = p.y;
      return;
    }

    // Gravity
    const gravity = getGravity();
    p.x += gravity.x;
    p.y += gravity.y;

    // Floor
    if (SETTINGS.showFloor && p.y >= floorY) {
      p.y = floorY;
      p.prevY = floorY;
    }
  });
}

function integrate() {
  for (const p of points) {
    if (p.pinned) continue;

    // Apply friction
    const vx = (p.x - p.prevX) * SETTINGS.friction;
    const vy = (p.y - p.prevY) * SETTINGS.friction;

    p.prevX = p.x;
    p.prevY = p.y;

    p.x += vx;
    p.y += vy;
  }
}

function satisfyConstraints() {
  // Repeat several times for stability
  for (let i = 0; i < SETTINGS.constraintIterations; i++) {
    // For each constraint:
    for (let k = 0; k < constraints.length; k++) {
      const c = constraints[k];
      // get two points
      const p1 = points[c.i1];
      const p2 = points[c.i2];

      // compute distance and cut constraint if too long
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;

      // tear
      if (dist > c.tearLength) {
        // remove face
        const tearFaces = faces.filter(
          (f) => [c.i1, c.i2].every((i) => [f.i1, f.i2, f.i3].includes(i)),
          // [f.i1, f.i2, f.i3].some((i) => i === c.i1 || i === c.i2),
        );
        tearFaces.forEach((face) => {
          faces.splice(faces.indexOf(face), 1);
        });
        constraints.splice(k, 1);
        k--;
        continue;
      }

      // compute and apply correction based on pinned state
      const stretch = dist / c.restLength;
      const computeStiffness = (stretch) => {
        let res = 1 * SETTINGS.friction;
        if (stretch > 1) res = (1 - stretch) * 0.8;

        return clamp(res, 0.7, 1.1);
      };
      const stiffness = computeStiffness(stretch);

      const correction = (dist - c.restLength) / dist;
      const cx = dx * correction * stiffness;
      const cy = dy * correction * stiffness;

      debug.setDebugData("cx/cy", {
        cx: cx.toFixed(2).padStart(5, "+"),
        cy: cy.toFixed(2).padStart(5, "+"),
      });

      if (!p1.pinned && !p2.pinned) {
        p1.x += cx * 0.5;
        p1.y += cy * 0.5;
        p2.x -= cx * 0.5;
        p2.y -= cy * 0.5;
      } else if (p1.pinned && !p2.pinned) {
        p2.y -= cy * 2;
        p2.x -= cx * 2;
      } else if (!p1.pinned && p2.pinned) {
        p1.x += cx * 2;
        p1.y += cy * 2;
      }
    }
  }
}

function applyMouse(applyFloor = true) {
  if (!mouse.down || !mouse.point) return;

  mouse.point.x = mouse.x;
  mouse.point.y = mouse.y;
  mouse.point.prevX = mouse.x;
  mouse.point.prevY = mouse.y;

  if (applyFloor && mouse.point.y >= floorY) {
    mouse.point.y = floorY;
    mouse.point.prevY = floorY;
  }
}

function updateDebugData() {
  debug.setDebugData("points", points.length);
  debug.setDebugData("constraints", constraints.length);
  debug.setDebugData("faces", faces.length);
  // debug.setDebugData("mouse", mouse);
  // debug.setDebugData("accelerometer", accelerometer);
}

function update() {
  applyMouse(SETTINGS.showFloor);
  applyForces();
  integrate();
  satisfyConstraints();

  updateDebugData();
}

// ================================
// Render
// ================================
function stressColor(t) {
  const r = Math.floor(255 * t);
  const g = Math.floor(200 * (1 - t));
  const b = 0;
  return `rgb(${r}, ${g}, ${b})`;
}

function renderFaces(ctx) {
  if (!isTextureImageLoaded) {
    return;
  }

  // Clear target buffer (set alpha to 0)
  targetImgData.data.fill(0);

  for (const f of faces) {
    const p1 = points[f.i1];
    const p2 = points[f.i2];
    const p3 = points[f.i3];
    // const p4 = points[f.i4];

    /*
   p1 -- p2
     \   |
      \  |
       \ |
        \|
         p3

    p1
     |\
     | \
     |  \
     |   \
    p4 -- p3
    */

    drawTexturedTriangle(
      targetImgData,
      textureData,
      p1,
      p2,
      p3,
      f.uv1,
      f.uv2,
      f.uv3,
    );

    // drawTexturedTriangle(
    //   ctx,
    //   targetImgData,
    //   textureData,
    //   p3,
    //   p4,
    //   p1,
    //   f.uv3,
    //   f.uv4,
    //   f.uv1
    // );
  }

  offscreenCtx.putImageData(targetImgData, 0, 0);
  ctx.drawImage(offscreenCanvas, 0, 0);
}

function renderSimulation(ctx) {
  // render constraints
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  for (const c of constraints) {
    const p1 = points[c.i1];
    const p2 = points[c.i2];

    // compute distance and stress
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // compute stress
    const t = clamp((dist - c.restLength) / (c.tearLength - c.restLength));

    if (t < 0.3) {
      continue;
    }

    ctx.strokeStyle = stressColor(t);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // render points
  ctx.fillStyle = "#002ffb";
  for (const p of points) {
    if (p.pinned) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderFloor(ctx) {
  ctx.fillStyle = "#ddd";
  ctx.fillRect(0, floorY, canvas.width, 2);
}

function renderMouse(ctx) {
  if (!mouse.point) return;

  if (mouse.down) {
    ctx.fillStyle = "lime";
    ctx.beginPath();
    ctx.arc(mouse.point.x, mouse.point.y, 8, 0, Math.PI * 2);
    ctx.fill();

    if (mouse.initialPinned) {
      ctx.fillStyle = "#002ffb";
      ctx.beginPath();
      ctx.arc(mouse.point.x, mouse.point.y, ctx.lineWidth, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.beginPath();
  ctx.arc(mouse.point.x, mouse.point.y, mouse.radius, 0, Math.PI * 2);
  ctx.fill();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (SETTINGS.showFloor) {
    renderFloor(ctx);
  }

  renderFaces(ctx);
  renderSimulation(ctx);
  renderMouse(ctx);
  fpsMeter.render(ctx);
}

// ================================
// Main loop
// ================================
function loop() {
  fpsMeter.update();
  update();
  render();
  requestAnimationFrame(loop);
}

// ================================
// Entry point
// ================================
// initRope({
//   startX: 2 * SETTINGS.pointSpacing,
//   startY: 2 * SETTINGS.pointSpacing,
//   horizontal: true,
//   segmentCount: 50,
//   segmentLength: SETTINGS.pointSpacing,
// });
// initRope({
//   startX: 38 * SETTINGS.pointSpacing,
//   startY: 2 * SETTINGS.pointSpacing,
//   segmentCount: 50,
//   segmentLength: SETTINGS.pointSpacing,
// });
const m = 2;
initCloth({
  startX: 4 * SETTINGS.pointSpacing,
  startY: 2 * SETTINGS.pointSpacing,
  rows: Math.ceil(18 / m),
  columns: Math.ceil(17 / m),
  pinTop: false,
  pinTopLeft: true,
  pinTopRight: true,
  // pinTopCenter: true,
  segmentLength: SETTINGS.pointSpacing * 2 * m,
});
void requestAnimationFrame(loop);
