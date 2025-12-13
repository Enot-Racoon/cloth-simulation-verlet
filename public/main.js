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
    gravity: 0.5,
    friction: 0.999,
    constraintIterations: 5,
    pointSpacing: 15,
    clothWidth: 30,
    clothHeight: 20
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
        pinned
    }
}

function createConstraint(i1, i2, restLength) {
    return {
        i1,
        i2,
        restLength,
        tearLength: restLength * 1.5
    }
}

const range = n => [...Array(n).keys()]

function initRope({
    startX,
    startY,
    segmentLength,
    segmentCount,
    tearLength = 1.5,
    pinFirst = true,
    pinLast = false
}) {
    const rope = {
        length: segmentLength,
        points: range(segmentCount).map((i) => ({
            x: startX,
            y: startY + i * segmentLength,
            prevX: startX,
            prevY: startY + i * segmentLength,
            pinned: (pinFirst && i === 0) || (pinLast && i === segmentCount - 1)
        })),
        constraints: range(segmentCount - 1).map((i) => ({
            i1: i,
            i2: i + 1,
            tearLength,
            restLength: segmentLength,
        })),
    }

    points.push(...rope.points)
    constraints.push(...rope.constraints)
}

function debugRenderRope(ctx) {
    ctx.strokeStyle = '#888'

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
// Update physics
// ================================
function applyForces() {
    // TODO:
    // For each point:
    // - skip pinned points
    // - apply gravity as vertical acceleration
}

function integrate() {
    // TODO:
    // For each point:
    // - skip pinned
    // - compute velocity from current - previous
    // - apply friction
    // - update position
    // - store previous position
}

function satisfyConstraints() {
    // Repeat several times for stability
    for (let i = 0; i < SETTINGS.constraintIterations; i++) {
        // TODO:
        // For each constraint:
        // - get two points
        // - compute distance
        // - if distance > tearLength -> remove constraint
        // - compute correction
        // - apply correction based on pinned state
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

    debugRenderRope(ctx);
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
    segmentLength: 20,
    segmentCount: 25
})
initCloth()
requestAnimationFrame(loop)