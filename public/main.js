// ================================
// Canvas setup
// ================================
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

window.addEventListener('resize', resizeCanvas)
resizeCanvas()


// ================================
// Simulation parameters
// ================================
const SETTINGS = {
  gravity: 0.4,
  friction: 0.999,
  constraintIterations: 4,
  pointSpacing: 15,
}


// ================================
// Material parameters
// ================================
const MATERIALS = {
  cloth: { tearMultiplier: 1.4 },
  rope: { tearMultiplier: 2.0 },
  rubber: { tearMultiplier: 3.0 },
}


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

const range = n => [...Array(n).keys()]

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

function renderRope(ctx) {
  ctx.strokeStyle = '#aaa'
  for (const c of constraints) {
    const p1 = points[c.i1]
    const p2 = points[c.i2]
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  }

  ctx.fillStyle = '#fff'
  for (const p of points) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}


// ================================
// Cloth initialization
// ================================
function initCloth() {
  // TODO:
  // 1. Create a grid of points
  // 2. Pin top row
  // 3. Store points in a flat array
  // 4. Create structural constraints (right and down neighbors)
}


// ================================
// Physics
// ================================
function applyForces() {
  points.forEach(p => {
    // Lock pinned
    if (p.pinned) {
      p.prevX = p.x
      p.prevY = p.y
      return
    }

    // Gravity
    p.y += SETTINGS.gravity
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
    for (const c of constraints) {
      // get two points
      const p1 = points[c.i1]
      const p2 = points[c.i2]

      // compute distance and cut constraint if too long
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist === 0) continue

      if (dist > c.tearLength) {
        constraints.splice(i, 1)
        continue
      }

      // compute and apply correction based on pinned state
      const diff = (dist - c.restLength) / dist
      const cx = dx * diff
      const cy = dy * diff

      if (!p1.pinned && !p2.pinned) {
        p1.x += cx * 0.5
        p1.y += cy * 0.5
        p2.x -= cx * 0.5
        p2.y -= cy * 0.5
      } else if (p1.pinned && !p2.pinned) {
        p2.x -= cx
        p2.y -= cy
      } else if (!p1.pinned && p2.pinned) {
        p1.x += cx
        p1.y += cy
      }
    }
  }
}

function update() {
  applyForces()
  integrate()
  satisfyConstraints()
}


// ================================
// Render
// ================================
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  renderRope(ctx)
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
  startX: canvas.width / 2,
  startY: 50,
  horizontal: true,
  segmentCount: 25,
  segmentLength: SETTINGS.pointSpacing,
})
initCloth()
requestAnimationFrame(loop)
