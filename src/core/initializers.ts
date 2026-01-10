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
      this.physics.createPoint(
        startX + (horizontal ? i * segmentLength : 0),
        startY + (horizontal ? 0 : i * segmentLength),
        (pinFirst && i === 0) || (pinLast && i === segmentCount - 1),
      ),
    );

    // Create constraints
    const ropeConstraints = range(segmentCount - 1).map((i) =>
      this.physics.createConstraint(
        baseIndex + i,
        baseIndex + i + 1,
        segmentLength,
        MATERIALS.rope.tearMultiplier,
      )
    );
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
    const clothPoints = range(rows).map((i) =>
      range(columns).map((j) => {
        let pinned = false;
        if (pinTop && i === 0) pinned = true;
        if (pinTopLeft && i === 0 && j === 0) pinned = true;
        if (pinTopRight && i === 0 && j === columns - 1) pinned = true;
        if (pinTopCenter && i === 0 && j === Math.floor(columns / 2)) pinned = true;

        return this.physics.createPoint(
          startX + j * segmentLength,
          startY + i * segmentLength,
          pinned,
        );
      }),
    );

    // Create faces
    const clothFaces = range(rows - 1).flatMap((i) =>
      range(columns - 1).map((j) => {
        // Two triangles per quad
        this.physics.createFace(
          baseIndex + i * columns + j,
          baseIndex + i * columns + j + 1,
          baseIndex + (i + 1) * columns + j + 1,
          { u: j / (columns - 1), v: i / (rows - 1) },
          { u: (j + 1) / (columns - 1), v: i / (rows - 1) },
          { u: (j + 1) / (columns - 1), v: (i + 1) / (rows - 1) },
        );

        this.physics.createFace(
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
    const clothHorisontalConstraints = range(rows).flatMap((i) =>
      range(columns - 1).map((j) =>
        this.physics.createConstraint(
          baseIndex + i * columns + j,
          baseIndex + i * columns + j + 1,
          segmentLength,
          MATERIALS.cloth.tearMultiplier,
        ),
      ),
    );

    // Create vertical constraints
    const clothVerticalConstraints = range(rows - 1).flatMap((i) =>
      range(columns).map((j) =>
        this.physics.createConstraint(
          baseIndex + i * columns + j,
          baseIndex + (i + 1) * columns + j,
          segmentLength,
          MATERIALS.cloth.tearMultiplier,
        ),
      ),
    );
  }
}