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

  mouseRadius: 10,
}


// ================================
// Material parameters
// ================================
const MATERIALS = {
  cloth: { tearMultiplier: 2.0 },
  rope: { tearMultiplier: 3.0 },
  rubber: { tearMultiplier: 6.0 },
}


// ================================
// Debug
// ================================
const debug = {
  showDebug: false,
  debugData: {},
  element: document.getElementById('debug'),
  setDebugText(data) {
    if (!this.showDebug) return
    this.element.textContent = JSON.stringify(data, null, 2)
  },
  clear() {
    this.debugData = {}
    this.update()
  },
  update() {
    this.setDebugText(this.debugData)
  },
  setDebugData(key, value) {
    this.debugData[key] = value
    this.update()
  },
}


// ================================
// Floor
// ================================
let floorY = 0


// ================================
// Canvas setup
// ================================
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')


function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  SETTINGS.pointSpacing = canvas.width / 40

  if (!SETTINGS.showFloor) return
  floorY = canvas.height - (canvas.height * SETTINGS.floorOffset) / 100
}

window.addEventListener('resize', resizeCanvas)
resizeCanvas()


// ================================
// Accelerometer
// ================================
const accelerometer = {
  raw: { x: 0, y: 9.8, z: 0 },
  filtered: { x: 0, y: 9.8, z: 0 },
  normalized: { x: 0, y: 1, z: 0 },
}
function handleMotion(event) {
  const smoothing = 0.2
  const { x = 0, y = 0, z = 0 } = event.accelerationIncludingGravity;

  // 1. Update Raw Data
  accelerometer.raw = { x, y, z }

  // 2. Low Pass Filter
  accelerometer.filtered.x += (x - accelerometer.filtered.x) * smoothing;
  accelerometer.filtered.y += (y - accelerometer.filtered.y) * smoothing;
  accelerometer.filtered.z += (z - accelerometer.filtered.z) * smoothing;

  // 3. Normalize
  // Handle Singularity: If device is lying flat (Gravity is all Z), X and Y are ~0.
  // This causes atan2(0,0) which is unstable/undefined behavior for horizon calculation.
  // We check if the XY magnitude is significant enough to determine orientation.
  const magnitude = Math.sqrt(accelerometer.filtered.x * accelerometer.filtered.x + accelerometer.filtered.y * accelerometer.filtered.y);

  const threshold = 1.0; // ~0.1g on XY plane required to update horizon

  if (magnitude > threshold) {
    accelerometer.normalized = normalizeVector(accelerometer.filtered);
  } else {
    // If flat, keep previous normalized vector to prevent "vertical rod" snapping
    // We do update Z though for debugging
    accelerometer.normalized.z = accelerometer.filtered.z / 9.8;
  }
}
window.addEventListener('devicemotion', handleMotion);


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
}

// Touch events
canvas.addEventListener('touchstart', e => {
  const rect = canvas.getBoundingClientRect()
  mouse.x = e.touches[0].clientX - rect.left
  mouse.y = e.touches[0].clientY - rect.top
  mouse.down = true

  mouse.point = findNearestPoint(mouse.x, mouse.y, mouse.radius)

  if (mouse.point) {
    mouse.initialPinned = mouse.point.pinned
    mouse.point.pinned = true
  }
})
canvas.addEventListener('touchmove', e => {
  const rect = canvas.getBoundingClientRect()
  const smoothing = 0.2
  mouse.x += (e.touches[0].clientX - rect.left - mouse.x) * smoothing
  mouse.y += (e.touches[0].clientY - rect.top - mouse.y) * smoothing
})
canvas.addEventListener('touchend', () => {
  mouse.down = false

  if (mouse.point) {
    mouse.point.pinned = mouse.initialPinned
    mouse.point = null
  }
})

// Mouse events
canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect()
  mouse.x = e.clientX - rect.left
  mouse.y = e.clientY - rect.top
  mouse.down = true

  mouse.point = findNearestPoint(mouse.x, mouse.y, mouse.radius)

  if (mouse.point) {
    mouse.initialPinned = mouse.point.pinned
    mouse.point.pinned = true
  }
})
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect()
  const smoothing = 0.2
  mouse.x += (e.clientX - rect.left - mouse.x) * smoothing
  mouse.y += (e.clientY - rect.top - mouse.y) * smoothing
})
canvas.addEventListener('mouseup', () => {
  mouse.down = false

  if (mouse.point) {
    mouse.point.pinned = mouse.initialPinned
    mouse.point = null
  }
})


// ================================
// Data containers
// ================================
const points = []
const constraints = []


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
  }
}

function createConstraint(i1, i2, restLength, tearMultiplier) {
  return {
    i1,
    i2,
    restLength,
    tearLength: restLength * tearMultiplier,
  }
}

function findNearestPoint(x, y, radius) {
  let nearest = null
  let minDist = radius * radius

  for (const p of points) {
    const dx = p.x - x
    const dy = p.y - y
    const dist = dx * dx + dy * dy

    if (dist < minDist) {
      minDist = dist
      nearest = p
    }
  }

  return nearest
}

const range = n => [...Array(n).keys()]
const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v))


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
    z: v.z / length
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
  const baseIndex = points.length

  const ropePoints = range(segmentCount).map(i =>
    createPoint(
      startX + (horizontal ? i * segmentLength : 0),
      startY + (horizontal ? 0 : i * segmentLength),
      (pinFirst && i === 0) || (pinLast && i === segmentCount - 1),
    ),
  )

  const ropeConstraints = range(segmentCount - 1).map(i =>
    createConstraint(
      baseIndex + i,
      baseIndex + i + 1,
      segmentLength,
      MATERIALS.rope.tearMultiplier,
    ),
  )

  points.push(...ropePoints)
  constraints.push(...ropeConstraints)
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
  const baseIndex = points.length

  const clothPoints = range(rows).map(i =>
    range(columns).map(j => {
      let pinned = false
      if (pinTop && i === 0) pinned = true
      if (pinTopLeft && i === 0 && j === 0) pinned = true
      if (pinTopRight && i === 0 && j === columns - 1) pinned = true
      if (pinTopCenter && i === 0 && j === Math.floor(columns / 2)) pinned = true

      return createPoint(
        startX + j * segmentLength,
        startY + i * segmentLength,
        pinned,
      )
    }),
  )

  const horizontalConstraints = range(rows).map(i =>
    range(columns - 1).map(j =>
      createConstraint(
        baseIndex + i * columns + j,
        baseIndex + i * columns + j + 1,
        segmentLength,
        MATERIALS.cloth.tearMultiplier,
      ),
    ),
  )

  const verticalConstraints = range(rows - 1).map(i =>
    range(columns).map(j =>
      createConstraint(
        baseIndex + i * columns + j,
        baseIndex + (i + 1) * columns + j,
        segmentLength,
        MATERIALS.cloth.tearMultiplier,
      ),
    ),
  )

  points.push(...clothPoints.flat())
  constraints.push(...horizontalConstraints.flat(), ...verticalConstraints.flat())
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
  }
}

function applyForces() {
  points.forEach(p => {
    // Lock pinned
    if (p.pinned) {
      p.prevX = p.x
      p.prevY = p.y
      return
    }

    // Gravity
    const gravity = getGravity()
    p.x += gravity.x
    p.y += gravity.y

    // Floor
    if (SETTINGS.showFloor && p.y >= floorY) {
      p.y = floorY
      p.prevY = floorY
    }
  })
}

function integrate() {
  for (const p of points) {
    if (p.pinned) continue

    // Apply friction
    const vx = (p.x - p.prevX) * SETTINGS.friction
    const vy = (p.y - p.prevY) * SETTINGS.friction

    p.prevX = p.x
    p.prevY = p.y

    p.x += vx
    p.y += vy
  }
}

function satisfyConstraints() {
  // Repeat several times for stability
  for (let i = 0; i < SETTINGS.constraintIterations; i++) {
    // For each constraint:
    for (let k = 0; k < constraints.length; k++) {
      const c = constraints[k]
      // get two points
      const p1 = points[c.i1]
      const p2 = points[c.i2]

      // compute distance and cut constraint if too long
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist === 0) continue

      if (dist > c.tearLength) {
        constraints.splice(k, 1)
        k--
        continue
      }

      // compute and apply correction based on pinned state
      const stretch = dist / c.restLength
      const computeStiffness = (stretch) => {
        let res = 1 * SETTINGS.friction
        if (stretch > 1) res = (1 - stretch) * 0.8

        return clamp(res, 0.7, 1.1)
      }
      const stiffness = computeStiffness(stretch)

      const correction = (dist - c.restLength) / dist
      const cx = dx * correction * stiffness
      const cy = dy * correction * stiffness

      if (!p1.pinned && !p2.pinned) {
        p1.x += cx * 0.5
        p1.y += cy * 0.5
        p2.x -= cx * 0.5
        p2.y -= cy * 0.5
      } else if (p1.pinned && !p2.pinned) {
        p2.y -= cy * 2
        p2.x -= cx * 2
      } else if (!p1.pinned && p2.pinned) {
        p1.x += cx * 2
        p1.y += cy * 2
      }
    }
  }
}

function applyMouse(applyFloor = true) {
  if (!mouse.down || !mouse.point) return

  mouse.point.x = mouse.x
  mouse.point.y = mouse.y
  mouse.point.prevX = mouse.x
  mouse.point.prevY = mouse.y

  if (applyFloor && mouse.point.y >= floorY) {
    mouse.point.y = floorY
    mouse.point.prevY = floorY
  }
}

function updateDebugData() {
  debug.setDebugData('mouse', mouse)
  debug.setDebugData('accelerometer', accelerometer)
}

function update() {
  applyMouse(SETTINGS.showFloor)
  applyForces()
  integrate()
  satisfyConstraints()

  updateDebugData()
}


// ================================
// Render
// ================================
function stressColor(t) {
  const r = Math.floor(255 * t)
  const g = Math.floor(200 * (1 - t))
  const b = 0
  return `rgb(${r}, ${g}, ${b})`
}

function renderSimulation(ctx) {
  // render constraints
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  for (const c of constraints) {
    const p1 = points[c.i1]
    const p2 = points[c.i2]

    // compute distance and stress
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    // compute stress
    const t = clamp(
      (dist - c.restLength) / (c.tearLength - c.restLength),
    )

    ctx.strokeStyle = stressColor(t)

    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  }

  // render points
  ctx.fillStyle = '#eee'
  for (const p of points) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function renderFloor(ctx) {
  ctx.fillStyle = '#ddd'
  ctx.fillRect(0, floorY, canvas.width, 2)
}

function renderMouse() {
  if (!mouse.point) return

  ctx.fillStyle = 'lime'
  ctx.beginPath()
  ctx.arc(mouse.point.x, mouse.point.y, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.beginPath()
  ctx.arc(mouse.point.x, mouse.point.y, mouse.radius, 0, Math.PI * 2)
  ctx.fill()
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (SETTINGS.showFloor) {
    renderFloor(ctx)
  }

  renderSimulation(ctx)

  renderMouse()
}


// ================================
// Main loop
// ================================
function loop() {
  update()
  render()
  requestAnimationFrame(loop)
}


// ================================
// Entry point
// ================================
initRope({
  startX: 2 * SETTINGS.pointSpacing,
  startY: 2 * SETTINGS.pointSpacing,
  horizontal: true,
  segmentCount: 50,
  segmentLength: SETTINGS.pointSpacing,
})
initRope({
  startX: 38 * SETTINGS.pointSpacing,
  startY: 2 * SETTINGS.pointSpacing,
  segmentCount: 50,
  segmentLength: SETTINGS.pointSpacing,
})
initCloth({
  startX: 4 * SETTINGS.pointSpacing,
  startY: 2 * SETTINGS.pointSpacing,
  rows: 18,
  columns: 17,
  pinTop: false,
  pinTopLeft: true,
  pinTopRight: true,
  pinTopCenter: true,
  segmentLength: SETTINGS.pointSpacing * 2,
})
requestAnimationFrame(loop)
