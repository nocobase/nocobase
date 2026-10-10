import { describe, expect, it } from 'vitest';
import {
  aggregateNodeRuns,
  buildExecutionOverlay,
  createLayoutInput,
  overlayExecution,
  projectWorkflowGraph,
} from '../../client/index.js';
import type { WorkflowSourceAst } from '../../server/instructions/types.js';

const inputSchema = { type: 'object' } as const;
function definition(nodes: WorkflowSourceAst['nodes']): WorkflowSourceAst {
  return { title: 'test', inputSchema, nodes };
}

describe('workflow client graph', () => {
  it('preserves node descriptions for canvas node details', () => {
    const graph = projectWorkflowGraph(
      definition([
        {
          key: 'notify',
          title: 'Notify owner',
          description: 'Send the final result to the record owner.',
          type: 'run',
          config: {},
        },
      ]),
    );

    expect(graph.nodes.find((node) => node.id === 'node:notify')).toMatchObject(
      {
        title: 'Notify owner',
        description: 'Send the final result to the record owner.',
      },
    );
  });

  it('projects a linear definition with stable boundary IDs', () => {
    const graph = projectWorkflowGraph(
      definition([
        { key: 'a', type: 'run', config: {} },
        { key: 'b', type: 'run', config: {} },
      ]),
    );
    expect(graph.nodes.map((node) => node.id)).toEqual([
      'end',
      'node:b',
      'node:a',
      'start',
    ]);
    expect(graph.edges.map((edge) => [edge.source, edge.target])).toEqual([
      ['node:b', 'end'],
      ['node:a', 'node:b'],
      ['start', 'node:a'],
    ]);
  });

  it('connects an empty branch directly to the common successor', () => {
    const graph = projectWorkflowGraph(
      definition([
        {
          key: 'gate',
          type: 'condition',
          config: {},
          branches: { yes: [{ key: 'yesTask', type: 'run', config: {} }] },
        },
        { key: 'after', type: 'run', config: {} },
      ]),
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'node:gate',
          target: 'node:yesTask',
          branchKey: 'yes',
          label: 'yes',
        }),
        expect.objectContaining({
          source: 'node:gate',
          target: 'node:after',
          branchKey: 'no',
          label: 'no',
        }),
      ]),
    );
  });

  it('keeps two empty branch edges distinct before they rejoin', () => {
    const graph = projectWorkflowGraph(
      definition([
        {
          key: 'gate',
          type: 'condition',
          config: {},
          branches: { yes: [], no: [] },
        },
        { key: 'after', type: 'run', config: {} },
      ]),
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'node:gate',
          target: 'node:after',
          branchKey: 'yes',
        }),
        expect.objectContaining({
          source: 'node:gate',
          target: 'node:after',
          branchKey: 'no',
        }),
      ]),
    );
  });

  it('projects a terminate instruction as terminal even inside a branch', () => {
    const graph = projectWorkflowGraph(
      definition([
        {
          key: 'gate',
          type: 'condition',
          config: {},
          branches: {
            no: [{ key: 'stop', type: 'terminate', config: {} }],
          },
        },
        { key: 'after', type: 'run', config: {} },
      ]),
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'node:gate',
          target: 'node:stop',
          branchKey: 'no',
        }),
        expect.objectContaining({
          source: 'node:stop',
          target: 'end',
          terminal: true,
        }),
      ]),
    );
    expect(
      graph.edges.some(
        (edge) => edge.source === 'node:stop' && edge.target === 'node:after',
      ),
    ).toBe(false);
    expect(graph.nodes.find((node) => node.id === 'node:stop')).toMatchObject({
      title: 'Terminate',
      nodeType: 'terminate',
      kind: 'workflow-node',
    });
    expect(graph.nodes.find((node) => node.id === 'end')).toMatchObject({
      title: 'End',
      nodeType: null,
      kind: 'end',
    });
  });

  it('projects nested branches and falls back for unknown nodes', () => {
    const graph = projectWorkflowGraph(
      definition([
        {
          key: 'outer',
          type: 'condition',
          config: {},
          branches: {
            yes: [
              {
                key: 'mystery',
                type: 'custom-x',
                config: {},
                branches: { custom: [] },
              },
            ],
          },
        },
      ]),
    );
    expect(
      graph.nodes.find((node) => node.id === 'node:mystery'),
    ).toMatchObject({ nodeType: 'custom-x', title: 'custom-x' });
    expect(
      graph.edges.some(
        (edge) => edge.source === 'node:mystery' && edge.branchKey === 'custom',
      ),
    ).toBe(true);
  });

  it('aggregates repeated attempts without losing them and overlays visited nodes', () => {
    const trace = aggregateNodeRuns('9', 1, [
      {
        id: '2',
        nodeKey: 'a',
        status: 1,
        startedAt: '2026-01-01T00:00:02Z',
        finishedAt: '2026-01-01T00:00:03Z',
      },
      {
        id: '1',
        nodeKey: 'a',
        status: -2,
        startedAt: '2026-01-01T00:00:00Z',
        finishedAt: '2026-01-01T00:00:01Z',
      },
    ]);
    expect(trace.nodesByKey.get('a')).toMatchObject({
      visitCount: 2,
      status: 'resolved',
    });
    expect(trace.nodesByKey.get('a')?.nodeRuns.map((run) => run.id)).toEqual([
      '1',
      '2',
    ]);
    const graph = projectWorkflowGraph(
      definition([{ key: 'a', type: 'run', config: {} }]),
    );
    const overlay = overlayExecution(graph, trace);
    expect(overlay.nodeStatus.get('node:a')).toBe('resolved');
    expect(overlay.nodeStatus.get('start')).toBe('resolved');
  });

  it('creates a renderer-independent layout contract', () => {
    const graph = projectWorkflowGraph(definition([]));
    expect(createLayoutInput(graph, 'DOWN')).toMatchObject({
      direction: 'DOWN',
      nodes: expect.any(Array),
      edges: expect.any(Array),
    });
  });

  it('describes condition branches as fixed left-to-right layout ports', () => {
    const graph = projectWorkflowGraph(
      definition([
        {
          key: 'gate',
          type: 'condition',
          config: {},
          branches: {
            yes: [{ key: 'yesTask', type: 'run', config: {} }],
            no: [{ key: 'noTask', type: 'run', config: {} }],
          },
        },
      ]),
    );
    const input = createLayoutInput(graph);
    expect(input.nodes.find((node) => node.id === 'node:gate')?.ports).toEqual([
      { id: 'node:gate:input', side: 'NORTH', index: 0 },
      { id: 'node:gate:branch:no', side: 'SOUTH', index: 1 },
      { id: 'node:gate:branch:yes', side: 'SOUTH', index: 0 },
    ]);
    expect(
      input.edges.find((edge) => edge.id.includes(':yes:'))?.sourcePort,
    ).toBe('node:gate:branch:yes');
    expect(
      input.edges.find((edge) => edge.id.includes(':no:'))?.sourcePort,
    ).toBe('node:gate:branch:no');
    expect(
      input.edges.every((edge) => edge.targetPort.endsWith(':input')),
    ).toBe(true);
    expect(
      createLayoutInput(graph, 'RIGHT').nodes.find(
        (node) => node.id === 'node:gate',
      )?.ports,
    ).toEqual([
      { id: 'node:gate:input', side: 'WEST', index: 0 },
      { id: 'node:gate:branch:no', side: 'EAST', index: 0 },
      { id: 'node:gate:branch:yes', side: 'EAST', index: 1 },
    ]);
  });

  it('infers the selected empty condition branch without inventing persisted evidence', () => {
    const graph = projectWorkflowGraph(
      definition([
        { key: 'gate', type: 'condition', config: {} },
        { key: 'after', type: 'run', config: {} },
      ]),
    );
    const overlay = buildExecutionOverlay(graph, '1', 1, [
      {
        id: '1',
        nodeKey: 'gate',
        status: 1,
        startedAt: '2026-01-01',
        finishedAt: '2026-01-01',
        result: false,
      },
      {
        id: '2',
        nodeKey: 'after',
        status: 1,
        startedAt: '2026-01-02',
        finishedAt: '2026-01-02',
      },
    ]);
    const noEdge = graph.edges.find(
      (edge) => edge.source === 'node:gate' && edge.branchKey === 'no',
    );
    const yesEdge = graph.edges.find(
      (edge) => edge.source === 'node:gate' && edge.branchKey === 'yes',
    );
    const endEdge = graph.edges.find(
      (edge) => edge.source === 'node:after' && edge.target === 'end',
    );
    expect(noEdge && overlay.edgeEvidence.get(noEdge.id)).toBe('inferred');
    expect(overlay.nodeStatus.get('node:after')).toBe('resolved');
    expect(yesEdge && overlay.traversedEdgeIds.has(yesEdge.id)).toBe(false);
    expect(endEdge && overlay.traversedEdgeIds.has(endEdge.id)).toBe(true);
    expect(overlay.nodeStatus.get('end')).toBe('resolved');
  });

  it('does not highlight the unselected branch when a condition is recalled after its branch', () => {
    const graph = projectWorkflowGraph(
      definition([
        {
          key: 'gate',
          type: 'condition',
          config: {},
          branches: { yes: [{ key: 'inside', type: 'run', config: {} }] },
        },
        { key: 'after', type: 'run', config: {} },
      ]),
    );
    const overlay = buildExecutionOverlay(graph, '1', 1, [
      {
        id: '1',
        nodeKey: 'gate',
        status: 1,
        startedAt: '1',
        finishedAt: '1',
        branchKey: 'yes',
      },
      {
        id: '2',
        nodeKey: 'inside',
        status: 1,
        startedAt: '2',
        finishedAt: '2',
      },
      { id: '3', nodeKey: 'gate', status: 1, startedAt: '3', finishedAt: '3' },
      { id: '4', nodeKey: 'after', status: 1, startedAt: '4', finishedAt: '4' },
    ]);
    const yesEdge = graph.edges.find(
      (edge) => edge.source === 'node:gate' && edge.branchKey === 'yes',
    );
    const noEdge = graph.edges.find(
      (edge) => edge.source === 'node:gate' && edge.branchKey === 'no',
    );
    expect(yesEdge && overlay.traversedEdgeIds.has(yesEdge.id)).toBe(true);
    expect(noEdge && overlay.traversedEdgeIds.has(noEdge.id)).toBe(false);
    const endEdge = graph.edges.find(
      (edge) => edge.source === 'node:after' && edge.target === 'end',
    );
    expect(endEdge && overlay.traversedEdgeIds.has(endEdge.id)).toBe(true);
  });

  it('highlights a selected no branch, its merge path, and the completed edge to end', () => {
    const graph = projectWorkflowGraph(
      definition([
        {
          key: 'gate',
          type: 'condition',
          config: {},
          branches: {
            yes: [{ key: 'yesTask', type: 'run', config: {} }],
            no: [{ key: 'noTask', type: 'run', config: {} }],
          },
        },
        { key: 'after', type: 'run', config: {} },
      ]),
    );
    const overlay = buildExecutionOverlay(graph, '1', 1, [
      {
        id: '1',
        nodeKey: 'gate',
        status: 1,
        startedAt: '1',
        finishedAt: '1',
        branchKey: 'no',
      },
      {
        id: '2',
        nodeKey: 'noTask',
        status: 1,
        startedAt: '2',
        finishedAt: '2',
      },
      { id: '3', nodeKey: 'gate', status: 1, startedAt: '3', finishedAt: '3' },
      { id: '4', nodeKey: 'after', status: 1, startedAt: '4', finishedAt: '4' },
    ]);
    const edge = (source: string, target: string) =>
      graph.edges.find(
        (item) => item.source === source && item.target === target,
      );
    expect(
      overlay.traversedEdgeIds.has(edge('node:gate', 'node:noTask')!.id),
    ).toBe(true);
    expect(
      overlay.traversedEdgeIds.has(edge('node:noTask', 'node:after')!.id),
    ).toBe(true);
    expect(overlay.traversedEdgeIds.has(edge('node:after', 'end')!.id)).toBe(
      true,
    );
    expect(
      overlay.traversedEdgeIds.has(edge('node:gate', 'node:yesTask')!.id),
    ).toBe(false);
  });
});
