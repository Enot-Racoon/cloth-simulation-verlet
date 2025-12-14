# Verlet Rope / Cloth Playground

This repository is a small experimental project created for learning and exploring
basic ideas behind real-time physics simulation of ropes and cloth.

The goal of the project is not to be physically accurate, but to understand
how different modeling approaches work in practice:
how space is discretized, how constraints are applied, and how complex behavior
emerges from simple rules.

---

## What is implemented

At the current stage the project includes:

- Rope simulation based on **Verlet integration**
- Position-based constraints to preserve segment length
- Support for pinned points
- Gravity and friction
- Iterative constraint solver (stability vs stiffness tradeoff)
- Constraint tearing (breaking links)
- Non-linear stiffness (strain stiffening: material "resists" strong stretching)
- Mouse interaction (dragging points directly)
- Visual stress feedback (coloring constraints based on stretch)
- Simple UI controls for:
  - gravity
  - constraint iterations
  - tear strength

All rendering is done using HTML Canvas.

---

## Core ideas explored

This project is primarily educational and focuses on understanding:

- **Verlet integration**
  - Why velocity does not need to be stored explicitly
  - How previous position encodes inertia

- **Position-Based Dynamics (PBD)**
  - Constraints as geometric corrections, not forces
  - Iterative solvers and numerical stiffness

- **Discrete representations of continuous systems**
  - Points as nodes
  - Constraints as relationships
  - Meshes and grids as approximations of continuous material

- **Material behavior (simplified)**
  - Difference between elasticity, stiffness and breaking
  - Non-linear response to large deformation (strain stiffening)
  - Visualizing internal stress

The implementation intentionally avoids heavy math and FEM solvers in favor of
intuition, experimentation, and interactive feedback.

---

## What this is NOT

- This is not a physically accurate FEM implementation
- This is not meant for production use
- This is not a full physics engine

The focus is understanding concepts, not correctness to real-world units.

---

## Project structure (conceptual)

- `points`  
  Store particle state (current position, previous position, pinned state)

- `constraints`  
  Store relationships between points (rest length, tear threshold)

- `applyForces()`  
  Applies external forces (gravity)

- `integrate()`  
  Performs Verlet integration

- `satisfyConstraints()`  
  Enforces geometric constraints and handles tearing

- `render()`  
  Pure visualization, no physics logic

---

## Future ideas (optional)

These ideas are intentionally left for the future and are not implemented yet:

- 2D cloth simulation based on a grid of points
- Triangle-based rendering of cloth surface
- Plastic deformation (permanent stretching)
- Damage accumulation instead of instant tearing
- FEM-based solver for comparison
- Multiple material models (cloth, rope, rubber)
- WebGL rendering
- Exporting simulation states

---

## Why this project exists

This project exists as a learning playground to:

- experiment with physics concepts hands-on
- understand the tradeoffs between stability, realism and performance
- explore how complex behavior emerges from simple rules
- build intuition before diving into more formal methods like FEM

---

## License

MIT (or whatever you prefer)

---

## Notes

This project was built incrementally through experimentation.
Some decisions are pragmatic rather than theoretically optimal,
and that is intentional.
