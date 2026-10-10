import { describe, expect, it } from 'vitest';
import { centerEdgePoints } from '../../client/workflow-management/graph/center-edge.js';

describe('centered workflow connectors', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 0, y: 20 },
    { x: 100, y: 20 },
    { x: 100, y: 100 },
  ];
  it('centers vertical bends between the ports', () => {
    expect(centerEdgePoints(points, 'DOWN', [])).toEqual([
      points[0],
      { x: 0, y: 50 },
      { x: 100, y: 50 },
      points[3],
    ]);
  });
  it('centers horizontal bends between the ports', () => {
    expect(centerEdgePoints(points, 'RIGHT', [])).toEqual([
      points[0],
      { x: 50, y: 0 },
      { x: 50, y: 100 },
      points[3],
    ]);
  });
  it('keeps the original detour when a node blocks any centered segment', () => {
    for (const obstacle of [
      { x: 40, y: 40, width: 20, height: 20 },
      { x: -5, y: 25, width: 10, height: 10 },
      { x: 95, y: 65, width: 10, height: 10 },
    ]) {
      expect(centerEdgePoints(points, 'DOWN', [obstacle])).toBe(points);
    }
  });
  it('ignores nodes outside the route and keeps aligned ports straight', () => {
    expect(
      centerEdgePoints(points, 'DOWN', [
        { x: 200, y: 40, width: 20, height: 20 },
      ])[1].y,
    ).toBe(50);
    expect(
      centerEdgePoints(
        [
          { x: 0, y: 0 },
          { x: 0, y: 100 },
        ],
        'DOWN',
        [],
      ),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 100 },
    ]);
  });
});
