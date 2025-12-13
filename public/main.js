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
// Entry point
// ================================

initCloth()
requestAnimationFrame(loop)
