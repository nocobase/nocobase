// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { layoutFlowDiagram } from '../../registry/components/flow-layout.js';

const graph = {
  nodes: ['a', 'b', 'c', 'isolated'].map((id) => ({ id, label: id })),
  edges: [
    { id: 'next', source: 'a', target: 'b', label: 'Next' },
    { id: 'parallel', source: 'a', target: 'b', label: 'Another way' },
    { id: 'back', source: 'b', target: 'a', label: 'Return' },
    { id: 'self', source: 'b', target: 'b', label: 'Reassign' },
    { id: 'branch', source: 'a', target: 'c', label: 'Branch' },
  ],
};

describe('ELK layout and routing', () => {
  it.each(['RIGHT', 'DOWN'] as const)(
    'routes cycles, self-loops, branches and parallel edges in %s',
    async (direction) => {
      const result = await layoutFlowDiagram(graph, direction);
      expect(result.nodes.map((node) => node.id)).toEqual([
        'a',
        'b',
        'c',
        'isolated',
      ]);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      for (const node of result.nodes) {
        expect(node.x + node.width).toBeLessThanOrEqual(result.width);
        expect(node.y + node.height).toBeLessThanOrEqual(result.height);
        expect(Number.isFinite(node.x) && Number.isFinite(node.y)).toBe(true);
        for (const other of result.nodes.filter(
          (item) => item.id !== node.id,
        )) {
          expect(
            node.x + node.width <= other.x ||
              other.x + other.width <= node.x ||
              node.y + node.height <= other.y ||
              other.y + other.height <= node.y,
          ).toBe(true);
        }
      }
      expect(result.edges).toHaveLength(graph.edges.length);
      for (const edge of result.edges) {
        expect(edge.points.length).toBeGreaterThan(1);
        expect(edge.labelPosition).toBeDefined();
        const label = edge.labelPosition!;
        expect(
          edge.points.some((point, index) => {
            const next = edge.points[index + 1];
            if (!next) return false;
            return (
              (point.x === next.x &&
                label.x === point.x &&
                label.y >= Math.min(point.y, next.y) &&
                label.y <= Math.max(point.y, next.y)) ||
              (point.y === next.y &&
                label.y === point.y &&
                label.x >= Math.min(point.x, next.x) &&
                label.x <= Math.max(point.x, next.x))
            );
          }),
        ).toBe(true);
        const source = result.nodes.find((node) => node.id === edge.source)!;
        const target = result.nodes.find((node) => node.id === edge.target)!;
        const first = edge.points[0]!;
        const last = edge.points.at(-1)!;
        if (direction === 'RIGHT') {
          expect(first.x).toBe(source.x + source.width);
          expect(first.y).toBeGreaterThanOrEqual(source.y);
          expect(first.y).toBeLessThanOrEqual(source.y + source.height);
          expect(last.x).toBe(target.x);
          expect(last.y).toBeGreaterThanOrEqual(target.y);
          expect(last.y).toBeLessThanOrEqual(target.y + target.height);
        } else {
          expect(first.y).toBe(source.y + source.height);
          expect(first.x).toBeGreaterThanOrEqual(source.x);
          expect(first.x).toBeLessThanOrEqual(source.x + source.width);
          expect(last.y).toBe(target.y);
          expect(last.x).toBeGreaterThanOrEqual(target.x);
          expect(last.x).toBeLessThanOrEqual(target.x + target.width);
        }
        for (let index = 1; index < edge.points.length; index++) {
          const before = edge.points[index - 1]!;
          const after = edge.points[index]!;
          expect(
            Math.abs(before.x - after.x) < 1e-6 ||
              Math.abs(before.y - after.y) < 1e-6,
          ).toBe(true);
        }
      }
      expect(result.edges[0]!.points).not.toEqual(result.edges[1]!.points);
    },
  );

  it('keeps the declared forward path ordered when later states retry earlier states', async () => {
    const result = await layoutFlowDiagram(
      {
        nodes: ['draft', 'checkout', 'waiting', 'failed', 'paid'].map((id) => ({
          id,
          label: id,
        })),
        edges: [
          { id: 'start', source: 'draft', target: 'checkout' },
          { id: 'created', source: 'checkout', target: 'waiting' },
          { id: 'declined', source: 'waiting', target: 'failed' },
          { id: 'retry', source: 'failed', target: 'checkout' },
          { id: 'paid', source: 'waiting', target: 'paid' },
        ],
      },
      'DOWN',
    );
    const y = (id: string) => result.nodes.find((node) => node.id === id)!.y;
    expect(y('draft')).toBeLessThan(y('checkout'));
    expect(y('checkout')).toBeLessThan(y('waiting'));
    expect(y('waiting')).toBeLessThan(y('failed'));
  });

  it('returns an empty graph', async () => {
    expect(await layoutFlowDiagram({ nodes: [], edges: [] })).toEqual({
      width: 0,
      height: 0,
      nodes: [],
      edges: [],
    });
  });

  it('rejects missing endpoints and duplicate identities before layout', async () => {
    await expect(
      layoutFlowDiagram({ nodes: [], edges: graph.edges }),
    ).rejects.toThrow('Unknown endpoint');
    await expect(
      layoutFlowDiagram({
        nodes: [graph.nodes[0]!, graph.nodes[0]!],
        edges: [],
      }),
    ).rejects.toThrow('Duplicate node');
    await expect(
      layoutFlowDiagram({
        nodes: graph.nodes,
        edges: [graph.edges[0]!, graph.edges[0]!],
      }),
    ).rejects.toThrow('Duplicate edge');
  });

  it('keeps caller ids distinct from internal port ids', async () => {
    const nodes = ['root', 'n0:out', 'e0'].map((id) => ({
      id,
      label: id,
      width: 180,
      height: 80,
    }));
    const result = await layoutFlowDiagram({
      nodes,
      edges: [{ id: 'root', source: 'root', target: 'n0:out' }],
    });
    expect(result.nodes.map((node) => node.id)).toEqual(
      nodes.map((node) => node.id),
    );
    expect(result.edges[0]!.points).toHaveLength(2);
  });
});
