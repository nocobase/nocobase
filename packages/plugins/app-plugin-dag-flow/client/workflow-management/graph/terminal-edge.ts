import type { WorkflowLayoutPoint } from '../../layout.js';

/** Keep terminal marks on the node's own exit, before any bend or shared route. */
export function terminalEdgePoints(
  points: readonly WorkflowLayoutPoint[],
  otherRoutes: readonly (readonly WorkflowLayoutPoint[])[],
): readonly WorkflowLayoutPoint[] {
  const start = points[0];
  const next = points.find(
    (point) => point.x !== start?.x || point.y !== start?.y,
  );
  if (!start || !next) return points;
  const vertical = start.x === next.x;
  const fixed = vertical ? start.x : start.y;
  const origin = vertical ? start.y : start.x;
  const end = vertical ? next.y : next.x;
  const direction = Math.sign(end - origin);
  let available = Math.abs(end - origin);
  for (const route of otherRoutes) {
    for (let index = 1; index < route.length; index += 1) {
      const a = route[index - 1];
      const b = route[index];
      const aFixed = vertical ? a.x : a.y;
      const bFixed = vertical ? b.x : b.y;
      const aAlong = vertical ? a.y : a.x;
      const bAlong = vertical ? b.y : b.x;
      if (fixed < Math.min(aFixed, bFixed) || fixed > Math.max(aFixed, bFixed))
        continue;
      // Orthogonal routes either cross the exit or overlap it; the nearest
      // positive endpoint is the beginning of a downstream shared segment.
      for (const coordinate of [aAlong, bAlong]) {
        const distance = (coordinate - origin) * direction;
        if (distance > 0) available = Math.min(available, distance);
      }
    }
  }
  // Canvas coordinates: half the default 56-unit layer gap, never a long
  // detour towards the common End node.
  const length = Math.min(28, available / 2);
  return [
    start,
    vertical
      ? { x: start.x, y: start.y + direction * length }
      : { x: start.x + direction * length, y: start.y },
  ];
}
