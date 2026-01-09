import { RopeOptions, ClothOptions } from '../types';
import { PhysicsEngine, range } from './physics';
import { MATERIALS } from './settings';

// ================================
// Object initializers
// ================================
export class ObjectInitializer {
  private physics: PhysicsEngine;

  constructor(physics: PhysicsEngine) {
    this.physics = physics;
  }

  initRope(options: RopeOptions): void {
    const {
      startX,
      startY,
      segmentLength,
      segmentCount,
      pinFirst = true,
      pinLast = false,
      horizontal = false,
    } = options;

    const baseIndex = this.physics.getPoints().length;

    // Create points
    const ropePoints = range(segmentCount).map((i) =>
      this.physics.addPoint(
        startX + (horizontal ? i * segmentLength : 0),
        startY + (horizontal ? 0 : i * segmentLength),
        (pinFirst && i === 0) || (pinLast && i === segmentCount - 1),
      ),
    );

    // Create constraints
    range(segmentCount - 1).forEach((i) => {
      this.physics.addConstraint(
        baseIndex + i,
        baseIndex + i + 1,
        segmentLength,
        MATERIALS.rope.tearMultiplier,
      );
    });
  }

  initCloth(options: ClothOptions): void {
    const {
      startX,
      startY,
      rows,
      columns,
      segmentLength,
      pinTop = true,
      pinTopLeft = false,
      pinTopRight = false,
      pinTopCenter = false,
    } = options;

    const baseIndex = this.physics.getPoints().length;

    // Create points
    range(rows).forEach((i) =>
      range(columns).forEach((j) => {
        let pinned = false;
        if (pinTop && i === 0) pinned = true;
        if (pinTopLeft && i === 0 && j === 0) pinned = true;
        if (pinTopRight && i === 0 && j === columns - 1) pinned = true;
        if (pinTopCenter && i === 0 && j === Math.floor(columns / 2)) pinned = true;

        this.physics.addPoint(
          startX + j * segmentLength,
          startY + i * segmentLength,
          pinned,
        );
      }),
    );

    // Create faces
    range(rows - 1).forEach((i) =>
      range(columns - 1).forEach((j) => {
        // Two triangles per quad
        this.physics.addFace(
          baseIndex + i * columns + j,
          baseIndex + i * columns + j + 1,
          baseIndex + (i + 1) * columns + j + 1,
          { u: j / (columns - 1), v: i / (rows - 1) },
          { u: (j + 1) / (columns - 1), v: i / (rows - 1) },
          { u: (j + 1) / (columns - 1), v: (i + 1) / (rows - 1) },
        );

        this.physics.addFace(
          baseIndex + (i + 1) * columns + j + 1,
          baseIndex + (i + 1) * columns + j,
          baseIndex + i * columns + j,
          { u: (j + 1) / (columns - 1), v: (i + 1) / (rows - 1) },
          { u: j / (columns - 1), v: (i + 1) / (rows - 1) },
          { u: j / (columns - 1), v: i / (rows - 1) },
        );
      }),
    );

    // Create horizontal constraints
    range(rows).forEach((i) =>
      range(columns - 1).forEach((j) =>
        this.physics.addConstraint(
          baseIndex + i * columns + j,
          baseIndex + i * columns + j + 1,
          segmentLength,
          MATERIALS.cloth.tearMultiplier,
        ),
      ),
    );

    // Create vertical constraints
    range(rows - 1).forEach((i) =>
      range(columns).forEach((j) =>
        this.physics.addConstraint(
          baseIndex + i * columns + j,
          baseIndex + (i + 1) * columns + j,
          segmentLength,
          MATERIALS.cloth.tearMultiplier,
        ),
      ),
    );
  }
}