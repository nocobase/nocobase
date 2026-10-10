import type {
  WorkflowLayoutDirection,
  WorkflowLayoutPoint,
} from '../../layout.js';

interface Obstacle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Prefer a symmetric orthogonal route, retaining ELK's detour if obstructed. */
export function centerEdgePoints(
  points: readonly WorkflowLayoutPoint[],
  direction: WorkflowLayoutDirection,
  obstacles: readonly Obstacle[],
): readonly WorkflowLayoutPoint[] {
  const start = points[0];
  const end = points.at(-1);
  if (!start || !end) return points;
  const vertical = direction === 'DOWN';
  if (vertical ? end.y <= start.y : end.x <= start.x) return points;
  const middle = vertical ? (start.y + end.y) / 2 : (start.x + end.x) / 2;
  const candidate = vertical
    ? [start, { x: start.x, y: middle }, { x: end.x, y: middle }, end]
    : [start, { x: middle, y: start.y }, { x: middle, y: end.y }, end];
  const blocked = candidate.slice(1).some((b, index) => {
    const a = candidate[index];
    return obstacles.some(
      (node) =>
        // Preserve a small clearance around unrelated nodes, including corners.
        Math.max(a.x, b.x) >= node.x - 8 &&
        Math.min(a.x, b.x) <= node.x + node.width + 8 &&
        Math.max(a.y, b.y) >= node.y - 8 &&
        Math.min(a.y, b.y) <= node.y + node.height + 8,
    );
  });
  if (blocked) return points;
  if (start.x === end.x || start.y === end.y) return [start, end];
  return candidate;
}
