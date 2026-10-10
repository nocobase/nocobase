import { describe, expect, it } from 'vitest';
import { terminalEdgePoints } from '../../client/workflow-management/graph/terminal-edge.js';

describe('terminal edge exit', () => {
  it.each([false, true])(
    'stops before a shared merge segment (horizontal: %s)',
    (horizontal) => {
      const point = (x: number, y: number) =>
        horizontal ? { x: y, y: x } : { x, y };
      const route = [point(100, 0), point(100, 100)];
      const continuation = [
        point(0, 0),
        point(0, 20),
        point(100, 20),
        point(100, 100),
      ];
      expect(terminalEdgePoints(route, [continuation])).toEqual([
        point(100, 0),
        point(100, 10),
      ]);
    },
  );

  it('keeps a long terminal path beside its source instead of following its detour', () => {
    expect(
      terminalEdgePoints(
        [
          { x: 0, y: 0 },
          { x: 0, y: 200 },
          { x: 300, y: 200 },
        ],
        [],
      ),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 28 },
    ]);
  });

  it('stops halfway to the first bend and ignores unrelated routes', () => {
    expect(
      terminalEdgePoints(
        [
          { x: 0, y: 0 },
          { x: 0, y: 20 },
          { x: 100, y: 20 },
        ],
        [
          [
            { x: 50, y: 5 },
            { x: 100, y: 5 },
          ],
        ],
      ),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ]);
  });
});
