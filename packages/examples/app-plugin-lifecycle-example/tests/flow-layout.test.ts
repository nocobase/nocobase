import { describeLifecycle } from '@nocobase/lifecycle';
import { describe, expect, it } from 'vitest';

import {
  layoutFlowDiagram,
  type FlowDiagramLayout,
} from '../client/components/flow-layout.js';
import { lifecycleDiagramGraph } from '../client/components/lifecycle-diagram-model.js';
import { orderLifecycle } from '../server/lifecycles/order.js';

function countCrossings(layout: FlowDiagramLayout): number {
  const segments = layout.edges.flatMap((edge) =>
    edge.points
      .slice(1)
      .map((end, index) => ({ id: edge.id, start: edge.points[index], end })),
  );
  let count = 0;
  for (const [index, first] of segments.entries()) {
    for (const second of segments.slice(index + 1)) {
      if (first.id === second.id) continue;
      const [horizontal, vertical] =
        first.start.y === first.end.y ? [first, second] : [second, first];
      const { start: a, end: b } = horizontal;
      const { start: c, end: d } = vertical;
      if (a.y !== b.y || c.x !== d.x) continue;
      if (
        c.x > Math.min(a.x, b.x) &&
        c.x < Math.max(a.x, b.x) &&
        a.y > Math.min(c.y, d.y) &&
        a.y < Math.max(c.y, d.y)
      )
        count++;
    }
  }
  return count;
}

describe('lifecycle example routing', () => {
  it.each(['DOWN', 'RIGHT'] as const)(
    'anchors every order label on its own edge in %s',
    async (direction) => {
      const graph = lifecycleDiagramGraph(describeLifecycle(orderLifecycle));
      const layout = await layoutFlowDiagram(graph, direction);
      for (const edge of layout.edges) {
        const label = edge.labelPosition!;
        expect(label).toBeDefined();
        const onEdge = edge.points.slice(1).some((end, index) => {
          const start = edge.points[index];
          return (
            (Math.abs(start.x - end.x) < 1e-6 &&
              Math.abs(label.x - start.x) < 1e-6 &&
              label.y >= Math.min(start.y, end.y) &&
              label.y <= Math.max(start.y, end.y)) ||
            (Math.abs(start.y - end.y) < 1e-6 &&
              Math.abs(label.y - start.y) < 1e-6 &&
              label.x >= Math.min(start.x, end.x) &&
              label.x <= Math.max(start.x, end.x))
          );
        });
        expect(onEdge, `${edge.id} label must sit on its own route`).toBe(true);
        for (const node of layout.nodes) {
          expect(
            label.x > node.x &&
              label.x < node.x + node.width &&
              label.y > node.y &&
              label.y < node.y + node.height,
          ).toBe(false);
        }
      }
    },
  );
  it('keeps all order transitions while reducing crossings and avoiding nodes', async () => {
    const graph = lifecycleDiagramGraph(describeLifecycle(orderLifecycle), {
      endLabel: 'End',
    });
    const layout = await layoutFlowDiagram(graph, 'DOWN');
    // Fixed declaration-order ports caused 15 crossings in this actual order graph.
    expect(countCrossings(layout)).toBeLessThanOrEqual(2);
    expect(layout.edges.map((edge) => edge.id)).toEqual(
      graph.edges.map((edge) => edge.id),
    );
    for (const edge of layout.edges) {
      expect(edge.points.length).toBeGreaterThan(1);
      for (const [index, end] of edge.points.entries()) {
        if (!index) continue;
        const start = edge.points[index - 1];
        expect(start.x === end.x || start.y === end.y).toBe(true);
        for (const node of layout.nodes) {
          const overlaps =
            start.x === end.x
              ? start.x > node.x &&
                start.x < node.x + node.width &&
                Math.max(start.y, end.y) > node.y &&
                Math.min(start.y, end.y) < node.y + node.height
              : start.y > node.y &&
                start.y < node.y + node.height &&
                Math.max(start.x, end.x) > node.x &&
                Math.min(start.x, end.x) < node.x + node.width;
          expect(overlaps, `${edge.id} crosses ${node.id}`).toBe(false);
        }
      }
    }
  });

  it.each(['DOWN', 'RIGHT'] as const)(
    'preserves separate parallel, retry and self-loop routes in %s',
    async (direction) => {
      const graph = {
        nodes: ['start', 'waiting', 'done'].map((id) => ({ id, label: id })),
        edges: [
          { id: 'next', source: 'start', target: 'waiting' },
          { id: 'parallel', source: 'start', target: 'waiting' },
          { id: 'retry', source: 'waiting', target: 'start' },
          { id: 'self', source: 'waiting', target: 'waiting' },
          { id: 'finish', source: 'waiting', target: 'done' },
        ],
      };
      const layout = await layoutFlowDiagram(
        {
          ...graph,
          edges: graph.edges.map((edge) => ({ ...edge, label: edge.id })),
        },
        direction,
      );
      expect(layout.edges).toHaveLength(graph.edges.length);
      expect(layout.edges[0].points).not.toEqual(layout.edges[1].points);
      for (const edge of layout.edges) {
        expect(edge.points.length).toBeGreaterThan(1);
        for (const point of edge.points) {
          expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(
            true,
          );
        }
      }
    },
  );
});
